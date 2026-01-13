/**
 * i18n Batch Fix Script v2
 * Extracts all t() keys from codebase and generates missing translations
 * with proper Vietnamese text decoding
 */

import * as fs from 'fs';

// Vietnamese key to text mapping for common patterns
const viKeyMap: Record<string, string> = {
    // Common Vietnamese words (decoded from AST keys)
    'ng_xu_t': 'Đăng xuất',
    'ng_nh_p': 'Đăng nhập',
    'ng_k': 'Đăng ký',
    'ng_k_1': 'Đăng ký',
    'b_t_u': 'Bắt đầu',
    'b_t_u_ngay': 'Bắt đầu ngay',
    'b_ng_i_u_khi_n': 'Bảng điều khiển',
    'nh_n_th_ng_tin': 'Nhận thông tin',
    'c_quy_n': 'độc quyền',
    'c_ng_ng': 'Cộng đồng',
    'c_u_chuy_n_th_nh_c_ng': 'Câu chuyện thành công',
    'ch_c_n': 'Chỉ còn',
    's_n_ph_m': 'Sản phẩm',
    's_n_s_ng': 'Sẵn sàng',
    't_ng_t_i_s_n': 'Tổng tài sản',
    'th_ng_n_y': 'Tháng này',
    'ho_t_ng': 'Hoạt động',
    'h_y': 'Hủy',
    'm_t_kh_u': 'Mật khẩu',
    'x_c_nh_n': 'Xác nhận',
    'l_ch_s': 'Lịch sử',
    'ph_t': 'phút',
    'gi': 'giờ',
    '15_ph_t': '15 phút',
    '30_ph_t': '30 phút',
    '1_gi': '1 giờ',
    '2_gi': '2 giờ',
    // Admin security
    'b_o_m_t_t_i_kho_n': 'Bảo mật tài khoản',
    'b_t_2fa_t_ng_i_m': 'Bật 2FA tăng điểm',
    'c_nh_b_o_ng_nh_p': 'Cảnh báo đăng nhập',
    'i_l_n_cu_i': 'đã lần cuối',
    'i_m_b_o_m_t': 'Điểm bảo mật',
    'i_m_t_kh_u': 'Đổi mật khẩu',
    'l_ch_s_ng_nh_p': 'Lịch sử đăng nhập',
    'nh_n_th_ng_b_o_khi_c_ng_nh': 'Nhận thông báo khi có đăng nhập',
    'qu_n_l_c_i_t_b_o_m_t_c_a_b': 'Quản lý cài đặt bảo mật của bạn',
    'qu_t_m_qr_v_i_ng_d_ng_x_c_th': 'Quét mã QR với ứng dụng xác thực',
    't_ng_ng_xu_t_sau': 'Tự động đăng xuất sau',
    'th_i_gian_phi_n': 'Thời gian phiên',
    'thi_t_l_p_2fa': 'Thiết lập 2FA',
    'x_c_th_c_2_y_u_t': 'Xác thực 2 yếu tố',
    // Signup form
    'h_v_t_n': 'Họ và tên',
    'm_t_kh_u': 'Mật khẩu',
    'x_c_nh_n': 'Xác nhận',
    'ng_k_ngay': 'Đăng ký ngay',
    'email_business': 'Email doanh nghiệp',
    'processing_account': 'Đang xử lý tài khoản',
    // Context sidebar
    'h_s_kh_ch_h_ng': 'Hồ sơ khách hàng',
    'i_m_s_c_kh_e': 'Điểm sức khỏe',
    'i_m_s_t_t_ti_p_t_c_duy_tr': 'Điểm số tốt tiếp tục duy trì',
    'c_i_thi_n_s_c_kh_e': 'Cải thiện sức khỏe',
    'l_ch_s_mua_h_ng': 'Lịch sử mua hàng',
    'l_n_t_v_n_g_n_nh_t': 'Lần tư vấn gần nhất',
    't_v_n_ho_n_th_nh': 'Tư vấn hoàn thành',
    'th_ng_tin_t_v_n': 'Thông tin tư vấn',
    'tu_i': 'tuổi',
    'tu_i_1': 'tuổi',
    'v_n_ch_nh': 'Vấn đề chính',
    // Chat
    'c_c_cu_c_h_i_tho_i': 'Các cuộc hội thoại',
    't_o_cu_c_h_i_tho_i_m_i': 'Tạo cuộc hội thoại mới',
    // Copilot
    'g_i_prompt_click_d_ng_n': 'Gợi ý Prompt - Click để dùng ngay',
    'chat_m_i': 'Chat mới',
    'l_ch_s_chat': 'Lịch sử Chat',
    'xem_l_ch_s_chat': 'Xem lịch sử chat',
    'g_i': 'Gửi',
    'g_i_c_u_h_i': 'Gửi câu hỏi',
    'g_i_nhanh': 'Gửi nhanh',
    // Daily quest
    'yield': 'Lợi nhuận',
    'grow': 'GROW',
    'grow_1': 'GROW',
    // Rankings
    'doanh_s': 'Doanh số',
    'doanh_s_cao_nh_t_th_ng_n_y': 'Doanh số cao nhất tháng này',
    'top_3_t_ng_t_i': 'Top 3 tổng tài',
    'kh_i_nghi_p': 'Khởi nghiệp',
    // Navigation
    'v_ch_ng_t_i': 'Về chúng tôi',
    'i_t_c': 'Đối tác',
    // Footer
    'h_sinh_th_i_social_commerce_t': 'Hệ sinh thái Social Commerce tiên tiến nhất Việt Nam',
    'hello_wellnexus_vn': 'hello@wellnexus.vn',
    'm_kh_a_khi_t': 'Mở khóa khi đạt ',
    'xem_t_m_nh_n': 'Xem tầm nhìn',
    'giai_o_n_hi_n_t_i': 'Giai đoạn hiện tại',
    'tham_gia_ngay_ch_c_n_157_sl': 'Tham gia ngay - Chỉ còn 157 slot',
    'partner_n_i_g_v_wellnexus': 'Partner nói gì về WellNexus',
    'h_ng_ng_n_partner_thay_i': 'Hàng ngàn Partner đã thay đổi cuộc sống với WellNexus',
    'tham_gia_c_ng_1_000_founders': 'Tham gia cùng 1.000+ Founders thành công',
    'm_r_ng_to_n_c_u': 'Mở rộng toàn cầu',
    's_n_s_ng_chinh_ph_c_th_tr_ng': 'Sẵn sàng chinh phục thị trường Đông Nam Á',
    'hu_n_luy_n_vi_n_ai': 'Huấn luyện viên AI',
    'h_ng_d_n_c_nh_n_h_a_b_i_gemi': 'Hướng dẫn cá nhân hóa bởi Gemini',
    'thu_nh_p_th_ng': 'Thu nhập thụ động',
    'theo_d_i_hoa_h_ng_t_ng_v_p': 'Theo dõi hoa hồng tăng vọt theo thời gian thực',
    'thu_nh_p_tb_partner': 'Thu nhập TB/Partner',
    // Premium navigation
    'social_commerce_2_0': 'Social Commerce 2.0',
    'social_commerce_2_0_1': 'Social Commerce 2.0',
    'ng_k_nh_n_tin_t_c_u': 'Đăng ký nhận tin tức và ưu đãi độc quyền',
    'wellnexus_1': 'WellNexus',
    'q1_tp_hcm_vietnam': 'Q1, TP. HCM, Vietnam',
    '84_901_234_567': '+84 901 234 567',
    'wellnexus_all_rights_reserved': 'WellNexus. All rights reserved.',
    'made_with_in_vietnam': 'Made with ❤️ in Vietnam',
    'ssl_secured': 'SSL Secured',
    'top_10_east_asia': 'Top 10 East Asia',
    'n_p_shop': 'Nạp SHOP',
    // Redemption
    's_d_hi_n_t_i': 'Số dư hiện tại',
    's_d_ng_grow_token_t_ch_l_y_t': 'Sử dụng GROW Token tích lũy từ',
    // Hero enhancements
    'c_tin_t_ng_b_i': 'Được tin tưởng bởi',
};

