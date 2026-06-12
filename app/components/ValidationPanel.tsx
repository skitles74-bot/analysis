import type { CrossValidationResult, FileValidationResult } from "@/lib/types";
import { CSV_FILE_SLOTS } from "@/lib/types";

interface ValidationPanelProps {
  fileResults: Partial<Record<string, FileValidationResult>>;
  crossResult: CrossValidationResult | null;
}

export function ValidationPanel({
  fileResults,
  crossResult,
}: ValidationPanelProps) {
  const hasAny = Object.keys(fileResults).length > 0;

  if (!hasAny) {
    return (
      <div className="validation-panel validation-panel--empty">
        <p>4개 CSV 파일을 업로드하면 즉시 유효성 검사가 실행됩니다.</p>
      </div>
    );
  }

  return (
    <div className="validation-panel">
      <h3 className="validation-title">유효성 검사 결과</h3>

      <div className="validation-files">
        {CSV_FILE_SLOTS.map((slot) => {
          const result = fileResults[slot.key];
          if (!result) {
            return (
              <div key={slot.key} className="validation-file validation-file--pending">
                <span className="validation-icon">○</span>
                <span>{slot.label}</span>
                <span className="validation-meta">대기 중</span>
              </div>
            );
          }

          return (
            <div
              key={slot.key}
              className={`validation-file${
                result.valid
                  ? result.skippedCount > 0
                    ? " validation-file--warn"
                    : " validation-file--ok"
                  : " validation-file--error"
              }`}
            >
              <span className="validation-icon">
                {result.valid ? (result.skippedCount > 0 ? "!" : "✓") : "✗"}
              </span>
              <span>{slot.label}</span>
              <span className="validation-meta">
                {result.fileName} · {result.rowCount.toLocaleString()}행
                {result.skippedCount > 0 &&
                  ` · ${result.skippedCount.toLocaleString()}행 제거`}
              </span>
            </div>
          );
        })}
      </div>

      {CSV_FILE_SLOTS.every((s) => fileResults[s.key]?.valid) && crossResult && (
        <div
          className={`validation-cross${crossResult.valid ? " validation-cross--ok" : " validation-cross--error"}`}
        >
          <strong>
            {crossResult.valid
              ? "교차 검증 통과 — FK 참조 및 금액 일치 확인 완료"
              : "교차 검증 실패"}
          </strong>
        </div>
      )}

      <ul className="validation-errors">
        {CSV_FILE_SLOTS.flatMap((slot) => {
          const result = fileResults[slot.key];
          return (result?.errors ?? []).map((err, i) => (
            <li
              key={`${slot.key}-${i}`}
              className={err.message.startsWith("제거됨") ? "validation-warn-item" : ""}
            >
              <span className="error-tag">{slot.label}</span>
              {err.row && <span>행 {err.row}</span>}
              {err.column && <span>[{err.column}]</span>}
              {err.message}
            </li>
          ));
        })}
        {(crossResult?.errors ?? []).map((err, i) => (
          <li key={`cross-${i}`}>
            <span className="error-tag">교차검증</span>
            {err.row && <span>행 {err.row}</span>}
            {err.column && <span>[{err.column}]</span>}
            {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
