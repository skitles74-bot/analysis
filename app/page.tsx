"use client";

import { useCallback, useEffect, useState } from "react";
import { CsvUploader } from "@/app/components/CsvUploader";
import { ValidationPanel } from "@/app/components/ValidationPanel";
import {
  buildDataset,
  crossValidateDataset,
} from "@/lib/csv/cross-validator";
import { parseAndValidateCsv } from "@/lib/csv/parser";
import { useData } from "@/lib/context/DataContext";
import type {
  CsvFileKey,
  Customer,
  Product,
  SalesOrder,
  SalesOrderItem,
} from "@/lib/types";
import { CSV_FILE_SLOTS } from "@/lib/types";

const SAMPLE_MAP: Record<CsvFileKey, string> = {
  products: "products.csv",
  customers: "customers.csv",
  orders: "sales_orders.csv",
  orderDetails: "sales_order_items.csv",
};

export default function UploadPage() {
  const {
    fileResults,
    crossResult,
    ready,
    setFileResult,
    setCrossResult,
    setDataset,
    clearAll,
  } = useData();
  const [loadingKey, setLoadingKey] = useState<CsvFileKey | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const handleFileSelect = useCallback(
    async (key: CsvFileKey, file: File) => {
      setLoadingKey(key);
      try {
        const result = await parseAndValidateCsv(key, file);
        setFileResult(result);
      } finally {
        setLoadingKey(null);
      }
    },
    [setFileResult]
  );

  const loadSampleData = useCallback(async () => {
    setLoadingSample(true);
    try {
      for (const slot of CSV_FILE_SLOTS) {
        const fileName = SAMPLE_MAP[slot.key];
        const res = await fetch(`/api/sample/${fileName}`);
        if (!res.ok) throw new Error(`${fileName} 로드 실패`);
        const text = await res.text();
        const file = new File([text], fileName, { type: "text/csv" });
        await handleFileSelect(slot.key, file);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "샘플 로드 실패");
    } finally {
      setLoadingSample(false);
    }
  }, [handleFileSelect]);

  useEffect(() => {
    const allValid = CSV_FILE_SLOTS.every(
      (s) => fileResults[s.key]?.valid && fileResults[s.key]?.data
    );

    const hasAnyFile = CSV_FILE_SLOTS.some((s) => fileResults[s.key]);

    if (!allValid) {
      if (hasAnyFile) {
        setCrossResult(null);
        setDataset(null);
      }
      return;
    }

    const dataset = buildDataset(
      fileResults.products!.data as Product[],
      fileResults.customers!.data as Customer[],
      fileResults.orders!.data as SalesOrder[],
      fileResults.orderDetails!.data as SalesOrderItem[]
    );

    const cross = crossValidateDataset(dataset);
    setCrossResult(cross);

    if (cross.valid) {
      setDataset(dataset);
    } else {
      setDataset(null);
    }
  }, [fileResults, setCrossResult, setDataset]);

  const fileNames = Object.fromEntries(
    CSV_FILE_SLOTS.map((s) => [s.key, fileResults[s.key]?.fileName]).filter(
      ([, name]) => name
    )
  ) as Partial<Record<CsvFileKey, string>>;

  return (
    <div className="page-stack">
      <div className="card">
        <h2 className="card-title">CSV 파일 업로드</h2>
        <p className="card-desc">
          상품·고객·주문·주문상세 CSV 4개를 업로드하세요. 파일 선택 즉시
          유효성 검사가 실행됩니다.
        </p>
        <CsvUploader
          onFileSelect={handleFileSelect}
          fileNames={fileNames}
          loadingKey={loadingKey}
        />
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadSampleData}
            disabled={loadingSample || loadingKey !== null}
          >
            {loadingSample ? "샘플 로드 중..." : "샘플 CSV 불러오기"}
          </button>
          <button type="button" className="btn btn-outline" onClick={clearAll}>
            전체 초기화
          </button>
        </div>
        {ready && (
          <p className="hint hint--success">
            데이터 준비 완료 — 상단 메뉴에서 대시보드, 보고서, 원본데이터를
            확인하세요.
          </p>
        )}
      </div>

      <ValidationPanel fileResults={fileResults} crossResult={crossResult} />

      <div className="card card--hint">
        <h3 className="card-title-sm">샘플 데이터</h3>
        <p className="hint">
          <code>sample-data/</code> 폴더에 샘플 CSV가 있습니다: products.csv,
          customers.csv, sales_orders.csv, sales_order_items.csv
        </p>
      </div>
    </div>
  );
}
