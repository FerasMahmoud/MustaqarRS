'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface MiniChartProps {
  data: Array<{ date: string; value: number }>;
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

/**
 * A compact sparkline chart for dashboard metrics
 * Uses Recharts Area chart with minimal styling
 */
export function MiniChart({
  data,
  color = '#C9A96E',
  height = 40,
  showTooltip = true,
}: MiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#8B7355] text-xs"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: '#2D2D2D',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#C9A96E', fontWeight: 'bold' }}
            itemStyle={{ color: '#FFFFFF' }}
            formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'Value']}
            labelFormatter={(label) => label}
          />
        )}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color.replace('#', '')})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default MiniChart;
