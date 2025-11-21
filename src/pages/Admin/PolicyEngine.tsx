import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, TrendingUp, Crown, DollarSign, Lock, Unlock, Play, Save, AlertCircle } from 'lucide-react';

/**
 * DYNAMIC POLICY ENGINE
 * The Command Center for Business Strategy Execution
 *
 * Philosophy: "Quyền sinh sát nằm trong tay những biến số"
 * Every number is a variable. Every rule is dynamic. Every elite has power.
 */

interface PolicyConfig {
  base_commission_rate: number; // % cơ bản cho mọi người
  elite_bonus_pool: number; // % doanh thu dành riêng cho Top 200
  white_label_trigger: number; // Mốc doanh số (VND) để được White-label
  vendor_fee: number; // % phí thu từ Vendor sau khi tách nhánh
  elite_threshold: number; // Số lượng Elite (mặc định 200)
  zodiac_count: number; // Số lượng "12 Tướng" (The Zodiac 12)
}

interface SimulationResult {
  revenue: number;
  base_payout: number;
  elite_bonus: number;
  total_payout: number;
  platform_profit: number;
  profit_margin: number;
}

export default function PolicyEngine() {
  const [config, setConfig] = useState<PolicyConfig>({
    base_commission_rate: 15,
    elite_bonus_pool: 5,
    white_label_trigger: 1000000000, // 1 tỷ VND/tháng
    vendor_fee: 20,
    elite_threshold: 200,
    zodiac_count: 12,
  });

  const [simulation, setSimulation] = useState({
    revenue: 5000000000, // 5 tỷ VND
    elite_sales: 3000000000, // 60% từ Elite
    regular_sales: 2000000000,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate simulation results
  const runSimulation = () => {
    const basePayout = simulation.revenue * (config.base_commission_rate / 100);
    const eliteBonus = simulation.revenue * (config.elite_bonus_pool / 100);
    const totalPayout = basePayout + eliteBonus;
    const platformProfit = simulation.revenue - totalPayout;
    const profitMargin = (platformProfit / simulation.revenue) * 100;

    setResult({
      revenue: simulation.revenue,
      base_payout: basePayout,
      elite_bonus: eliteBonus,
      total_payout: totalPayout,
      platform_profit: platformProfit,
      profit_margin: profitMargin,
    });
  };

  useEffect(() => {
    runSimulation();
  }, [config, simulation]);

  const handleSavePolicy = async () => {
    setIsSaving(true);

    // Simulate API call to Firestore
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Saving policy to Firestore:', {
      timestamp: new Date().toISOString(),
      config,
      version: 'system_policy_v1',
    });

    setIsSaving(false);
    setIsLocked(true);

    // Show success notification (in production, use toast library)
    alert('✅ Chính sách đã được lưu vào hệ thống!');
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary p-6">
      {/* Header: The Command Center */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Settings className="text-accent" size={40} />
              POLICY ENGINE
            </h1>
            <p className="text-gray-400 text-lg">
              Trung tâm quyền lực • Nơi sinh sát chiến lược • Dynamic by Design
            </p>
          </div>

          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
              isLocked
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
            {isLocked ? 'MỞ KHÓA' : 'ĐANG CHỈNH SỬA'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: Policy Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-accent" />
            CẤU HÌNH CHÍNH SÁCH
          </h2>

          <div className="space-y-6">
            {/* Base Commission Rate */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Hoa Hồng Cơ Bản (Base Commission)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={config.base_commission_rate}
                  onChange={(e) =>
                    setConfig({ ...config, base_commission_rate: Number(e.target.value) })
                  }
                  disabled={isLocked}
                  className="flex-1"
                />
                <span className="text-accent text-2xl font-bold w-16 text-right">
                  {config.base_commission_rate}%
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Áp dụng cho tất cả CTV. Được trả từ mỗi giao dịch.
              </p>
            </div>

            {/* Elite Bonus Pool */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Crown className="text-yellow-400" size={20} />
                Quỹ Thưởng Tinh Hoa (Elite Pool)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={config.elite_bonus_pool}
                  onChange={(e) =>
                    setConfig({ ...config, elite_bonus_pool: Number(e.target.value) })
                  }
                  disabled={isLocked}
                  className="flex-1"
                />
                <span className="text-yellow-400 text-2xl font-bold w-16 text-right">
                  {config.elite_bonus_pool}%
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Dành riêng cho Top 200. Càng cao càng hút quân tài.
              </p>
            </div>

            {/* White Label Trigger */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Mốc White-Label (Tách Thương Hiệu)
              </label>
              <input
                type="number"
                value={config.white_label_trigger}
                onChange={(e) =>
                  setConfig({ ...config, white_label_trigger: Number(e.target.value) })
                }
                disabled={isLocked}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white text-lg"
                placeholder="1,000,000,000"
              />
              <p className="text-gray-400 text-sm mt-1">
                Doanh số/tháng để được cấp Platform riêng (VND)
              </p>
              <p className="text-accent text-sm font-semibold">
                = {formatVND(config.white_label_trigger)}
              </p>
            </div>

            {/* Vendor Fee */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Phí Vendor (SaaS Fee)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={config.vendor_fee}
                  onChange={(e) =>
                    setConfig({ ...config, vendor_fee: Number(e.target.value) })
                  }
                  disabled={isLocked}
                  className="flex-1"
                />
                <span className="text-green-400 text-2xl font-bold w-16 text-right">
                  {config.vendor_fee}%
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Thu từ Vendor sau khi họ tách nhánh thành công.
              </p>
            </div>

            {/* Elite & Zodiac Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Top Elite</label>
                <input
                  type="number"
                  value={config.elite_threshold}
                  onChange={(e) =>
                    setConfig({ ...config, elite_threshold: Number(e.target.value) })
                  }
                  disabled={isLocked}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">12 Tướng</label>
                <input
                  type="number"
                  value={config.zodiac_count}
                  onChange={(e) =>
                    setConfig({ ...config, zodiac_count: Number(e.target.value) })
                  }
                  disabled={isLocked}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {!isLocked && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleSavePolicy}
              disabled={isSaving}
              className="w-full mt-6 bg-accent hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'ĐANG LƯU...' : 'LƯU CHÍNH SÁCH'}
            </motion.button>
          )}
        </motion.div>

        {/* RIGHT PANEL: Simulation Engine */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Simulation Inputs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Play className="text-green-400" />
              MÔ PHỎNG DÒNG TIỀN
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Doanh Thu Dự Kiến (VND)
                </label>
                <input
                  type="number"
                  value={simulation.revenue}
                  onChange={(e) => setSimulation({ ...simulation, revenue: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white text-lg"
                />
                <p className="text-accent font-semibold mt-1">
                  = {formatVND(simulation.revenue)}
                </p>
              </div>

              <button
                onClick={runSimulation}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Play size={20} />
                CHẠY MÔ PHỎNG
              </button>
            </div>
          </div>

          {/* Simulation Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-primary to-gray-800 rounded-2xl p-6 border border-accent/30"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="text-accent" />
                KẾT QUẢ MÔ PHỎNG
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Tổng Doanh Thu:</span>
                  <span className="text-white font-bold text-lg">
                    {formatVND(result.revenue)}
                  </span>
                </div>

                <div className="h-px bg-white/20"></div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Hoa Hồng Cơ Bản:</span>
                  <span className="text-blue-400 font-bold">
                    {formatVND(result.base_payout)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Thưởng Tinh Hoa:</span>
                  <span className="text-yellow-400 font-bold">
                    {formatVND(result.elite_bonus)}
                  </span>
                </div>

                <div className="h-px bg-white/20"></div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-semibold">Tổng Chi Trả:</span>
                  <span className="text-red-400 font-bold text-lg">
                    {formatVND(result.total_payout)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-lg">Lợi Nhuận Platform:</span>
                  <span className="text-accent font-bold text-2xl">
                    {formatVND(result.platform_profit)}
                  </span>
                </div>

                <div className="mt-4 bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Tỷ Suất Lợi Nhuận:</span>
                    <span className={`font-bold text-xl ${
                      result.profit_margin > 50 ? 'text-green-400' :
                      result.profit_margin > 30 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {result.profit_margin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Warning Box */}
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
            <div className="text-sm text-red-200">
              <p className="font-semibold mb-1">CẢNH BÁO CHIẾN LƯỢC:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Hoa hồng quá cao → Lợi nhuận thấp → VC không thích</li>
                <li>Elite Pool quá thấp → Không hút được quân tài</li>
                <li>White-label trigger quá cao → Không ai đủ điều kiện</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer: Strategic Notes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
      >
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Crown className="text-accent" />
          TRIẾT LÝ: "QUYỀN LỰC TRONG TAY BIẾN SỐ"
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-gray-300">
            <span className="text-accent font-semibold">Dynamic:</span> Mọi con số đều có thể thay đổi theo thời điểm thị trường.
          </div>
          <div className="text-gray-300">
            <span className="text-accent font-semibold">Elite-First:</span> Hệ thống ưu tiên phục vụ Top 200, không phải đám đông.
          </div>
          <div className="text-gray-300">
            <span className="text-accent font-semibold">White-label Ready:</span> Kiến trúc sẵn sàng cho Vendor tách nhánh.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
