# Fix i18n Parser for Dot-Notation Keys

## Vấn đề

`check-locale-coverage.mjs` báo thiếu 11 keys từ `settings.ts`:
- settings.items.dark_mode
- settings.items.dark_mode_description
- settings.items.language_description
- settings.items.email_notifications
- settings.items.email_notifications_description
- settings.items.push_notifications
- settings.items.push_notifications_description
- settings.items.change_password
- settings.items.change_password_description
- settings.items.two_factor
- settings.items.two_factor_description

Các keys này ĐÃ CÓ trong `src/locales/vi/settings.ts` với format:
```typescript
export const settings = {
  items.dark_mode: "...",
  items.dark_mode_description: "...",
  ...
}
```

## Nguyên nhân

`parseObjectKeys()` function chỉ parse keys là valid JS identifiers (`/[\w$]/`), không hỗ trợ keys với dấu chấm như `items.dark_mode`.

## Giải pháp

### 1. `scripts/check-locale-coverage.mjs`

**Line 79:** Đổi regex hỗ trợ dot-notation
```javascript
// Before: /[\w$]/
// After:  /[\w$.]/
```

**parseSubModuleKeys:** Thêm logic xử lý flat keys với dấu chấm
```javascript
const hasDotKeys = Object.keys(innerObj).some(k => k.includes('.'));
if (hasDotKeys) {
  const flatKeys = Object.keys(innerObj).map(k => `${varName}.${k}`);
  allKeys.push(...flatKeys);
}
```

### 2. `scripts/validate-i18n-keys.mjs`

Fix tương tự:
- Line 79: Đổi regex sang `/[\w$.]/`
- `extractKeysFromModule`: Thêm check `hasDotKeys`
- Tách `hasNestedChildren` thành function riêng

## Verification

```bash
$ node scripts/validate-i18n-keys.mjs

Extracting translation keys from source files...
Found 1743 unique translation keys

Validating src/locales/vi.ts...
OK — all keys present (1743 keys checked)

Validating src/locales/en.ts...
OK — all keys present (1743 keys checked)

Checking key symmetry between en/ and vi/ sub-modules...
OK — settings.ts (21 keys match)
```

✅ Tất cả 11 settings.items.* keys giờ được tìm thấy
✅ 1743 translation keys validated thành công
✅ vi.ts và en.ts đối xứng

## Files Modified

- `scripts/check-locale-coverage.mjs` (lines 79, 134-199)
- `scripts/validate-i18n-keys.mjs` (lines 79, 16-37)

## Unresolved Questions

None
