import type { ErpReport, KpiSummary } from "@/lib/types";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
] as const;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    executiveSummary: { type: "STRING" },
    keyMetrics: { type: "STRING" },
    findings: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
          severity: { type: "STRING" },
        },
        required: ["title", "detail", "severity"],
      },
    },
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          detail: { type: "STRING" },
          priority: { type: "STRING" },
        },
        required: ["title", "detail", "priority"],
      },
    },
    riskAlerts: { type: "ARRAY", items: { type: "STRING" } },
    generatedAt: { type: "STRING" },
  },
  required: [
    "executiveSummary",
    "keyMetrics",
    "findings",
    "recommendations",
    "riskAlerts",
    "generatedAt",
  ],
};

const ANALYSIS_PROMPT = (kpis: KpiSummary) => `
당신은 ERP 데이터 분석 전문가입니다. 아래 KPI 요약을 바탕으로 경영진용 분석 보고서를 작성하세요.

KPI 데이터:
${JSON.stringify(kpis, null, 2)}

다음을 한국어로 작성하세요:
1. executiveSummary: 경영 요약 3~5문장
2. keyMetrics: 핵심 수치 해석 (매출, 주문, 고객, 기간 등)
3. findings: 주요 발견사항 4~6개 (title, detail, severity: high/medium/low)
4. recommendations: 개선 제안 3~5개 (title, detail, priority: high/medium/low)
5. riskAlerts: 리스크 경고 2~4개 (짧은 문장)
6. generatedAt: "${new Date().toISOString()}"
`;

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

function normalizeSeverity(value: string): "high" | "medium" | "low" {
  const v = value?.toLowerCase?.() ?? "medium";
  if (v === "high" || v === "medium" || v === "low") return v;
  return "medium";
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // continue
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function normalizeReport(raw: ErpReport): ErpReport {
  if (!raw.executiveSummary || !Array.isArray(raw.findings)) {
    throw new Error("Invalid report structure");
  }
  return {
    executiveSummary: String(raw.executiveSummary).trim(),
    keyMetrics: String(raw.keyMetrics).trim(),
    findings: raw.findings.map((f) => ({
      title: String(f.title).trim(),
      detail: String(f.detail).trim(),
      severity: normalizeSeverity(String(f.severity)),
    })),
    recommendations: (raw.recommendations ?? []).map((r) => ({
      title: String(r.title).trim(),
      detail: String(r.detail).trim(),
      priority: normalizeSeverity(String(r.priority)),
    })),
    riskAlerts: (raw.riskAlerts ?? []).map((r) => String(r).trim()),
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
  };
}

async function requestGemini(
  apiKey: string,
  model: string,
  payload: object
): Promise<string> {
  const response = await fetch(
    `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Gemini API error (${model}): ${response.status} ${responseText.slice(0, 300)}`
    );
  }

  const data = JSON.parse(responseText) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini API empty response (${model})`);
  return text;
}

function toUserFacingError(errors: string[]): string {
  const joined = errors.join(" | ");
  if (/API key not valid|API_KEY_INVALID|401/i.test(joined)) {
    return "Gemini API 키가 올바르지 않습니다. .env.local에 GEMINI_API_KEY를 설정해 주세요.";
  }
  if (/quota|RESOURCE_EXHAUSTED|429/i.test(joined)) {
    return "Gemini API 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "보고서 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

async function generateStructured(
  apiKey: string,
  model: string,
  kpis: KpiSummary,
  useSchema: boolean
): Promise<ErpReport> {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.4,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  };
  if (useSchema) generationConfig.responseSchema = RESPONSE_SCHEMA;

  const text = await requestGemini(apiKey, model, {
    contents: [{ role: "user", parts: [{ text: ANALYSIS_PROMPT(kpis) }] }],
    generationConfig,
  });

  const parsed = JSON.parse(extractJson(text)) as ErpReport;
  return normalizeReport(parsed);
}

export async function generateErpReport(kpis: KpiSummary): Promise<ErpReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const errors: string[] = [];

  for (const model of GEMINI_MODELS) {
    try {
      return await generateStructured(apiKey, model, kpis, true);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  for (const model of GEMINI_MODELS) {
    try {
      return await generateStructured(apiKey, model, kpis, false);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(toUserFacingError(errors));
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
