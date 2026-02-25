/**
 * Welcome Email Template
 * Sent when new user signs up
 */

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  sponsorName?: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const { userName, sponsorName } = data;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào mừng đến với WellNexus</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700;">
                🎉 Chào mừng đến WellNexus!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #E2E8F0; font-size: 18px; line-height: 1.6;">
                Xin chào <strong style="color: #60A5FA;">${userName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                Chúc mừng bạn đã trở thành thành viên của <strong style="color: #A78BFA;">WellNexus 2.0</strong> - nền tảng Agentic HealthFi OS hàng đầu Việt Nam! 🚀
              </p>

              ${sponsorName ? `
              <p style="margin: 0 0 20px; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                Bạn được giới thiệu bởi: <strong style="color: #60A5FA;">${sponsorName}</strong>
              </p>
              ` : ''}

              <div style="margin: 30px 0; padding: 24px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; border-radius: 8px;">
                <h3 style="margin: 0 0 12px; color: #60A5FA; font-size: 18px;">🎯 Bước tiếp theo:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #CBD5E1; font-size: 15px; line-height: 1.8;">
                  <li>Khám phá Dashboard và các tính năng AI Agent</li>
                  <li>Tìm hiểu hệ thống hoa hồng Bee 2.0 (21-25%)</li>
                  <li>Kết nối ví để nhận SHOP và GROW tokens</li>
                  <li>Bắt đầu mua sắm và kiếm Mining Points</li>
                </ul>
              </div>

              <div style="margin: 30px 0; text-align: center;">
                <a href="https://wellnexus.vn/dashboard" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Vào Dashboard 🚀
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #94A3B8; font-size: 14px; line-height: 1.6;">
                Nếu bạn cần hỗ trợ, vui lòng liên hệ team support hoặc chat với AI Coach ngay trong app.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(15, 23, 42, 0.5); text-align: center; border-top: 1px solid rgba(100, 116, 139, 0.2);">
              <p style="margin: 0 0 10px; color: #64748B; font-size: 14px;">
                © 2026 WellNexus. All rights reserved.
              </p>
              <p style="margin: 0; color: #475569; font-size: 12px;">
                📧 support@wellnexus.vn | 🌐 <a href="https://wellnexus.vn" style="color: #60A5FA; text-decoration: none;">wellnexus.vn</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
