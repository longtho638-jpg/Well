/**
 * Withdrawal Approved Email Template
 * Sent when admin approves a withdrawal request
 */

export interface WithdrawalApprovedEmailData {
  userName: string;
  amount: string;
  requestId: string;
  bankName: string;
  accountNumber: string;
  estimatedArrival: string; // e.g., "1-3 ngày làm việc"
}

export function generateWithdrawalApprovedEmail(data: WithdrawalApprovedEmailData): string {
  const { userName, amount, requestId, bankName, accountNumber, estimatedArrival } = data;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yêu cầu rút tiền đã được duyệt!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
              <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700;">
                Yêu cầu rút tiền đã được duyệt!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #E2E8F0; font-size: 18px; line-height: 1.6;">
                Xin chào <strong style="color: #10B981;">${userName}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                Chúng tôi vui mừng thông báo rằng yêu cầu rút tiền của bạn đã được phê duyệt!
                Số tiền sẽ được chuyển đến tài khoản ngân hàng của bạn trong thời gian sớm nhất.
              </p>

              <!-- Amount Box -->
              <div style="margin: 30px 0; padding: 32px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid #10B981; border-radius: 12px; text-align: center;">
                <div style="color: #94A3B8; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  SỐ TIỀN RÚT
                </div>
                <div style="color: #10B981; font-size: 48px; font-weight: 700; margin: 8px 0;">
                  ${amount}
                </div>
                <div style="color: #CBD5E1; font-size: 15px; margin-top: 8px;">
                  Thời gian nhận: <strong style="color: #10B981;">${estimatedArrival}</strong>
                </div>
              </div>

              <!-- Details -->
              <div style="margin: 30px 0; padding: 24px; background: rgba(100, 116, 139, 0.1); border-radius: 8px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Mã yêu cầu:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right; font-weight: 600;">
                      #${requestId}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Ngân hàng:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right; font-weight: 600;">
                      ${bankName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Số tài khoản:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right; font-weight: 600;">
                      ${accountNumber}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid rgba(100, 116, 139, 0.2);">
                    <td style="padding: 12px 0 0; color: #10B981; font-size: 16px; font-weight: 600;">Trạng thái:</td>
                    <td style="padding: 12px 0 0; color: #10B981; font-size: 16px; text-align: right; font-weight: 700;">
                      ✅ Đã duyệt
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Info Box -->
              <div style="margin: 30px 0; padding: 20px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; border-radius: 8px;">
                <h3 style="margin: 0 0 12px; color: #60A5FA; font-size: 16px;">📋 Lưu ý quan trọng:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #CBD5E1; font-size: 14px; line-height: 1.8;">
                  <li>Tiền sẽ được chuyển khoản trong vòng ${estimatedArrival}</li>
                  <li>Kiểm tra tài khoản ngân hàng thường xuyên</li>
                  <li>Nội dung chuyển khoản: "WellNexus #${requestId}"</li>
                  <li>Nếu có vấn đề, vui lòng liên hệ support@wellnexus.vn</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="margin: 30px 0; text-align: center;">
                <a href="https://wellnexus.vn/wallet" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  Xem lịch sử giao dịch 💰
                </a>
                <a href="https://wellnexus.vn/referral" style="display: inline-block; padding: 16px 32px; background: rgba(59, 130, 246, 0.2); border: 2px solid #3B82F6; color: #60A5FA; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Kiếm thêm thu nhập 🚀
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #94A3B8; font-size: 14px; line-height: 1.6; text-align: center;">
                Cảm ơn bạn đã sử dụng WellNexus! 🎉
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
                📧 support@wellnexus.vn | 🌐 <a href="https://wellnexus.vn" style="color: #10B981; text-decoration: none;">wellnexus.vn</a>
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
