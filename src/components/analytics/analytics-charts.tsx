'use client';

import { useTheme } from 'next-themes';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface DailyStats {
  date: string;
  total: number;
  unique: number;
  contacts: number;
}

export interface ChannelStats {
  name: string;
  value: number;
}

interface AnalyticsChartsProps {
  dailyStats: DailyStats[];
  channelStats: ChannelStats[];
}

const COLORS = ['#0071e3', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function AnalyticsCharts({ dailyStats, channelStats }: AnalyticsChartsProps) {
  const { theme } = useTheme();
  
  // Adapt text colors based on theme
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const tooltipBg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border-border bg-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Networking Trends</CardTitle>
          <CardDescription>Compare profile views with actual contacts captured over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyStats}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0071e3" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="date" 
                  stroke={textColor} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10}
                />
                <YAxis 
                  stroke={textColor} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: textColor }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '24px', fontSize: '12px', paddingLeft: '20px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Views"
                  stroke="#0071e3" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="unique" 
                  name="Unique Visitors"
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorUnique)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="contacts" 
                  name="Contacts Captured"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorContacts)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card lg:col-span-1">
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>Where are your connections coming from?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4 flex flex-col items-center justify-center">
            {channelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelStats}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px' }}
                    itemStyle={{ color: textColor }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-muted flex items-center justify-center" />
                <p className="text-sm text-muted-foreground">No leads captured yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
