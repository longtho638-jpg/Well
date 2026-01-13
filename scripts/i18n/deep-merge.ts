/**
 * i18n Deep Merge Script - Fix all missing keys by merging into correct sections
 */

import * as fs from 'fs';

// All the missing keys that need to be merged into their correct sections
const missingKeysBySection: Record<string, Record<string, string>> = {
    dashboard: {
        system_online: 'Hệ thống Online',
    },
    debuggerpage: {
        system_debugger: 'System Debugger',
        v_debug_1_0: 'v.Debug 1.0',
        window_props: 'Window Props',
        zustand_store_state: 'Zustand Store State',
    },
    finance: {
        analyze_all: 'Analyze All',
        automated_fraud_detection: 'Automated Fraud Detection',
        export_ledger: 'Export Ledger',
        ledger_synchronized: 'Ledger Synchronized',
        no_items_in_the_current_filter: 'No items in the current filter',
        platform_liquidity_verificatio: 'Platform Liquidity Verification',
        quarantined_items: 'Quarantined Items',
        security_batch_commit: 'Security Batch Commit',
        security_passed: 'Security Passed',
        treasury_control: 'Treasury Control',
        verifying_digital_ledgers: 'Verifying Digital Ledgers',
    },
    founderrevenuegoal: {
        '1_000_000_usd': '$1,000,000 USD',
        ai_xu_t_h_nh_ng: 'AI đề xuất hành động',
        c_n_t_ng_t_c: 'Cần tăng tốc',
        doanh_thu_hi_n_t_i: 'Doanh thu hiện tại',
        m_c_ti_u_2026: 'Mục tiêu 2026',
        of_goal: 'of Goal',
        v_t_ti_n: 'Vượt tiến độ',
    },
    healthcheck: {
        '100': '100%',
        i_m_s_t_ng_kh_a_c_nh_s_c_kh: 'Điểm số từng khía cạnh sức khỏe',
        l_i_ch_kh_c: 'Lợi ích khác',
        ph_n_t_ch_chi_ti_t: 'Phân tích chi tiết',
        s_n_ph_m_c_ai_xu_t_d_nh: 'Sản phẩm được AI đề xuất dành cho bạn',
        u_ti_n: 'Ưu tiên',
    },
    herocard: {
        '100m_vnd_revenue': '100M VND Revenue',
        achievement_logic: 'Achievement Logic',
        ecosystem_scaling: 'Ecosystem Scaling',
        founders_pathway: 'Founders Pathway',
        live: 'LIVE',
        reach: 'Reach',
        to_hit_next_milestone: 'to hit next milestone',
        to_unlock: 'to unlock',
        venture_partner_status: 'Venture Partner Status',
    },
    leaderdashboard: {
        ai_insights: 'AI Insights',
        ai_ph_t_hi_n_nh_ng_th_nh_vi_n: 'AI phát hiện những thành viên',
        ai_xu_t: 'AI đề xuất',
        all_ranks: 'All Ranks',
        c_n_ch: 'Cần chú ý',
        doanh_s: 'Doanh số',
        doanh_s_1: 'Doanh số',
        doanh_s_2: 'Doanh số',
        doanh_s_cao_nh_t_th_ng_n_y: 'Doanh số cao nhất tháng này',
        g_i_nh_c_nh: 'Gửi nhắc nhở',
        l_do_c_n_ch: 'Lý do cần chú ý',
        member: 'Member',
        network_health: 'Network Health',
        partner: 'Partner',
        qu_n_l_i_nh_m: 'Quản lý đội nhóm',
        s_h_th_ng: 'Sơ đồ hệ thống',
        t_l_gi_ch_n: 'Tỷ lệ giữ chân',
        t_ng_qu_kh_ch_l: 'Tổng quan khách hàng',
        th_nh_vi_n_c_n_ch: 'Thành viên cần chú ý',
        th_nh_vi_n_r_i_ro_cao: 'Thành viên rủi ro cao',
        th_nh_vi_n_r_i_ro_trung_b_nh: 'Thành viên rủi ro trung bình',
        top_3_t_ng_t_i: 'Top 3 tổng tài',
    },
    liveconsole: {
        bee_agent_core_v4_2_0_stable: 'BEE Agent Core v4.2.0 Stable',
        bps: 'bps',
        encrypted: 'Encrypted',
        lat_4ms: 'Lat: 4ms',
        live_operations_node_agent: 'Live Operations Node Agent',
        sync_active: 'Sync Active',
        tx: 'Tx',
        wellnexus_bee: 'WellNexus BEE',
    },
    login: {
        demo: 'Demo',
    },
    cms: {
        action: 'Action',
        content_orchestrator: 'Content Orchestrator',
        create: 'Create',
        cross_platform_content_deliver: 'Cross-Platform Content Delivery',
        link: 'Link',
        loc: 'LOC',
        target: 'Target',
    },
    ordermanagement: {
        activate_commissions: 'Activate Commissions',
        all_pending_orders_have_been_p: 'All pending orders have been processed',
        cashflow_hub: 'Cashflow Hub',
        never_approve: 'Never Approve',
        operational_risk_protocol: 'Operational Risk Protocol',
        queue_synchronized: 'Queue Synchronized',
        strict_compliance_rule: 'Strict Compliance Rule',
        syncing_global_ledgers: 'Syncing Global Ledgers',
        verify_transactions_and: 'Verify Transactions and Activate Commissions',
        without_verified_bank_clearanc: 'Without verified bank clearance',
    },
    partners: {
        partner_recon_crm: 'Partner Recon CRM',
        precision_orchestration_of_net: 'Precision Orchestration of Network',
        rank_intelligence: 'Rank Intelligence',
    },
    products: {
        add_product: 'Add Product',
        bonus_revenue_dttt_represent: 'Bonus Revenue DTTT Represents',
        commit: 'Commit',
        dttt_basis: 'DTTT Basis',
        dttt_commission_logic: 'DTTT Commission Logic',
        edit_config: 'Edit Config',
        esc: 'ESC',
        global_catalog: 'Global Catalog',
        in_stock: 'In Stock',
        inventory_management_dttt_st: 'Inventory Management DTTT Stock',
        low_stock: 'Low Stock',
        member_21_startup_25: 'Member 21% / Startup 25%',
        member_comm: 'Member Comm',
        out_of_stock: 'Out of Stock',
        partner_comm: 'Partner Comm',
        retail_msrp: 'Retail (MSRP)',
        sku: 'SKU',
    },
    productcard: {
        added: 'Added',
        buy_now: 'Buy Now',
        earn: 'Earn',
        out_of_stock: 'Out of Stock',
        share: 'Share',
        stock: 'Stock',
    },
    wallet: {
        '12': '12%',
        '12_0': '12.0%',
        '12_5': '12.5%',
        '90': '90',
        apy_staking: 'APY Staking',
        blockchain_explorer: 'Blockchain Explorer',
        currency: 'Currency',
        governance_token: 'Governance Token',
        t_ng_t_i_s_n: 'Tổng tài sản',
        th_ng_n_y: 'Tháng này',
        n_p_shop: 'Nạp SHOP',
        vnd_stablecoin_1_1000: 'VND Stablecoin 1:1000',
    },
    marketingtools: {
        '4_9': '4.9',
        ai_ang_vi_t_c_u_chuy_n: 'AI đang viết câu chuyện',
        ai_landing_builder: 'AI Landing Builder',
        ai_s_t_o_landing_page_chuy_n: 'AI sẽ tạo Landing Page chuyên nghiệp',
        ai_vi_t_c_u_chuy_n_c_a_t_i: 'AI viết câu chuyện của tôi',
        ch_n_template: 'Chọn Template',
        ch_n_template_v_click_ai_vi: 'Chọn Template và Click AI viết',
        chuy_n_i: 'Chuyển đổi',
        click_t_i_nh_l_n: 'Click tải ảnh lên',
        click_thay_i: 'Click thay đổi',
        conversions: 'Conversions',
        jpg_png_t_i_a_5mb: 'JPG, PNG tối đa 5MB',
        l_t_xem: 'Lượt xem',
        landing_page_xu_t_b_n: 'Landing Page xuất bản',
        landing_pages_t_o: 'Landing Pages đã tạo',
        link_landing_page: 'Link Landing Page',
        link_s_n_s_ng_chia_s: 'Link sẵn sàng chia sẻ',
        live: 'LIVE',
        new: 'New',
        nh_t_i_l_n: 'Nhấn tải lên',
        preview_landing_page: 'Preview Landing Page',
        t_l: 'Tỷ lệ',
        t_o_trang_tuy_n_d_ng_chuy_n_ng: 'Tạo trang tuyển dụng chuyên nghiệp',
        upload_nh_ch_n_dung: 'Upload ảnh chân dung',
        views: 'Views',
        xu_t_b_n_ngay: 'Xuất bản ngay',
    },
    notificationcenter: {
        actions_required: 'Actions Required',
        audit_center: 'Audit Center',
        clear_history: 'Clear History',
        no_new_activity: 'No New Activity',
        notifications: 'Notifications',
        we_ll_notify_you_when_somethin: "We'll notify you when something happens",
    },
    policyengine: {
        policy_changes_are_cryptograph: 'Policy changes are cryptographically signed',
        policy_engine: 'Policy Engine',
        projection_simulator: 'Projection Simulator',
        real_time: 'Real-time',
        strategic_integrity_confirmed: 'Strategic Integrity Confirmed',
        sync: 'Sync',
        synchronizing_policy_core: 'Synchronizing Policy Core',
        v3_1: 'v3.1',
    },
};

