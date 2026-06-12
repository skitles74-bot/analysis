"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { KpiSummary } from "@/lib/types";

const COLORS = [
  "#c99400",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#4f46e5",
  "#059669",
  "#be185d",
];

function formatTooltip(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  chartId?: string;
}

export function ChartCard({ title, children, chartId }: ChartCardProps) {
  return (
    <div className="chart-card" data-chart-id={chartId}>
      <h3 className="chart-title">{title}</h3>
      <div className="chart-body">{children}</div>
    </div>
  );
}

interface DashboardChartsProps {
  kpis: KpiSummary;
}

export function DashboardCharts({ kpis }: DashboardChartsProps) {
  return (
    <div className="charts-grid">
      <ChartCard title="월별 매출 추이" chartId="monthly-revenue">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={kpis.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 100000000).toFixed(0)}억`}
            />
            <Tooltip formatter={formatTooltip} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#c99400"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="카테고리별 매출" chartId="category-revenue">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={kpis.categoryRevenue}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {kpis.categoryRevenue.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="TOP 10 상품 (매출)" chartId="top-products">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={kpis.topProducts} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 10 }}
            />
            <Tooltip formatter={formatTooltip} />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="지역별 매출" chartId="city-revenue">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={kpis.cityRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 100000000).toFixed(0)}억`}
            />
            <Tooltip formatter={formatTooltip} />
            <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="고객등급별 매출" chartId="tier-distribution">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={kpis.tierDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {kpis.tierDistribution.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="주문상태별 건수" chartId="order-status">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={kpis.orderStatusBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#9333ea" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export const CHART_IDS = [
  { id: "monthly-revenue", label: "월별 매출 추이" },
  { id: "category-revenue", label: "카테고리별 매출" },
  { id: "top-products", label: "TOP 10 상품" },
];
