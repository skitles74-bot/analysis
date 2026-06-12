import { generateErpReport } from "@/lib/gemini";
import type { KpiSummary } from "@/lib/types";
import { z } from "zod";

const kpiSummarySchema = z.object({
  totalRevenue: z.number(),
  orderCount: z.number(),
  avgOrderValue: z.number(),
  activeCustomerCount: z.number(),
  totalCustomers: z.number(),
  totalProducts: z.number(),
  monthlyRevenue: z.array(z.object({ name: z.string(), value: z.number() })),
  categoryRevenue: z.array(z.object({ name: z.string(), value: z.number() })),
  topProducts: z.array(z.object({ name: z.string(), value: z.number() })),
  cityRevenue: z.array(z.object({ name: z.string(), value: z.number() })),
  tierDistribution: z.array(z.object({ name: z.string(), value: z.number() })),
  orderStatusBreakdown: z.array(
    z.object({ name: z.string(), value: z.number() })
  ),
  channelBreakdown: z.array(z.object({ name: z.string(), value: z.number() })),
  periodStart: z.string(),
  periodEnd: z.string(),
});

type ProgressStep = "validating" | "analyzing" | "generating";

const STEP_MESSAGES: Record<ProgressStep, string> = {
  validating: "KPI 데이터를 확인하고 있습니다...",
  analyzing: "ERP 데이터를 분석하고 있습니다...",
  generating: "AI가 경영 분석 보고서를 작성하고 있습니다...",
};

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const emitProgress = (step: ProgressStep) => {
        emit("progress", { step, message: STEP_MESSAGES[step] });
      };

      try {
        emitProgress("validating");

        const body = await request.json();
        const parsed = kpiSummarySchema.safeParse(body.kpis);

        if (!parsed.success) {
          emit("error", {
            message:
              parsed.error.errors[0]?.message ?? "KPI 데이터가 올바르지 않습니다.",
          });
          return;
        }

        const kpis = parsed.data as KpiSummary;

        emitProgress("analyzing");
        emitProgress("generating");

        const report = await generateErpReport(kpis);
        emit("report", { report });
        emit("done", { message: "보고서 생성이 완료되었습니다." });
      } catch (err) {
        emit("error", {
          message:
            err instanceof Error
              ? err.message
              : "보고서 생성 중 오류가 발생했습니다.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
