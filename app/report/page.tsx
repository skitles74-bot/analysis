"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ReportViewer } from "@/app/components/ReportViewer";
import { useData, usePersistReport } from "@/lib/context/DataContext";
import type { ErpReport } from "@/lib/types";

type ReportStep = "validating" | "analyzing" | "generating";

const REPORT_STEPS: { id: ReportStep; label: string }[] = [
  { id: "validating", label: "데이터 확인" },
  { id: "analyzing", label: "ERP 분석" },
  { id: "generating", label: "보고서 작성" },
];

function parseSseChunk(chunk: string): Array<{ event: string; data: string }> {
  return chunk.split("\n\n").filter(Boolean).map((block) => {
    const lines = block.split("\n");
    const event =
      lines.find((l) => l.startsWith("event: "))?.slice(7) ?? "message";
    const data = lines.find((l) => l.startsWith("data: "))?.slice(6) ?? "{}";
    return { event, data };
  });
}

function getStepStatus(
  stepId: ReportStep,
  current: ReportStep | null,
  done: boolean
): "pending" | "active" | "done" {
  if (done) return "done";
  if (!current) return "pending";
  const order = REPORT_STEPS.map((s) => s.id);
  const curIdx = order.indexOf(current);
  const stepIdx = order.indexOf(stepId);
  if (stepIdx < curIdx) return "done";
  if (stepIdx === curIdx) return "active";
  return "pending";
}

export default function ReportPage() {
  const { ready, kpis, dataset, report, setReport } = useData();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ReportStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(Boolean(report));

  usePersistReport(report, dataset);

  const generateReport = useCallback(async () => {
    if (!kpis) return;
    setLoading(true);
    setError(null);
    setDone(false);
    setCurrentStep("validating");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kpis }),
      });

      if (!response.ok || !response.body) {
        throw new Error("서버 연결에 실패했습니다.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          for (const { event, data } of parseSseChunk(chunk)) {
            const parsed = JSON.parse(data) as Record<string, unknown>;

            if (event === "progress") {
              setCurrentStep(parsed.step as ReportStep);
            } else if (event === "report") {
              setReport((parsed.report as ErpReport) ?? null);
              setDone(true);
            } else if (event === "error") {
              throw new Error(String(parsed.message));
            } else if (event === "done") {
              setDone(true);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "보고서 생성 실패");
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  }, [kpis, setReport]);

  if (!ready || !kpis) {
    return (
      <div className="empty-state card">
        <h2>데이터가 없습니다</h2>
        <p>대시보드 데이터가 준비된 후 AI 보고서를 생성할 수 있습니다.</p>
        <Link href="/" className="btn btn-primary btn-inline">
          CSV 업로드하기
        </Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {!report && (
        <div className="card">
          <h2 className="card-title">AI 분석 보고서</h2>
          <p className="card-desc">
            Gemini AI가 KPI 데이터를 분석하여 경영 보고서를 작성합니다. 완료
            후 PDF / Word(.docx)로 다운로드할 수 있습니다.
          </p>

          {loading && (
            <div className="progress-panel">
              <div className="progress-title">보고서 생성 중</div>
              <ul className="progress-steps">
                {REPORT_STEPS.map((step) => {
                  const status = getStepStatus(step.id, currentStep, done);
                  return (
                    <li
                      key={step.id}
                      className={`progress-step progress-step--${status}`}
                    >
                      <span className="progress-step-icon">
                        {status === "done"
                          ? "✓"
                          : status === "active"
                            ? "●"
                            : "○"}
                      </span>
                      {step.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && <div className="toast error">{error}</div>}

          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={generateReport}
          >
            {loading ? (
              <>
                <span className="spinner" />
                보고서 생성 중...
              </>
            ) : (
              "AI 보고서 생성"
            )}
          </button>

          <p className="hint">
            GEMINI_API_KEY가 .env.local에 설정되어 있어야 합니다.
          </p>
        </div>
      )}

      {report && (
        <>
          <div className="card card--compact">
            <div className="card-header-row">
              <span className="hint">보고서가 생성되었습니다.</span>
              <button
                type="button"
                className="btn btn-outline btn-inline"
                onClick={generateReport}
                disabled={loading}
              >
                다시 생성
              </button>
            </div>
          </div>
          <ReportViewer report={report} kpis={kpis} />
        </>
      )}
    </div>
  );
}
