import { motion } from 'framer-motion';
import { Activity, Award } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/hooks';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface PerformanceChartProps {
  networkHealthData: ChartDataItem[];
  rankDistribution: ChartDataItem[];
}

/**
 * Performance visualization charts for network health and rank distribution
 * Displays donut charts with legends
 */
export default function PerformanceChart({
  networkHealthData,
  rankDistribution
}: PerformanceChartProps) {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Network Health - Donut Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
          <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            {t('leaderdashboard.network_health')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={networkHealthData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {networkHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4">
            {networkHealthData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-400 text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Rank Distribution */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
          <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            {t('team.charts.rankDistribution')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={rankDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {rankDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
