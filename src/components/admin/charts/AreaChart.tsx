'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AreaChartProps {
  data: Array<Record<string, unknown>>;
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
}

/**
 * A reusable area chart component for time series data
 * Supports multiple data series with custom colors
 */
export function AreaChart({
  data,
  dataKeys,
  xAxisKey = 'date',
  height = 300,
  showGrid = true,
  showLegend = true,
  valueFormatter = (value) => value.toLocaleString(),
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#8B7355] bg-[#FAF7F2] rounded-xl"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8E3DB"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: '#8B7355', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E8E3DB' }}
        />
        <YAxis
          tick={{ fill: '#8B7355', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E3DB',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: '#2D2D2D', fontWeight: 'bold', marginBottom: '8px' }}
          formatter={(value: number | undefined, name: string | undefined) => [
            valueFormatter(value ?? 0),
            name ?? '',
          ]}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span style={{ color: '#2D2D2D', fontSize: '14px' }}>{value}</span>
            )}
          />
        )}
        {dataKeys.map((dk, index) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color}
            strokeWidth={2}
            fill={dk.color}
            fillOpacity={0.1}
            stackId={index === 0 ? undefined : 'stack'}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

export default AreaChart;
