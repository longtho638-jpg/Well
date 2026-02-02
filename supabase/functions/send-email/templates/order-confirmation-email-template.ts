/**
 * Order Confirmation Email Template
 * Sent when order is completed
 */

export interface OrderConfirmationEmailData {
  userName: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  shippingAddress?: string;
  trackingNumber?: string;
}

export function generateOrderConfirmationEmail(data: OrderConfirmationEmailData): string {
  const { userName, orderId, orderDate, totalAmount, items, shippingAddress, trackingNumber } = data;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid rgba(100, 116, 139, 0.2); color: #CBD5E1;">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid rgba(100, 116, 139, 0.2); color: #CBD5E1; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid rgba(100, 116, 139, 0.2); color: #CBD5E1; text-align: right;">
        ${item.price}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đơn hàng #${orderId}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700;">
                ✅ Đơn hàng đã xác nhận!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #E2E8F0; font-size: 18px; line-height: 1.6;">
                Xin chào <strong style="color: #34D399;">${userName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #CBD5E1; font-size: 16px; line-height: 1.6;">
                Cảm ơn bạn đã mua sắm tại WellNexus! Đơn hàng của bạn đã được xác nhận và đang được xử lý. 📦
              </p>

              <!-- Order Info -->
              <div style="margin: 30px 0; padding: 24px; background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10B981; border-radius: 8px;">
                <h3 style="margin: 0 0 16px; color: #34D399; font-size: 18px;">📋 Thông tin đơn hàng</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Mã đơn hàng:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right; font-weight: 600;">
                      #${orderId}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Ngày đặt hàng:</td>
                    <td style="padding: 8px 0; color: #E2E8F0; font-size: 14px; text-align: right;">
                      ${orderDate}
                    </td>
                  </tr>
                  ${trackingNumber ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;">Mã vận đơn:</td>
                    <td style="padding: 8px 0; color: #34D399; font-size: 14px; text-align: right; font-weight: 600;">
                      ${trackingNumber}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Items Table -->
              <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 16px; color: #E2E8F0; font-size: 18px;">🛍️ Sản phẩm đã đặt</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid rgba(100, 116, 139, 0.2); border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background: rgba(15, 23, 42, 0.5);">
                      <th style="padding: 12px; text-align: left; color: #94A3B8; font-size: 14px; font-weight: 600;">Sản phẩm</th>
                      <th style="padding: 12px; text-align: center; color: #94A3B8; font-size: 14px; font-weight: 600;">SL</th>
                      <th style="padding: 12px; text-align: right; color: #94A3B8; font-size: 14px; font-weight: 600;">Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr style="background: rgba(16, 185, 129, 0.1);">
                      <td colspan="2" style="padding: 16px; color: #E2E8F0; font-size: 16px; font-weight: 600;">
                        Tổng cộng:
                      </td>
                      <td style="padding: 16px; color: #34D399; font-size: 18px; font-weight: 700; text-align: right;">
                        ${totalAmount}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              ${shippingAddress ? `
              <!-- Shipping Address -->
              <div style="margin: 30px 0; padding: 20px; background: rgba(100, 116, 139, 0.1); border-radius: 8px;">
                <h4 style="margin: 0 0 12px; color: #94A3B8; font-size: 14px; font-weight: 600;">📍 Địa chỉ giao hàng</h4>
                <p style="margin: 0; color: #CBD5E1; font-size: 15px; line-height: 1.6;">
                  ${shippingAddress}
                </p>
              </div>
              ` : ''}

              <!-- CTA -->
              <div style="margin: 30px 0; text-align: center;">
                <a href="https://wellnexus.vn/orders/${orderId}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Xem chi tiết đơn hàng
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #94A3B8; font-size: 14px; line-height: 1.6;">
                💡 <strong>Bạn sẽ nhận được hoa hồng</strong> từ đơn hàng này! Kiểm tra ví của bạn để xem thu nhập.
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
                📧 support@wellnexus.vn | 🌐 <a href="https://wellnexus.vn" style="color: #34D399; text-decoration: none;">wellnexus.vn</a>
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
