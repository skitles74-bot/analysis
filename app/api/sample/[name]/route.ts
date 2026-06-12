import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED = new Set([
  "products.csv",
  "customers.csv",
  "sales_orders.csv",
  "sales_order_items.csv",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!ALLOWED.has(name)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "sample-data", name);
    const content = await readFile(filePath, "utf-8");
    return new Response(content, {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
