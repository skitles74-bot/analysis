"use client";

import Link from "next/link";
import { DashboardCharts } from "@/app/components/DashboardCharts";
import { KpiCards } from "@/app/components/KpiCards";
import { useData } from "@/lib/context/DataContext";

export default function DashboardPage() {
  const { ready, kpis } = useData();

  if (!ready || !kpis) {
    return (
      <div className="empty-state card">
        <h2>데이터가 없습니다</h2>
        <p>4개 CSV 파일을 업로드하고 유효성 검사를 통과한 후 이용할 수 있습니다.</p>
        <Link href="/" className="btn btn-primary btn-inline">
          CSV 업로드하기
        </Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">경영 KPI 대시보드</h2>
            <p className="card-desc">
              분석 기간: {kpis.periodStart} ~ {kpis.periodEnd}
            </p>
          </div>
        </div>
        <KpiCards kpis={kpis} />
      </div>

      <DashboardCharts kpis={kpis} />
    </div>
  );
}
