import Papa from "papaparse";
import type { CsvFileKey, FileValidationResult, ValidationError } from "@/lib/types";
import {
  customerRowSchema,
  productRowSchema,
  REQUIRED_HEADERS,
  salesOrderItemRowSchema,
  salesOrderRowSchema,
} from "@/lib/csv/schemas";

const SCHEMA_MAP = {
  products: productRowSchema,
  customers: customerRowSchema,
  orders: salesOrderRowSchema,
  orderDetails: salesOrderItemRowSchema,
} as const;

const PK_MAP: Record<CsvFileKey, string> = {
  products: "product_id",
  customers: "customer_id",
  orders: "order_no",
  orderDetails: "order_item_id",
};

function checkHeaders(
  key: CsvFileKey,
  headers: string[]
): { fatal: ValidationError[]; warnings: ValidationError[] } {
  const required = REQUIRED_HEADERS[key];
  const missing = required.filter((h) => !headers.includes(h));
  const extra = headers.filter((h) => h && !required.includes(h));

  const fatal: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (missing.length > 0) {
    fatal.push({
      file: key,
      message: `필수 컬럼 누락: ${missing.join(", ")}`,
    });
  }
  if (extra.length > 0) {
    warnings.push({
      file: key,
      message: `알 수 없는 컬럼 (무시): ${extra.join(", ")}`,
    });
  }
  return { fatal, warnings };
}

export async function parseAndValidateCsv(
  key: CsvFileKey,
  file: File
): Promise<FileValidationResult> {
  const text = await file.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const skipped: ValidationError[] = [];

  parsed.errors.forEach((e) => {
    skipped.push({
      file: key,
      row: e.row !== undefined ? e.row + 1 : undefined,
      message: `제거됨: ${e.message}`,
    });
  });

  const headers = parsed.meta.fields ?? [];
  const { fatal: headerFatal, warnings: headerWarnings } = checkHeaders(
    key,
    headers
  );

  if (headerFatal.length > 0) {
    return {
      key,
      fileName: file.name,
      valid: false,
      rowCount: 0,
      skippedCount: parsed.data.length,
      errors: headerFatal,
    };
  }

  const schema = SCHEMA_MAP[key];
  const pk = PK_MAP[key];
  const validRows: unknown[] = [];
  const seenPk = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2;
    const result = schema.safeParse(row);

    if (!result.success) {
      const issue = result.error.issues[0];
      skipped.push({
        file: key,
        row: rowNum,
        column: issue.path.join("."),
        message: `제거됨: ${issue.message}`,
      });
      return;
    }

    const pkValue = String(
      (result.data as Record<string, unknown>)[pk] ?? ""
    );
    if (seenPk.has(pkValue)) {
      skipped.push({
        file: key,
        row: rowNum,
        column: pk,
        message: `제거됨: 중복 PK (${pk}=${pkValue})`,
      });
      return;
    }

    seenPk.add(pkValue);
    validRows.push(result.data);
  });

  const maxSkipped = 50;
  const errors = [...headerWarnings, ...skipped.slice(0, maxSkipped)];
  if (skipped.length > maxSkipped) {
    errors.push({
      file: key,
      message: `외 ${skipped.length - maxSkipped}행이 더 제거되었습니다`,
    });
  }

  const valid = validRows.length > 0;

  return {
    key,
    fileName: file.name,
    valid,
    rowCount: validRows.length,
    skippedCount: parsed.data.length - validRows.length + parsed.errors.length,
    errors,
    data: valid ? (validRows as never) : undefined,
  };
}
