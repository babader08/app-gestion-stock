import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Label,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md">
        <p className="text-xs text-gray-500">{payload[0].name}</p>
        <p className="text-sm font-bold text-gray-800">
          {payload[0].value} produits
        </p>
      </div>
    );
  }
  return null;
};

// ✅ Label au centre du donut
const CenterLabel = ({ viewBox, total }) => {
  const { cx, cy } = viewBox;
  return (
    <>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="#111827"
        fontSize={22}
        fontWeight={700}
      >
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#9ca3af" fontSize={11}>
        produits
      </text>
    </>
  );
};

// ✅ Reçoit les vraies données en props
const StockChart = ({ enStock = 0, enRupture = 0 }) => {
  const total = enStock + enRupture;

  const data = [
    { name: "En Stock", value: enStock, color: "#2563eb" },
    { name: "Rupture", value: enRupture, color: "#f97316" },
  ];

  return (
    <div className="h-60 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-700">
        État de l'Inventaire
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            {/* ✅ Label total au centre */}
            <Label content={<CenterLabel total={total} />} position="center" />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 12, color: "#6b7280" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
