# Fix i18n:validate OOM/Crash

## Context
Command `npm run i18n:validate` calls `node scripts/validate-i18n-keys.mjs`, which relies on `scripts/extract-translation-keys.mjs` and `scripts/check-locale-coverage.mjs`. Quá trình kiểm tra báo cáo lỗi `exit code null`, cho thấy tiến trình có thể đã bị hệ điều hành (OS) kill do Out of Memory (OOM) hoặc chạy vào vòng lặp vô hạn.

## Vấn đề hiện tại (Root causes)

Sau khi phân tích các file mã nguồn liên quan trong thư mục `scripts/`:

1. **Vấn đề trong `extract-translation-keys.mjs`**:
   - Hàm `extractKeysFromContent` sử dụng đoạn code lấy line number rất tốn bộ nhớ và thời gian với những file lớn:
     ```javascript
     line: content.substring(0, match.index).split('\n').length
     ```
     Với file lớn hoặc có nhiều keys, việc liên tục gọi `substring` tạo chuỗi mới và `split('\n')` tạo mảng mới cho *mỗi* match sẽ làm RAM tăng đột biến và có nguy cơ khiến V8 crash, đặc biệt nếu chạy trên CI environment bộ nhớ thấp.

2. **Vấn đề trong việc load toàn bộ AST (`check-locale-coverage.mjs`)**:
   - Script đang parse toàn bộ AST của file locale (VD: `vi.ts` với kích thước 111KB) vào bộ nhớ. Nếu ứng dụng có số lượng keys khổng lồ, AST tree sẽ chiếm bộ nhớ rất lớn. Mặc dù ở mức 111KB hiện tại không quá nghiêm trọng, nhưng đây có thể là nguyên nhân OOM khi scale project.

3. **Vấn đề Garbage Collection**:
   - Script đọc toàn bộ nội dung của mọi file TS/TSX trong project vào một mảng duy nhất `allKeys` trước khi thực hiện deduplicate.

## Giải pháp (Implementation Steps)

Để ngăn chặn OOM và cải thiện hiệu năng, chúng ta sẽ tối ưu hóa như sau:

1. **Sửa đổi `scripts/extract-translation-keys.mjs`**:
   - Thay thế việc tính dòng bằng cách đếm số newline giữa các lần match.
   - Thay vì lưu tất cả keys vào `allKeys` rồi mới lọc, chúng ta sẽ deduplicate trực tiếp tại thời điểm extract keys bằng `Map` hoặc `Set` để giảm số lượng object trong bộ nhớ.
   - Thay vì đọc file dùng `readFileSync`, có thể giữ nguyên nếu file size nhỏ, nhưng việc tránh tạo thêm chuỗi trung gian là điều quan trọng nhất.

2. **Files cần sửa đổi (Tối đa 5 file)**:
   - `scripts/extract-translation-keys.mjs`

### Các bước chi tiết:

1. Trong `scripts/extract-translation-keys.mjs`, cập nhật hàm `extractKeysFromContent`:
```javascript
function extractKeysFromContent(content, filePath) {
  const keys = [];
  const tFunctionPattern = /\bt\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;

  let match;
  let lastIndex = 0;
  let currentLine = 1;

  while ((match = tFunctionPattern.exec(content)) !== null) {
    // Đếm newline từ lastIndex đến match.index
    for (let i = lastIndex; i < match.index; i++) {
      if (content[i] === '\n') currentLine++;
    }
    lastIndex = match.index;

    keys.push({
      key: match[2],
      file: filePath,
      line: currentLine,
    });
  }

  return keys;
}
```

2. Tối ưu deduplicate trong `extractAllTranslationKeys`:
```javascript
export function extractAllTranslationKeys(srcDir = 'src') {
  const files = findSourceFiles(srcDir);
  const uniqueKeysMap = new Map();

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const keys = extractKeysFromContent(content, file);

    // Add to map to deduplicate memory early
    for (const item of keys) {
      if (!uniqueKeysMap.has(item.key)) {
        uniqueKeysMap.set(item.key, item);
      }
    }
  }

  return Array.from(uniqueKeysMap.values());
}
```

## Success Criteria
- Lệnh `npm run i18n:validate` thực hiện nhanh hơn đáng kể.
- Không gặp hiện tượng treo hoặc `exit code null` khi chạy.
- Kết quả validation giữ nguyên tính chính xác.