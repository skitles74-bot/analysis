"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { computeKpis } from "@/lib/analytics/kpis";
import type {
  CrossValidationResult,
  CsvFileKey,
  ErpDataset,
  ErpReport,
  FileValidationResult,
  KpiSummary,
} from "@/lib/types";
import { STORAGE_KEY } from "@/lib/types";

interface DataContextValue {
  fileResults: Partial<Record<CsvFileKey, FileValidationResult>>;
  crossResult: CrossValidationResult | null;
  dataset: ErpDataset | null;
  kpis: KpiSummary | null;
  report: ErpReport | null;
  ready: boolean;
  setFileResult: (result: FileValidationResult) => void;
  setCrossResult: (result: CrossValidationResult | null) => void;
  setDataset: (dataset: ErpDataset | null) => void;
  setReport: (report: ErpReport | null) => void;
  clearAll: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [fileResults, setFileResults] = useState<
    Partial<Record<CsvFileKey, FileValidationResult>>
  >({});
  const [crossResult, setCrossResult] = useState<CrossValidationResult | null>(
    null
  );
  const [dataset, setDatasetState] = useState<ErpDataset | null>(null);
  const [report, setReport] = useState<ErpReport | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          dataset: ErpDataset;
          report?: ErpReport;
        };
        setDatasetState(parsed.dataset);
        if (parsed.report) setReport(parsed.report);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  const setDataset = useCallback((next: ErpDataset | null) => {
    setDatasetState(next);
    if (next) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ dataset: next, report: null })
      );
      setReport(null);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setFileResult = useCallback((result: FileValidationResult) => {
    setFileResults((prev) => ({ ...prev, [result.key]: result }));
  }, []);

  const clearAll = useCallback(() => {
    setFileResults({});
    setCrossResult(null);
    setDatasetState(null);
    setReport(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const kpis = useMemo(
    () => (dataset ? computeKpis(dataset) : null),
    [dataset]
  );

  const ready = Boolean(dataset);

  const value = useMemo(
    () => ({
      fileResults,
      crossResult,
      dataset,
      kpis,
      report,
      ready,
      setFileResult,
      setCrossResult,
      setDataset,
      setReport,
      clearAll,
    }),
    [
      fileResults,
      crossResult,
      dataset,
      kpis,
      report,
      ready,
      setFileResult,
      setDataset,
      clearAll,
    ]
  );

  if (!hydrated) return null;

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function usePersistReport(report: ErpReport | null, dataset: ErpDataset | null) {
  useEffect(() => {
    if (report && dataset) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ dataset, report })
      );
    }
  }, [report, dataset]);
}
