'use client';

import { useTheme } from 'next-themes';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyStats {
  date: string;
  total: number;
  unique: number;
}

interface BreakdownStat {
  name: string;
  value: number;
}

interface AnalyticsChartsProps {
  dailyStats: DailyStats[];
  deviceStats: BreakdownStat[];
  browserStats: BreakdownStat[];
  locationStats: BreakdownStat[];
}

const COLORS = ['#0071e3', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

/**
 * Normalizes ISO country codes to readable names.
 */
function normalizeCountry(code: string): string {
  if (!code || code === 'Unknown') return 'Unknown';
  const names: Record<string, string> = {
    'AE': 'United Arab Emirates', 'US': 'United States', 'GB': 'United Kingdom',
    'SA': 'Saudi Arabia', 'IN': 'India', 'CA': 'Canada', 'AU': 'Australia',
    'DE': 'Germany', 'FR': 'France'
  };
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) || names[code] || code;
  } catch {
    return names[code] || code;
  }
}

export function AnalyticsCharts({ dailyStats, deviceStats, browserStats, locationStats }: AnalyticsChartsProps) {
  const { theme } = useTheme();
  
  // Adapt text colors based on theme
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const tooltipBg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#374151' : '#e5e7eb';

  const formattedLocations = locationStats.map(l => ({
    name: normalizeCountry(l.name),
    value: l.value
  }));

  return (
    <div className="space-y-6">
      {/* ── Time Series Area Chart ── */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Tap Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyStats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="date" 
                  stroke={textColor} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
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
                <Legend iconType="circle" />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Total Taps"
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Breakdown Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Locations (Bar Chart) */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedLocations}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    stroke={textColor}
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: gridColor, opacity: 0.4 }}
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" name="Taps" fill="#0071e3" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Devices Donut */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Browsers Donut */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={browserStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {browserStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
