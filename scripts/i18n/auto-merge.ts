/**
 * i18n Auto-Merge Script - 100x Deep Clean
 * Automatically merges all missing keys into the locale file
 */

import * as fs from 'fs';

// Vietnamese text mappings for common keys
const viTextMap: Record<string, string> = {
    // Common Vietnamese words (decoded from AST keys)
    'doanh_s': 'Doanh số',
    'doanh_s_1': 'Doanh số',
    'doanh_s_2': 'Doanh số',
    'doanh_s_cao_nh_t_th_ng_n_y': 'Doanh số cao nhất tháng này',
    'top_3_t_ng_t_i': 'Top 3 tổng tài',
    'th_nh_vi_n_c_n_ch': 'Thành viên cần chú ý',
    'th_nh_vi_n_r_i_ro_cao': 'Thành viên rủi ro cao',
    'th_nh_vi_n_r_i_ro_trung_b_nh': 'Thành viên rủi ro trung bình',
    'ai_ph_t_hi_n_nh_ng_th_nh_vi_n': 'AI phát hiện những thành viên',
    'ai_xu_t': 'AI đề xuất',
    'ai_xu_t_h_nh_ng': 'AI đề xuất hành động',
    'c_n_ch': 'Cần chú ý',
    'g_i_nh_c_nh': 'Gửi nhắc nhở',
    'l_do_c_n_ch': 'Lý do cần chú ý',
    'qu_n_l_i_nh_m': 'Quản lý đội nhóm',
    's_h_th_ng': 'Sơ đồ hệ thống',
    't_l_gi_ch_n': 'Tỷ lệ giữ chân',
    't_ng_qu_kh_ch_l': 'Tổng quan khách hàng',
    'doanh_thu_hi_n_t_i': 'Doanh thu hiện tại',
    'm_c_ti_u_2026': 'Mục tiêu 2026',
    'c_n_t_ng_t_c': 'Cần tăng tốc',
    'v_t_ti_n': 'Vượt tiến độ',
    'i_m_s_t_ng_kh_a_c_nh_s_c_kh': 'Điểm số từng khía cạnh sức khỏe',
    'l_i_ch_kh_c': 'Lợi ích khác',
    'ph_n_t_ch_chi_ti_t': 'Phân tích chi tiết',
    's_n_ph_m_c_ai_xu_t_d_nh': 'Sản phẩm được AI đề xuất dành',
    'u_ti_n': 'Ưu tiên',
    'kh_i_nghi_p': 'Khởi nghiệp',
    'c_ng_t_c_vi_n_ctv': 'Cộng tác viên (CTV)',
    'i_s': 'ID số',
    's_h_th_ng_network_tree': 'Sơ đồ hệ thống Network Tree',
    'nh_p_c_y_add_member': 'Nhập đầy đủ để Add Member',
    'b_l_c': 'Bộ lọc',
    'danh_m_c': 'Danh mục',
    'kho_ng_gi': 'Khoảng giá',
    't_l_i_b_l_c': 'Thiết lại bộ lọc',
    'ai_ang_vi_t_c_u_chuy_n': 'AI đang viết câu chuyện',
    'ai_vi_t_c_u_chuy_n_c_a_t_i': 'AI viết câu chuyện của tôi',
    'ai_s_t_o_landing_page_chuy_n': 'AI sẽ tạo Landing Page chuyên',
    'ch_n_template': 'Chọn Template',
    'ch_n_template_v_click_ai_vi': 'Chọn Template và Click AI viết',
    'chuy_n_i': 'Chuyển đổi',
    'click_t_i_nh_l_n': 'Click tải ảnh lên',
    'click_thay_i': 'Click thay đổi',
    'l_t_xem': 'Lượt xem',
    'landing_page_xu_t_b_n': 'Landing Page xuất bản',
    'landing_pages_t_o': 'Landing Pages tạo',
    'link_s_n_s_ng_chia_s': 'Link sẵn sàng chia sẻ',
    'nh_t_i_l_n': 'Nhấn tải lên',
    't_l': 'Tỷ lệ',
    't_o_trang_tuy_n_d_ng_chuy_n_ng': 'Tạo trang tuyển dụng chuyên nghiệp',
    'upload_nh_ch_n_dung': 'Upload ảnh chân dung',
    'xu_t_b_n_ngay': 'Xuất bản ngay',
    'th_l_i': 'Thử lại',
    'x_y_ra_l_i': 'Xảy ra lỗi',
    't_ng_t_i_s_n': 'Tổng tài sản',
    'th_ng_n_y': 'Tháng này',
    'n_p_shop': 'Nạp SHOP',
    '4_9': '4.9',
    '12': '12%',
    '12_0': '12.0%',
    '12_5': '12.5%',
    '90': '90',
    '100': '100%',
    '1_000_000_usd': '$1,000,000 USD',
};

// Read the gap report
const gapReport = fs.readFileSync('/tmp/gap_report.txt', 'utf-8');

// Extract missing keys by section
const sectionPattern = /\/\/ (\w+) - (\d+) missing\n([\s\S]*?)(?=\n\/\/ \w+ - \d+ missing|\n={10,})/g;
const sections: Record<string, string[]> = {};

let match;
while ((match = sectionPattern.exec(gapReport)) !== null) {
    const sectionName = match[1];
    const keysText = match[3];
    const keys = keysText.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith("'',"))
        .map(line => line.replace(":''", '').replace(',', '').trim());

    if (keys.length > 0) {
        sections[sectionName] = keys;
    }
}

// Generate TypeScript additions with proper Vietnamese text
console.log('// ======================================');
console.log('// FINAL ADDITIONS TO vi.ts (263 keys)');
console.log('// ======================================');
console.log('');

function keyToText(key: string): string {
    if (viTextMap[key]) return viTextMap[key];

    // Handle numbers
    if (/^\d+$/.test(key)) return key;
    if (/^\d+_\d+$/.test(key)) return key.replace('_', '.');
    if (/^\d+_\d+_\d+$/.test(key)) return key.replace(/_/g, '.');

    // Handle special patterns
    if (key.startsWith('v_')) return key.replace(/_/g, '.').replace('v.', 'v');

    // Default: title case
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

let totalKeys = 0;
for (const [section, keys] of Object.entries(sections).sort()) {
    console.log(`  // ${section} additions (${keys.length} keys)`);
    for (const key of keys.sort()) {
        const text = keyToText(key);
        console.log(`    ${key}: '${text}',`);
        totalKeys++;
    }
    console.log('');
}

console.log(`// Total keys generated: ${totalKeys}`);
