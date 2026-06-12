"use client";

import { useMemo, useState } from "react";
import type { ErpDataset } from "@/lib/types";

const PAGE_SIZE = 50;

type TabKey = keyof ErpDataset;

const TAB_MAP: Record<TabKey, { label: string; columns: string[] }> = {
  products: {
    label: "상품",
    columns: [
      "product_id",
      "product_name",
      "category",
      "brand",
      "unit_cost_krw",
      "unit_price_krw",
      "stock_qty",
      "status",
    ],
  },
  customers: {
    label: "고객",
    columns: [
      "customer_id",
      "customer_name",
      "customer_type",
      "city",
      "phone",
      "email",
      "join_date",
      "tier",
    ],
  },
  orders: {
    label: "주문",
    columns: [
      "order_no",
      "customer_id",
      "order_date",
      "status",
      "channel",
      "payment_method",
      "total_amount_krw",
    ],
  },
  orderDetails: {
    label: "주문상세",
    columns: [
      "order_item_id",
      "order_no",
      "product_id",
      "qty",
      "unit_price_krw",
      "discount_pct",
      "amount_krw",
    ],
  },
};

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toLocaleString("ko-KR");
  return String(value);
}

function getCellValue(row: object, col: string): unknown {
  return (row as Record<string, unknown>)[col];
}

interface DataTableViewerProps {
  dataset: ErpDataset;
}

export function DataTableViewer({ dataset }: DataTableViewerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [page, setPage] = useState(1);

  const tabConfig = TAB_MAP[activeTab];
  const rows = dataset[activeTab];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="data-viewer">
      <div className="data-tabs">
        {(Object.keys(TAB_MAP) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`data-tab${activeTab === key ? " data-tab--active" : ""}`}
            onClick={() => switchTab(key)}
          >
            {TAB_MAP[key].label}
            <span className="data-tab-count">
              {dataset[key].length.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {tabConfig.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i}>
                <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                {tabConfig.columns.map((col) => (
                  <td key={col}>{formatCell(getCellValue(row, col))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="data-pagination">
        <span className="data-page-info">
          {rows.length.toLocaleString()}행 중 {(page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, rows.length)}
        </span>
        <div className="data-page-buttons">
          <button
            type="button"
            className="btn btn-outline btn-inline btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </button>
          <span className="data-page-num">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-inline btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