// Read the locale file
let content = fs.readFileSync('src/locales/vi.ts', 'utf-8');

// Function to find and merge keys into a section
function mergeKeysIntoSection(content: string, sectionName: string, keys: Record<string, string>): string {
    // Find the section pattern: `sectionName: {`
    const sectionRegex = new RegExp(`(  ${sectionName}: \\{[\\s\\S]*?)(\\n  \\},)`, 'm');
    const match = content.match(sectionRegex);

    if (!match) {
        console.log(`Section ${sectionName} not found!`);
        return content;
    }

    // Build the keys to add
    const keysToAdd = Object.entries(keys)
        .map(([key, value]) => {
            const keyStr = /^\d/.test(key) || key.includes('_') && /[^a-zA-Z_]/.test(key.replace(/_/g, ''))
                ? `'${key}'` : key;
            return `    ${keyStr}: '${value.replace(/'/g, "\\'")}',`;
        })
        .join('\n');

    // Insert before the closing brace
    const newSection = match[1] + '\n    // Merged keys\n' + keysToAdd + match[2];

    return content.replace(match[0], newSection);
}

// Process each section
for (const [section, keys] of Object.entries(missingKeysBySection)) {
    content = mergeKeysIntoSection(content, section, keys);
    console.log(`Merged ${Object.keys(keys).length} keys into ${section}`);
}

// Write the updated content
fs.writeFileSync('src/locales/vi.ts', content);
console.log('\nDone! All keys merged into correct sections.');
