import type { KpiSummary } from "@/lib/types";

function formatKrw(value: number): string {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억원`;
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(0)}만원`;
  }
  return `${value.toLocaleString()}원`;
}

interface KpiCardsProps {
  kpis: KpiSummary;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    { label: "총매출", value: formatKrw(kpis.totalRevenue) },
    { label: "주문건수", value: `${kpis.orderCount.toLocaleString()}건` },
    { label: "평균객단가", value: formatKrw(kpis.avgOrderValue) },
    {
      label: "활성고객",
      value: `${kpis.activeCustomerCount.toLocaleString()}명`,
      sub: `/ 전체 ${kpis.totalCustomers.toLocaleString()}명`,
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card">
          <div className="kpi-label">{card.label}</div>
          <div className="kpi-value">{card.value}</div>
          {card.sub && <div className="kpi-sub">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}
