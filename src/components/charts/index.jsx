import {
  PieChart,
  Pie as RechartsPie,
  Cell,
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const Pie = ({ data, colors = [], showLegend = false }) => (
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      <RechartsPie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="label">
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </RechartsPie>
      <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
      {showLegend && <Legend />}
    </PieChart>
  </ResponsiveContainer>
);

export const Bar = ({ data, xField, series = [], layout = 'horizontal', groupMode = 'grouped', showLegend = false, colors = [] }) => {
  const isVertical = layout === 'vertical';
  const barSize = data.length > 10 ? 10 : 14;

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * (isVertical ? 28 : 60))}>
      <BarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 20, left: isVertical ? 10 : 20, bottom: isVertical ? 5 : 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        {isVertical ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey={xField} width={160} tick={{ fontSize: 10 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
          </>
        )}
        <Tooltip formatter={(value) => value.toLocaleString()} />
        {showLegend && <Legend />}
        {series.map((s, index) => (
          <RechartsBar
            key={s.key}
            dataKey={s.yField}
            fill={colors[index % colors.length]}
            barSize={barSize}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};
