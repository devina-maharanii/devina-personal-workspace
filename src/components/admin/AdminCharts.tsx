"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface AdminChartsProps {
  newUsersData: ChartDataPoint[];
  revenueData: RevenueDataPoint[];
}

export function AdminCharts({ newUsersData, revenueData }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* User Registration Timeline */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-100">User Registrations</h3>
          <p className="text-xs text-zinc-400">Total signups per day in the last 30 days</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={newUsersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderRadius: "12px",
                  color: "#f4f4f5",
                }}
                labelStyle={{ fontWeight: "bold", color: "#a1a1aa" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#userGrad)"
                name="Signups"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue History Timeline */}
      <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-100">Monthly Revenue Growth</h3>
          <p className="text-xs text-zinc-400">Estimated MRR growth over the last 6 months</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderRadius: "12px",
                  color: "#f4f4f5",
                }}
                labelStyle={{ fontWeight: "bold", color: "#a1a1aa" }}
                formatter={(value) => [`$${value}`, "MRR"]}
              />
              <Bar
                dataKey="revenue"
                fill="url(#barGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              >
                {/* Apply dynamic red gradient directly to bars */}
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
