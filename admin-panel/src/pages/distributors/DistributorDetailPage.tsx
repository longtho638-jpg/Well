import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDistributor, useUpdateDistributor } from '../../hooks/queries/useDistributors';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { ChevronLeft, Save, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function DistributorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: distributor, isLoading } = useDistributor(id || '');
  const updateMutation = useUpdateDistributor();

  const [commissionRate, setCommissionRate] = useState<number | string>('');

  React.useEffect(() => {
    if (distributor) {
        setCommissionRate(distributor.commission_rate);
    }
  }, [distributor]);

  const handleUpdate = () => {
    if (!id) return;
    updateMutation.mutate({
        id,
        updates: { commission_rate: Number(commissionRate) }
    }, {
        onSuccess: () => {
            // Show toast success
        }
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!distributor) return <div>Not found</div>;

  const user = distributor.user;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/distributors')} className="pl-0">
        <ChevronLeft className="w-4 h-4 mr-2" />
        Quay lại danh sách
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                {user?.full_name?.charAt(0)}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.full_name}</h1>
                <p className="text-slate-500">{user?.email}</p>
            </div>
         </div>
         <div className="flex gap-2">
             <Button variant="outline">Tạm khóa</Button>
             <Button onClick={handleUpdate} isLoading={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
             </Button>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-teal-500/10 text-teal-600">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500">Tổng doanh số</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(distributor.total_sales)}
                    </p>
                </div>
            </div>
        </GlassCard>

        <GlassCard className="p-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary">
                    <DollarSign className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500">Mức hoa hồng</p>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            className="w-24 h-8"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                        />
                        <span className="text-lg font-bold">%</span>
                    </div>
                </div>
            </div>
        </GlassCard>

        <GlassCard className="p-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500">Cấp bậc</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                        {distributor.level}
                    </p>
                </div>
            </div>
        </GlassCard>
      </div>

      {/* Placeholder for Downline/Orders Tabs */}
      <GlassCard className="min-h-[300px] p-6 flex items-center justify-center text-slate-500">
          Tabs: Lịch sử đơn hàng | Hệ thống tuyến dưới | Lịch sử thanh toán
      </GlassCard>
    </div>
  );
}
