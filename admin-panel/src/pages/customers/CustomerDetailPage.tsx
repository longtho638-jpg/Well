import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerOrders } from '../../hooks/queries/useCustomers';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { ChevronLeft, ShoppingBag, Calendar, MapPin, Phone } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id || '');
  const { data: orders, isLoading: isLoadingOrders } = useCustomerOrders(id || '');

  if (isLoading) return <div>Loading...</div>;
  if (!customer) return <div>Not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/customers')} className="pl-0">
        <ChevronLeft className="w-4 h-4 mr-2" />
        Quay lại danh sách
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
          {/* Customer Profile */}
          <div className="w-full md:w-1/3 space-y-6">
             <GlassCard className="p-6">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold mb-4">
                        {customer.full_name?.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{customer.full_name}</h2>
                    <p className="text-slate-500">{customer.email}</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{customer.address || 'Chưa cập nhật địa chỉ'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Tham gia: {new Date(customer.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500">Tổng chi tiêu</span>
                        <span className="font-bold text-lg text-brand-primary dark:text-teal-400">
                             {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.total_spent)}
                        </span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Tổng đơn hàng</span>
                        <span className="font-medium">
                             {customer.total_orders} đơn
                        </span>
                    </div>
                </div>
             </GlassCard>
          </div>

          {/* Order History */}
          <div className="w-full md:w-2/3">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Lịch sử mua hàng
             </h3>

             <div className="space-y-4">
                {isLoadingOrders ? (
                    <div>Loading orders...</div>
                ) : orders?.length === 0 ? (
                    <div className="text-slate-500 italic">Chưa có đơn hàng nào.</div>
                ) : (
                    orders?.map((order: any) => (
                        <GlassCard key={order.id} className="p-4 flex justify-between items-center">
                            <div>
                                <div className="font-medium">Đơn hàng #{order.id.slice(0, 8)}</div>
                                <div className="text-xs text-slate-500">
                                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">
                                     {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
                                </div>
                                <div className={`text-xs capitalize ${
                                    order.status === 'delivered' ? 'text-green-500' :
                                    order.status === 'cancelled' ? 'text-red-500' : 'text-amber-500'
                                }`}>
                                    {order.status}
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
             </div>
          </div>
      </div>
    </div>
  );
}
