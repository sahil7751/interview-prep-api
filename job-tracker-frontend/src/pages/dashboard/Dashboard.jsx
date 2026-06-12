import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';

const PIE_COLORS = [
  '#6366f1','#22c55e','#ef4444','#f59e0b',
  '#06b6d4','#8b5cf6','#f97316','#10b981','#3b82f6',
];

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500
                        border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Your job search at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={data.totalApplications}
          icon="📋" color="indigo"
        />
        <StatCard
          label="Selected"
          value={data.selectedCount}
          icon="✅" color="green"
          sub={`${data.successRate}% success rate`}
        />
        <StatCard
          label="Rejected"
          value={data.rejectedCount}
          icon="❌" color="red"
          sub={`${data.rejectionRate}% rejection rate`}
        />
        <StatCard
          label="In Progress"
          value={data.inProgressCount}
          icon="⏳" color="amber"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Applied"
          value={data.appliedCount}
          icon="📨" color="blue"
        />
        <StatCard
          label="Offer Received"
          value={data.offerReceivedCount}
          icon="🎉" color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart — Monthly Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Monthly Applications
          </h3>
          {data.monthlyTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center
                            text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyTrend}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Applications"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Status Breakdown
          </h3>
          {data.statusBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center
                            text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, percent }) =>
                    `${status.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={10}
                >
                  {data.statusBreakdown.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name.replace(/_/g, ' ')]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}

