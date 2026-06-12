import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().min(0);
const nonNegativeNumber = z.coerce.number().min(0);
const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), "유효한 날짜 형식이 아닙니다");

export const productRowSchema = z.object({
  product_id: positiveInt,
  product_name: z.string().min(1),
  category: z.string().min(1),
  brand: z.string().min(1),
  unit_cost_krw: nonNegativeNumber,
  unit_price_krw: nonNegativeNumber,
  stock_qty: nonNegativeInt,
  status: z.string().min(1),
});

export const customerRowSchema = z.object({
  customer_id: positiveInt,
  customer_name: z.string().min(1),
  customer_type: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email("유효한 이메일 형식이 아닙니다"),
  join_date: dateString,
  tier: z.string().min(1),
});

export const salesOrderRowSchema = z.object({
  order_no: positiveInt,
  customer_id: positiveInt,
  order_date: dateString,
  status: z.string().min(1),
  channel: z.string().min(1),
  payment_method: z.string().min(1),
  total_amount_krw: nonNegativeNumber,
});

export const salesOrderItemRowSchema = z.object({
  order_item_id: positiveInt,
  order_no: positiveInt,
  product_id: positiveInt,
  qty: positiveInt,
  unit_price_krw: nonNegativeNumber,
  discount_pct: z.coerce.number().min(0).max(100),
  amount_krw: nonNegativeNumber,
});

export const REQUIRED_HEADERS: Record<string, string[]> = {
  products: Object.keys(productRowSchema.shape),
  customers: Object.keys(customerRowSchema.shape),
  orders: Object.keys(salesOrderRowSchema.shape),
  orderDetails: Object.keys(salesOrderItemRowSchema.shape),
};

export type ProductRow = z.infer<typeof productRowSchema>;
export type CustomerRow = z.infer<typeof customerRowSchema>;
export type SalesOrderRow = z.infer<typeof salesOrderRowSchema>;
export type SalesOrderItemRow = z.infer<typeof salesOrderItemRowSchema>;
