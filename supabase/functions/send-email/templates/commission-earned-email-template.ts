/**
 * Commission Earned Email Template
 * Sent when user earns direct or F1 commission
 */

export interface CommissionEarnedEmailData {
  userName: string;
  commissionAmount: string;
  commissionType: 'direct' | 'sponsor';
  orderId?: string;
  fromUserName?: string;
  currentBalance: string;
  commissionRate: string;
}

export function generateCommissionEarnedEmail(data: CommissionEarnedEmailData): string {
  const { userName, commissionAmount, commissionType, orderId, fromUserName, currentBalance, commissionRate } = data;

  const isDirectCommission = commissionType === 'direct';
  const emoji = isDirectCommission ? '💰' : '🎁';
  const title = isDirectCommission ? 'Hoa hồng bán hàng' : 'Thưởng quản lý F1';
  const description = isDirectCommission
    ? `Bạn vừa nhận được hoa hồng ${commissionRate} từ đơn hàng của chính mình!`
    : `Bạn vừa nhận được thưởng 8% từ doanh số của ${fromUserName}!`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bạn vừa nhận được hoa hồng!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
              <div style="font-size: 64px; margin-bottom: 16px;">${emoji}</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700;">
                Chúc mừng! Bạn vừa kiếm được tiền!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #E2E8F0; font-size: 18px; line-height: 1.6;">
                Xin chào <strong style="color: #FBBF24;">${userName}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                ${description}
              </p>

              <!-- Commission Amount Box -->
              <div style="margin: 30px 0; padding: 32px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%); border: 2px solid #F59E0B; border-radius: 12px; text-align: center;">
                <div style="color: #94A3B8; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  ${title}
                </div>
                <div style="color: #FBBF24; font-size: 48px; font-weight: 700; margin: 8px 0;">
                  ${commissionAmount}
                </div>
                <div style="color: #CBD5E1; font-size: 15px; margin-top: 8px;">
                  Tỷ lệ: <strong style="color: #FBBF24;">${commissionRate}</strong>
                </div>
              </div>

              <!-- Details -->
              <div style="margin: 30px 0; padding: 24px; background: rgba(100, 116, 139, 0.1); border-radius: 8px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${orderId ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Đơn hàng:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right; font-weight: 600;">
                      #${orderId}
                    </td>
                  </tr>
                  ` : ''}
                  ${fromUserName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Từ thành viên:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right; font-weight: 600;">
                      ${fromUserName}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Loại hoa hồng:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right;">
                      ${isDirectCommission ? 'Hoa hồng trực tiếp' : 'Thưởng quản lý F1'}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid rgba(100, 116, 139, 0.2);">
                    <td style="padding: 12px 0 0; color: #FBBF24; font-size: 16px; font-weight: 600;">Số dư hiện tại:</td>
                    <td style="padding: 12px 0 0; color: #FBBF24; font-size: 16px; text-align: right; font-weight: 700;">
                      ${currentBalance}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Tips -->
              <div style="margin: 30px 0; padding: 20px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; border-radius: 8px;">
                <h3 style="margin: 0 0 12px; color: #60A5FA; font-size: 16px;">💡 Mẹo tăng thu nhập:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #CBD5E1; font-size: 14px; line-height: 1.8;">
                  <li>Mua thêm sản phẩm để nhận hoa hồng cao hơn (lên đến 25%)</li>
                  <li>Chia sẻ link giới thiệu để xây dựng đội nhóm F1</li>
                  <li>Thăng hạng lên Đại Sứ để nhận thêm 8% thưởng quản lý</li>
                  <li>Thu thập Mining Points để đổi thưởng</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="margin: 30px 0; text-align: center;">
                <a href="https://wellnexus.vn/wallet" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  Xem ví của bạn 💰
                </a>
                <a href="https://wellnexus.vn/referral" style="display: inline-block; padding: 16px 32px; background: rgba(59, 130, 246, 0.2); border: 2px solid #3B82F6; color: #60A5FA; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Chia sẻ link giới thiệu 🔗
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #94A3B8; font-size: 14px; line-height: 1.6; text-align: center;">
                Tiếp tục phát triển đội nhóm và kiếm thêm thu nhập thụ động! 🚀
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
                📧 support@wellnexus.vn | 🌐 <a href="https://wellnexus.vn" style="color: #FBBF24; text-decoration: none;">wellnexus.vn</a>
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