// Read all keys from temp file
const keysFile = '/tmp/all_i18n_keys.txt';
const rawKeys = fs.readFileSync(keysFile, 'utf-8').split('\n').filter(Boolean);

// Parse keys into section.key format
const parsedKeys: { section: string; key: string }[] = [];

for (const line of rawKeys) {
    const match = line.match(/t\('([a-zA-Z_0-9]+)\.([a-zA-Z_0-9]+)'\)/);
    if (match) {
        parsedKeys.push({ section: match[1], key: match[2] });
    }
}

// Group by section
const sections: Record<string, string[]> = {};
for (const { section, key } of parsedKeys) {
    if (!sections[section]) sections[section] = [];
    if (!sections[section].includes(key)) {
        sections[section].push(key);
    }
}

// Convert underscore key to readable text
function keyToText(key: string): string {
    // Check if we have a Vietnamese mapping
    if (viKeyMap[key]) return viKeyMap[key];

    // Handle special cases
    if (/^\d+$/.test(key)) return key; // Pure numbers
    if (/^\d+_\d+$/.test(key)) return key.replace('_', '.'); // 4_9 -> 4.9
    if (/^\d+_\d+_\d+$/.test(key)) return key.replace(/_/g, '.'); // 1_2_0 -> 1.2.0

    // Convert underscores to spaces and title case
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

// Generate TypeScript object for each section
const output: string[] = [];
output.push('// Auto-generated i18n translations - Batch Fix v2');
output.push(`// Generated at: ${new Date().toISOString()}`);
output.push('// Total sections: ' + Object.keys(sections).length);
output.push('// Total keys: ' + parsedKeys.length);
output.push('');

for (const [section, keys] of Object.entries(sections).sort()) {
    output.push(`  // ${section}`);
    output.push(`  ${section}: {`);

    for (const key of keys.sort()) {
        const text = keyToText(key);
        const escaped = text.replace(/'/g, "\\'");
        output.push(`    '${key}': '${escaped}',`);
    }

    output.push(`  },`);
    output.push('');
}

console.log(output.join('\n'));
