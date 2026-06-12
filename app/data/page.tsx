"use client";

import Link from "next/link";
import { DataTableViewer } from "@/app/components/DataTableViewer";
import { useData } from "@/lib/context/DataContext";

export default function DataPage() {
  const { ready, dataset } = useData();

  if (!ready || !dataset) {
    return (
      <div className="empty-state card">
        <h2>데이터가 없습니다</h2>
        <p>메인 화면에서 CSV 파일을 업로드한 후 원본 데이터를 확인할 수 있습니다.</p>
        <Link href="/" className="btn btn-primary btn-inline">
          CSV 업로드하기
        </Link>
      </div>
    );
  }

  const totalRows =
    dataset.products.length +
    dataset.customers.length +
    dataset.orders.length +
    dataset.orderDetails.length;

  return (
    <div className="page-stack">
      <div className="card">
        <h2 className="card-title">원본 데이터</h2>
        <p className="card-desc">
          업로드된 CSV 4종 · 총 {totalRows.toLocaleString()}행
        </p>
        <DataTableViewer dataset={dataset} />
      </div>
    </div>
  );
}
