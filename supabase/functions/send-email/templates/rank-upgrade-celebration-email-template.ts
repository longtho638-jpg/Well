/**
 * Rank Upgrade Email Template
 * Sent when user achieves rank promotion
 */

export interface RankUpgradeEmailData {
  userName: string;
  oldRank: string;
  newRank: string;
  newRankId: number;
  achievementDate: string;
  newCommissionRate: string;
  newBenefits: string[];
  lifetimeSales?: string;
  teamVolume?: string;
}

export function generateRankUpgradeEmail(data: RankUpgradeEmailData): string {
  const { userName, oldRank, newRank, achievementDate, newCommissionRate, newBenefits, lifetimeSales, teamVolume } = data;

  const rankEmojis: Record<string, string> = {
    'CTV': '🌱',
    'Khởi Nghiệp': '🚀',
    'Đại Sứ': '⭐',
    'Đại Sứ Silver': '🥈',
    'Đại Sứ Gold': '🥇',
    'Đại Sứ Diamond': '💎',
    'Phượng Hoàng': '🔥',
    'Thiên Long': '🐉'
  };

  const rankColors: Record<string, string> = {
    'CTV': '#10B981',
    'Khởi Nghiệp': '#3B82F6',
    'Đại Sứ': '#8B5CF6',
    'Đại Sứ Silver': '#94A3B8',
    'Đại Sứ Gold': '#F59E0B',
    'Đại Sứ Diamond': '#06B6D4',
    'Phượng Hoàng': '#EF4444',
    'Thiên Long': '#7C3AED'
  };

  const emoji = rankEmojis[newRank] || '🏆';
  const color = rankColors[newRank] || '#8B5CF6';

  const benefitsHtml = newBenefits.map(benefit => `
    <li style="margin: 8px 0; color: #CBD5E1; font-size: 15px; line-height: 1.8;">
      ✨ ${benefit}
    </li>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chúc mừng thăng hạng!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); border: 2px solid ${color};">

          <!-- Celebration Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); position: relative;">
              <div style="font-size: 80px; margin-bottom: 20px; animation: bounce 1s infinite;">${emoji}</div>
              <h1 style="margin: 0 0 10px; color: #FFFFFF; font-size: 36px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                CHÚC MỪNG THĂNG HẠNG!
              </h1>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 18px;">
                Bạn đã đạt được cột mốc quan trọng!
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #E2E8F0; font-size: 18px; line-height: 1.6;">
                Xin chào <strong style="color: ${color};">${userName}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                Chúc mừng! Bạn đã chính thức thăng hạng từ <strong>${oldRank}</strong> lên <strong style="color: ${color};">${newRank}</strong>! 🎉
              </p>

              <!-- Rank Progress -->
              <div style="margin: 30px 0; padding: 32px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%); border-left: 4px solid ${color}; border-radius: 12px; text-align: center;">
                <div style="margin-bottom: 20px;">
                  <span style="display: inline-block; padding: 8px 16px; background: rgba(100, 116, 139, 0.3); border-radius: 20px; color: #94A3B8; font-size: 14px; margin-right: 10px;">
                    ${oldRank}
                  </span>
                  <span style="color: ${color}; font-size: 24px; font-weight: 700;">→</span>
                  <span style="display: inline-block; padding: 8px 16px; background: ${color}; border-radius: 20px; color: #FFFFFF; font-size: 14px; font-weight: 600; margin-left: 10px;">
                    ${emoji} ${newRank}
                  </span>
                </div>
                <div style="color: #CBD5E1; font-size: 14px;">
                  Ngày đạt được: <strong style="color: #E2E8F0;">${achievementDate}</strong>
                </div>
              </div>

              <!-- Stats -->
              ${lifetimeSales || teamVolume ? `
              <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 16px; color: #E2E8F0; font-size: 18px;">📊 Thành tích của bạn</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(100, 116, 139, 0.1); border-radius: 8px; overflow: hidden;">
                  ${lifetimeSales ? `
                  <tr>
                    <td style="padding: 16px; border-bottom: 1px solid rgba(100, 116, 139, 0.2);">
                      <div style="color: #94A3B8; font-size: 13px; margin-bottom: 4px;">Doanh số tích lũy</div>
                      <div style="color: #E2E8F0; font-size: 20px; font-weight: 700;">${lifetimeSales}</div>
                    </td>
                  </tr>
                  ` : ''}
                  ${teamVolume ? `
                  <tr>
                    <td style="padding: 16px;">
                      <div style="color: #94A3B8; font-size: 13px; margin-bottom: 4px;">Doanh số đội nhóm</div>
                      <div style="color: #E2E8F0; font-size: 20px; font-weight: 700;">${teamVolume}</div>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              ` : ''}

              <!-- New Benefits -->
              <div style="margin: 30px 0; padding: 24px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; border-radius: 8px;">
                <h3 style="margin: 0 0 16px; color: #60A5FA; font-size: 18px;">🎁 Quyền lợi mới của bạn:</h3>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  <li style="margin: 8px 0; color: #CBD5E1; font-size: 15px; line-height: 1.8;">
                    ✨ Hoa hồng bán hàng: <strong style="color: ${color};">${newCommissionRate}</strong>
                  </li>
                  ${benefitsHtml}
                </ul>
              </div>

              <!-- Social Sharing -->
              <div style="margin: 30px 0; padding: 24px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%); border-radius: 8px; text-align: center;">
                <h3 style="margin: 0 0 12px; color: #FBBF24; font-size: 16px;">📱 Chia sẻ thành công của bạn!</h3>
                <p style="margin: 0 0 16px; color: #CBD5E1; font-size: 14px;">
                  Khoe thành tích với bạn bè và thu hút thêm thành viên mới vào đội nhóm
                </p>
                <div style="margin-top: 16px;">
                  <a href="https://www.facebook.com/sharer/sharer.php?u=https://wellnexus.vn" style="display: inline-block; padding: 10px 20px; background: #1877F2; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-size: 14px; margin: 0 5px;">
                    📘 Facebook
                  </a>
                  <a href="https://twitter.com/intent/tweet?text=Tôi%20vừa%20thăng%20hạng%20${newRank}%20tại%20WellNexus!" style="display: inline-block; padding: 10px 20px; background: #1DA1F2; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-size: 14px; margin: 0 5px;">
                    🐦 Twitter
                  </a>
                </div>
              </div>

              <!-- CTA -->
              <div style="margin: 30px 0; text-align: center;">
                <a href="https://wellnexus.vn/dashboard" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                  Xem Dashboard ${emoji}
                </a>
              </div>

              <!-- Motivational Quote -->
              <div style="margin: 30px 0; padding: 20px; border-left: 4px solid ${color}; background: rgba(100, 116, 139, 0.05); border-radius: 4px;">
                <p style="margin: 0; color: #94A3B8; font-size: 15px; font-style: italic; line-height: 1.8;">
                  "Thành công không phải là điểm đến, mà là hành trình. Bạn đang trên con đường đúng đắn! Tiếp tục phát triển và chinh phục những đỉnh cao mới!" 🚀
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #94A3B8; font-size: 14px; line-height: 1.6; text-align: center;">
                Chúc mừng một lần nữa! Đội ngũ WellNexus rất tự hào về thành công của bạn! 🎊
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
                📧 support@wellnexus.vn | 🌐 <a href="https://wellnexus.vn" style="color: ${color}; text-decoration: none;">wellnexus.vn</a>
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
