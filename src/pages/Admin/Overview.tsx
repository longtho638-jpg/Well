import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  AlertCircle,
  CheckCircle2,
  Bot,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Clock,
  Check,
  X,
  UserCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatVND } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// TYPES & MOCK DATA
// ============================================================

// Type for AI action data payloads
interface AIActionData {
  partnerId?: string;
  partnerName?: string;
  transactionCount?: number;
  ip?: string;
  amount?: number;
}

interface AIAction {
  id: string;
  type: 'kyc' | 'withdrawal' | 'fraud' | 'policy';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  aiConfidence: number;
  timestamp: string;
  data?: AIActionData;
}

interface LiveEvent {
  id: string;
  type: 'scan' | 'block' | 'approve' | 'alert';
  message: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  status?: 'success' | 'warning' | 'error';
  icon: React.ReactNode;
}

const mockAIActions: AIAction[] = [
  {
    id: 'A001',
    type: 'kyc',
    title: 'KYC Verification Required',
    description: 'Partner "Minh Tran" submitted KYC documents',
    priority: 'high',
    aiConfidence: 95,
    timestamp: '2 minutes ago',
    data: { partnerId: 'P002', partnerName: 'Minh Tran' }
  },
  {
    id: 'A002',
    type: 'fraud',
    title: 'Suspicious Activity Detected',
    description: '5 transactions from same IP in 10 minutes',
    priority: 'high',
    aiConfidence: 87,
    timestamp: '15 minutes ago',
    data: { transactionCount: 5, ip: '192.168.1.1' }
  },
  {
    id: 'A003',
    type: 'withdrawal',
    title: 'Large Withdrawal Request',
    description: 'Lan Nguyen requested 15.000.000 đ withdrawal',
    priority: 'medium',
    aiConfidence: 92,
    timestamp: '1 hour ago',
    data: { amount: 15000000, partnerId: 'P001' }
  },
];

const mockLiveEvents: LiveEvent[] = [
  {
    id: 'E001',
    type: 'scan',
    message: 'AI scanning 245 partner profiles...',
    timestamp: 'Just now',
    icon: <Bot className="w-4 h-4" />,
    color: 'text-blue-600'
  },
  {
    id: 'E002',
    type: 'block',
    message: 'Blocked 1 spam registration attempt',
    timestamp: '30 sec ago',
    icon: <ShieldAlert className="w-4 h-4" />,
    color: 'text-red-600'
  },
  {
    id: 'E003',
    type: 'approve',
    message: 'Auto-approved 3 withdrawals < 500k',
    timestamp: '2 min ago',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-600'
  },
  {
    id: 'E004',
    type: 'alert',
    message: 'Partner "Huong Le" close to rank upgrade',
    timestamp: '5 min ago',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-amber-600'
  },
];

const mockGrowthData = [
  { name: 'T2', revenue: 180000000 },
  { name: 'T3', revenue: 220000000 },
  { name: 'T4', revenue: 280000000 },
  { name: 'T5', revenue: 310000000 },
  { name: 'T6', revenue: 390000000 },
  { name: 'T7', revenue: 450000000 },
  { name: 'CN', revenue: 520000000 },
];

// ============================================================
// METRIC CARD COMPONENT
// ============================================================

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, status, icon }) => {
  const statusColors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50',
  };

  const trendColor = trend?.startsWith('+') ? 'text-green-600' : 'text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-lg p-6 hover:border-[#00575A] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendColor} flex items-center gap-1`}>
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${status ? statusColors[status] : 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// AI ACTION CARD COMPONENT
// ============================================================

const AIActionCard: React.FC<{ action: AIAction; onApprove: () => void; onReject: () => void }> = ({
  action,
  onApprove,
  onReject,
}) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const typeIcons = {
    kyc: <UserCheck className="w-5 h-5" />,
    withdrawal: <Wallet className="w-5 h-5" />,
    fraud: <ShieldAlert className="w-5 h-5" />,
    policy: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white border border-slate-200 rounded-lg p-4 hover:border-[#00575A] transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${priorityColors[action.priority]}`}>
          {typeIcons[action.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 text-sm">{action.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[action.priority]}`}>
              {action.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-2">{action.description}</p>

          {/* AI Confidence */}
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-[#00575A]" />
            <div className="flex-1 bg-slate-100 rounded-full h-2">
              <div
                className="bg-[#00575A] h-full rounded-full transition-all"
                style={{ width: `${action.aiConfidence}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600">{action.aiConfidence}% confident</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onApprove}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={onReject}
              className="flex-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button className="px-3 py-1.5 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">
              Details
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          {action.timestamp}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// LIVE PULSE COMPONENT
// ============================================================

const LivePulse: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#00575A]" />
          <h3 className="text-lg font-display font-bold text-slate-900">Live Pulse</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-green-600">AI Active</span>
        </div>
      </div>

      {/* Event Stream */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {mockLiveEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
          >
            <div className={event.color}>{event.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900">{event.message}</p>
              <p className="text-xs text-slate-500 mt-0.5">{event.timestamp}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================
// MAIN OVERVIEW COMPONENT
// ============================================================

const Overview: React.FC = () => {
  const [aiActions, setAIActions] = useState<AIAction[]>(mockAIActions);

  const { showToast } = useToast();

  const handleApprove = async (actionId: string) => {
    // Simulate API Call
    await new Promise(resolve => setTimeout(resolve, 500));
    setAIActions((prev) => prev.filter((a) => a.id !== actionId));
    showToast('Action approved successfully', 'success');
  };

  const handleReject = async (actionId: string) => {
    // Simulate API Call
    await new Promise(resolve => setTimeout(resolve, 500));
    setAIActions((prev) => prev.filter((a) => a.id !== actionId));
    showToast('Action rejected', 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Mission Control</h2>
        <p className="text-slate-500 mt-1">AI-powered enterprise operations dashboard</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Revenue"
          value="2.450.000.000 đ"
          trend="+12%"
          icon={<Activity className="w-6 h-6" />}
        />
        <MetricCard
          label="Active Partners"
          value="245"
          trend="+5"
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          label="AI Actions Pending"
          value={aiActions.length.toString()}
          status="warning"
          icon={<Bot className="w-6 h-6" />}
        />
        <MetricCard
          label="System Health"
          value="99.9%"
          status="success"
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
      </div>

      {/* AI Action Center & Live Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Action Center */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00575A]" />
              <h3 className="text-lg font-display font-bold text-slate-900">AI Action Center</h3>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
              {aiActions.length} pending
            </span>
          </div>

          {aiActions.length > 0 ? (
            <div className="space-y-3">
              {aiActions.map((action) => (
                <AIActionCard
                  key={action.id}
                  action={action}
                  onApprove={() => handleApprove(action.id)}
                  onReject={() => handleReject(action.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">AI will notify you when action is needed</p>
            </div>
          )}
        </div>

        {/* Live Pulse */}
        <div>
          <LivePulse />
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-display font-bold text-slate-900 mb-6">7-Day Revenue Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={mockGrowthData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00575A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00575A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatVND(value)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#00575A"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default Overview;
