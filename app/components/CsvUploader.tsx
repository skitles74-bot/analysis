"use client";

import { useCallback, useRef, useState } from "react";
import type { CsvFileKey } from "@/lib/types";
import { CSV_FILE_SLOTS } from "@/lib/types";

interface CsvUploaderProps {
  onFileSelect: (key: CsvFileKey, file: File) => void;
  fileNames: Partial<Record<CsvFileKey, string>>;
  loadingKey: CsvFileKey | null;
}

export function CsvUploader({
  onFileSelect,
  fileNames,
  loadingKey,
}: CsvUploaderProps) {
  const inputRefs = useRef<Partial<Record<CsvFileKey, HTMLInputElement>>>({});
  const [dragOver, setDragOver] = useState<CsvFileKey | null>(null);

  const handleDrop = useCallback(
    (key: CsvFileKey, e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".csv")) onFileSelect(key, file);
    },
    [onFileSelect]
  );

  return (
    <div className="upload-grid">
      {CSV_FILE_SLOTS.map((slot) => {
        const uploaded = fileNames[slot.key];
        const isLoading = loadingKey === slot.key;
        const isDrag = dragOver === slot.key;

        return (
          <div
            key={slot.key}
            className={`upload-slot${uploaded ? " upload-slot--done" : ""}${isDrag ? " upload-slot--drag" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(slot.key);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(slot.key, e)}
            onClick={() => inputRefs.current[slot.key]?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                inputRefs.current[slot.key]?.click();
              }
            }}
          >
            <input
              ref={(el) => {
                inputRefs.current[slot.key] = el ?? undefined;
              }}
              type="file"
              accept=".csv"
              className="upload-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(slot.key, file);
                e.target.value = "";
              }}
            />
            <div className="upload-slot-label">{slot.label}</div>
            <div className="upload-slot-hint">
              {uploaded ? uploaded : slot.sampleFile}
            </div>
            {isLoading && (
              <div className="upload-slot-status">검증 중...</div>
            )}
            {!isLoading && uploaded && (
              <div className="upload-slot-status upload-slot-status--ok">
                업로드 완료
              </div>
            )}
            {!uploaded && !isLoading && (
              <div className="upload-slot-action">
                CSV 드래그 또는 클릭
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
