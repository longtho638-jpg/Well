import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useUpdateOrderStatus } from '../../hooks/queries/useOrders';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { ChevronLeft, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Order } from '../../types';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id || '');
  const updateStatusMutation = useUpdateOrderStatus();

  const handleStatusUpdate = (status: Order['status']) => {
      if (!id) return;
      updateStatusMutation.mutate({ id, status });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!order) return <div>Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={() => navigate('/orders')} className="pl-0">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
        </Button>
        <div className="flex gap-2">
            {order.status === 'pending' && (
                <Button onClick={() => handleStatusUpdate('processing')} variant="outline">
                    Xác nhận đơn
                </Button>
            )}
            {order.status === 'processing' && (
                <Button onClick={() => handleStatusUpdate('shipped')} className="bg-purple-600 hover:bg-purple-700">
                    <Truck className="w-4 h-4 mr-2" />
                    Gửi hàng
                </Button>
            )}
            {order.status === 'shipped' && (
                <Button onClick={() => handleStatusUpdate('delivered')} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Hoàn thành
                </Button>
            )}
            {['pending', 'processing'].includes(order.status) && (
                 <Button onClick={() => handleStatusUpdate('cancelled')} variant="danger">
                    <XCircle className="w-4 h-4 mr-2" />
                    Hủy đơn
                 </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
              <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-brand-primary dark:text-teal-500" />
                      Chi tiết đơn hàng
                  </h3>
                  <div className="space-y-4">
                        {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded bg-slate-100 dark:bg-slate-800" />
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Product Name (Placeholder)</p>
                                        <p className="text-sm text-slate-500">x{item.quantity}</p>
                                    </div>
                                </div>
                                <div className="font-medium">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                </div>
                            </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                            <div className="text-center text-slate-500 py-4">Chưa có thông tin sản phẩm (Join logic needed)</div>
                        )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                      <span className="font-bold">Tổng cộng</span>
                      <span className="text-xl font-bold text-brand-primary dark:text-teal-400">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
                      </span>
                  </div>
              </GlassCard>
          </div>

          <div className="space-y-6">
              <GlassCard className="p-6">
                  <h3 className="font-bold mb-4">Thông tin khách hàng</h3>
                  <div className="space-y-3">
                      <div>
                          <p className="text-sm text-slate-500">Họ tên</p>
                          <p className="font-medium">{order.customer?.full_name}</p>
                      </div>
                       <div>
                          <p className="text-sm text-slate-500">Số điện thoại</p>
                          <p className="font-medium">{order.customer?.phone}</p>
                      </div>
                       <div>
                          <p className="text-sm text-slate-500">Địa chỉ</p>
                          <p className="font-medium">{order.customer?.address || 'N/A'}</p>
                      </div>
                  </div>
              </GlassCard>

               <GlassCard className="p-6">
                  <h3 className="font-bold mb-4">Trạng thái</h3>
                  <div className="space-y-4">
                      <div>
                          <p className="text-sm text-slate-500 mb-1">Đơn hàng</p>
                          <Badge className="capitalize text-base px-3 py-1">{order.status}</Badge>
                      </div>
                       <div>
                          <p className="text-sm text-slate-500 mb-1">Thanh toán</p>
                          <Badge variant="outline" className="capitalize text-base px-3 py-1">{order.payment_status}</Badge>
                      </div>
                       <div>
                          <p className="text-sm text-slate-500 mb-1">Ngày tạo</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                  </div>
              </GlassCard>
          </div>
      </div>
    </div>
  );
}
