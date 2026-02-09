'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  layout?: 'horizontal' | 'vertical';
  height?: number;
  showGrid?: boolean;
  defaultColor?: string;
  valueFormatter?: (value: number) => string;
  barSize?: number;
}

/**
 * A reusable bar chart component
 * Supports horizontal and vertical layouts with custom colors per bar
 */
export function BarChart({
  data,
  layout = 'horizontal',
  height = 300,
  showGrid = true,
  defaultColor = '#C9A96E',
  valueFormatter = (value) => value.toLocaleString(),
  barSize = 40,
}: BarChartProps) {
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

  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 30, left: isVertical ? 100 : 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8E3DB"
            horizontal={!isVertical}
            vertical={isVertical}
          />
        )}
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: '#8B7355', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#E8E3DB' }}
              tickFormatter={valueFormatter}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#2D2D2D', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
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
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E3DB',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: '#2D2D2D', fontWeight: 'bold', marginBottom: '4px' }}
          formatter={(value: number | undefined) => [valueFormatter(value ?? 0), 'Value']}
        />
        <Bar
          dataKey="value"
          barSize={barSize}
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || defaultColor}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export default BarChart;
