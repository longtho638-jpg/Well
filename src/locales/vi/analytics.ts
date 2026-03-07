/**
 * Analytics i18n - Vietnamese
 * ROIaaS Phase 5 - Revenue & Usage Analytics
 */

export const analytics = {
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
    last_updated: 'Cập Nhật Lần Cuối',
    refresh: 'Làm Mới',
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
  },
}

export default analytics
