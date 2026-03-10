/**
 * Analytics i18n - Vietnamese
 * ROIaaS Phase 5 - Revenue & Usage Analytics
 */

export const analytics = {
  // Alert Settings (for RaaSAlertSettings component)
  alert_settings: {
    delete_confirm: 'Bạn có chắc chắn muốn xóa quy tắc này?',
    title: 'Quy Tắc Cảnh Báo',
    description: 'Cấu hình ngưỡng cảnh báo và thông báo',
    add_rule: 'Thêm Quy Tắc',
    no_rules: 'Chưa có quy tắc cảnh báo',
    no_rules_description: 'Tạo quy tắc cảnh báo đầu tiên để nhận thông báo sự kiện quan trọng',
    disabled: 'Vô hiệu',
    no_description: 'Không có mô tả',
    threshold: 'Ngưỡng',
    cooldown: 'Thời gian chờ',
    edit: 'Sửa quy tắc',
    delete: 'Xóa quy tắc',
    edit_rule: 'Sửa Quy Tắc',
    create_rule: 'Tạo Quy Tắc',
    rule_type: 'Loại Quy Tắc',
    name: 'Tên Quy Tắc',
    name_placeholder: 'Nhập tên quy tắc',
    description_label: 'Mô tả',
    description_placeholder: 'Nhập mô tả quy tắc',
    severity: 'Mức Độ',
    severity_info: 'Thông Tin',
    severity_warning: 'Cảnh Báo',
    severity_critical: 'Nghiêm Trọng',
    operator: 'Toán Tử',
    seconds: 'giây',
    message_template: 'Mẫu Tin Nhắn',
    message_placeholder: 'Nhập mẫu tin nhắn với biến {{variable}}',
    message_help: 'Dùng {{percentage}}, {{featureName}}, {{currentValue}}, {{threshold}} cho giá trị động',
    enable_rule: 'Kích hoạt quy tắc',
    cancel: 'Hủy',
    save: 'Lưu',
    saving: 'Đang lưu...',
    types: {
      quota_threshold: 'Ngưỡng Hạn Mức',
      spending_limit: 'Giới Hạn Chi Tiêu',
      feature_blocked: 'Tính Năng Bị Chặn',
    },
  },
  // Revenue Metrics
  revenue: {
    title: 'Phân Tích Doanh Thu',
    gmv: 'GMV',
    gmv_full: 'Tổng Giá Trị Hàng Hóa',
    mrr: 'MRR',
    mrr_full: 'Doanh Thu Định Kỳ Tháng',
    arr: 'ARR',
    arr_full: 'Doanh Thu Định Kỳ Năm',
    total: 'Tổng Doanh Thu',
    subscription: 'Đăng Ký',
    usage_based: 'Theo Mức Dùng',
    trend: 'Xu Hướng Doanh Thu',
  },

  // ROI Metrics
  roi: {
    title: 'Phân Tích ROI',
    absolute: 'ROI Tuyệt Đối',
    percentage: 'ROI %',
    margin: 'Biên Lợi Nhuận %',
    costs: 'Tổng Chi Phí',
    revenue: 'Tổng Doanh Thu',
    profitable: 'Có Lời',
    unprofitable: 'Lỗ',
    per_license: 'ROI Theo Giấy Phép',
  },

  // Cost Breakdown
  costs: {
    title: 'Phân Tích Chi Phí',
    api_calls: 'API Calls',
    tokens: 'Tokens',
    compute: 'Compute',
    inference: 'Inferences',
    agent_execution: 'Agent Executions',
  },

  // User Metrics
  metrics: {
    dau: 'Người Dùng Hàng Ngày',
    mau: 'Người Dùng Hàng Tháng',
    dau_mau_ratio: 'Tỷ Lệ DAU/MAU',
    conversion: 'Tỷ Lệ Chuyển Đổi',
    churn: 'Tỷ Lệ Hủy',
    retention: 'Tỷ Lệ Giữ Chân',
    active_licenses: 'Giấy Phép Hoạt Động',
    top_consumers: 'Top Người Dùng',
  },

  // Cohort Analysis
  cohort: {
    title: 'Phân Tích Nhóm',
    size: 'Quy Mô Nhóm',
    period: 'Chu Kỳ',
    active_users: 'Người Dùng Hoạt Động',
    retained: 'Giữ Chân %',
    revenue: 'Doanh Thu Tích Lũy',
    arpu: 'Doanh Thu/User',
  },

  // Tier Breakdown
  tiers: {
    free: 'Miễn Phí',
    basic: 'Cơ Bản',
    premium: 'Cao Cấp',
    enterprise: 'Doanh Nghiệp',
    master: 'Bậc Thầy',
  },

  // Dashboard
  dashboard: {
    title: 'Bảng Phân Tích',
    engineering_roi: 'ROI Kỹ Thuật',
    operational_roi: 'ROI Vận Hành',
    export_pdf: 'Xuất PDF',
    export_csv: 'Xuất CSV',
    export_dropdown: 'Xuất Dữ Liệu',
    export_all_csv: 'Xuất Tất Cả (CSV)',
    last_updated: 'Cập Nhật Lần Cuối',
    refresh: 'Làm Mới',
  },

  // Export
  export: {
    top_customers: 'Top Khách Hàng',
    tier_distribution: 'Phân Bố Gói',
    revenue_over_time: 'Doanh Thu Theo Thời Gian',
    daily_active_licenses: 'Giấy Phép Hoạt Động Hàng Ngày',
    full_dashboard: 'Toàn Bộ Dashboard',
    generated_at: 'Tạo lúc',
  },

  // Charts
  charts: {
    revenue_trend: 'Xu Hướng Doanh Thu',
    usage_trend: 'Xu Hướng Sử Dụng',
    tier_distribution: 'Phân Bổ Gói',
    roi_distribution: 'Phân Bổ ROI',
    cohort_retention: 'Giữ Chân Nhóm',
    no_data: 'Không có dữ liệu',
  },

  // Time Periods
  periods: {
    today: 'Hôm Nay',
    yesterday: 'Hôm Qua',
    last_7_days: '7 Ngày Qua',
    last_30_days: '30 Ngày Qua',
    this_month: 'Tháng Này',
    last_month: 'Tháng Trước',
    this_quarter: 'Quý Này',
    this_year: 'Năm Nay',
  },

  // Date Range Picker
  dateRange: {
    custom: 'Tùy chỉnh',
    preset_7d: '7 ngày',
    preset_30d: '30 ngày',
    preset_90d: '90 ngày',
    select_range: 'Chọn khoảng thời gian',
    from: 'Từ',
    to: 'Đến',
    apply: 'Áp dụng',
    cancel: 'Hủy',
    format: 'dd/MM/yyyy',
  },

  // Actions
  actions: {
    view_details: 'Xem Chi Tiết',
    download_report: 'Tải Báo Cáo',
    set_alert: 'Đặt Cảnh Báo',
    configure: 'Cấu Hình',
  },

  // Alerts
  alerts: {
    high_usage: 'Cảnh Báo Mức Dùng Cao',
    quota_exceeded: 'Vượt Hạn Mức',
    low_roi: 'Cảnh Báo ROI Thấp',
    churn_risk: 'Nguy Cơ Hủy Dịch Vụ',
    // Alert Badges
    warning: 'Cảnh Báo',
    critical: 'Nghiêm Trọng',
    over_quota: 'Vượt Hạn Mức',
    approaching_limit: 'Sắp Đạt Giới Hạn',
    suspension_warning: 'Cảnh Báo Đình Chỉ',
    license_expired: 'Giấy Phép Hết Hạn',
    payment_past_due: 'Thanh Toán Quá Hạn',
    view_details: 'Xem Chi Tiết',
    dismiss: 'Bỏ Qua',
  },

  // Premium Tiers
  premium: {
    tier: {
      free: 'Miễn Phí',
      pro: 'Pro',
      enterprise: 'Doanh Nghiệp',
    },
    badge: {
      current_tier: 'Gói Hiện Tại',
    },
    gate: {
      title: 'Tính Năng Premium',
      description: 'Nâng cấp để mở khóa tính năng này',
      upgrade_button: 'Nâng Cấp Ngay',
    },
    upgrade: {
      title: 'Nâng Cấp Gói Dịch Vụ',
      description: 'Mở khóa toàn bộ tiềm năng analytics',
      current_tier: 'Gói hiện tại',
      features_title: 'Tính năng bao gồm',
      cta_contact: 'Liên hệ để có giải pháp phù hợp',
      contact_button: 'Liên Hệ',
    },
    features: {
      basic_metrics: 'Basic Metrics (GMV, Active Licenses)',
      advanced_analytics: 'Advanced Analytics (Cohort, Funnel)',
      export_csv: 'Export CSV',
      export_pdf: 'Export PDF',
      real_time_sync: 'Real-time Sync (30s auto-refresh)',
      custom_date_range: 'Custom Date Range Picker',
    },
  },

  // Real-time Analytics Widget (Phase 6.3)
  realtime: {
    title: 'Analytics Thời Gian Thực',
    live_feed: 'Luồng Sự Kiện Trực Tiếp',
    usage_chart: 'Mức Dùng Thời Gian Thực',
    events_per_minute: 'Sự kiện/phút',
    no_events: 'Chưa có sự kiện',
    watching: 'Đang theo dõi',
    connected: 'Đã kết nối',
    reconnecting: 'Đang kết nối lại...',
    last_event: 'Sự kiện cuối',
    ago: 'trước',
    auto_scroll: 'Tự động cuộn',
    pause: 'Tạm dừng',
    resume: 'Tiếp tục',
    clear: 'Xóa',
  },

  // Event Types
  event_types: {
    license_validated: 'Giấy Phép Hợp Lệ',
    license_expired: 'Giấy Phép Hết Hạn',
    suspension_created: 'Đã Đình Chỉ',
    suspension_cleared: 'Đã Hủy Đình Chỉ',
    subscription_warning: 'Cảnh Báo Đăng Ký',
    admin_bypass_used: 'Bỏ Qua Admin',
    api_request: 'Yêu Cầu API',
    quota_exceeded: 'Vượt Hạn Mức',
  },
}

export default analytics
