export type CsvFileKey = "products" | "customers" | "orders" | "orderDetails";

export interface Product {
  product_id: number;
  product_name: string;
  category: string;
  brand: string;
  unit_cost_krw: number;
  unit_price_krw: number;
  stock_qty: number;
  status: string;
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  customer_type: string;
  city: string;
  phone: string;
  email: string;
  join_date: string;
  tier: string;
}

export interface SalesOrder {
  order_no: number;
  customer_id: number;
  order_date: string;
  status: string;
  channel: string;
  payment_method: string;
  total_amount_krw: number;
}

export interface SalesOrderItem {
  order_item_id: number;
  order_no: number;
  product_id: number;
  qty: number;
  unit_price_krw: number;
  discount_pct: number;
  amount_krw: number;
}

export interface ErpDataset {
  products: Product[];
  customers: Customer[];
  orders: SalesOrder[];
  orderDetails: SalesOrderItem[];
}

export interface ValidationError {
  file: CsvFileKey | "cross";
  row?: number;
  column?: string;
  message: string;
}

export interface FileValidationResult {
  key: CsvFileKey;
  fileName: string;
  valid: boolean;
  rowCount: number;
  skippedCount: number;
  errors: ValidationError[];
  data?: Product[] | Customer[] | SalesOrder[] | SalesOrderItem[];
}

export interface CrossValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface KpiSummary {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  activeCustomerCount: number;
  totalCustomers: number;
  totalProducts: number;
  monthlyRevenue: ChartPoint[];
  categoryRevenue: ChartPoint[];
  topProducts: ChartPoint[];
  cityRevenue: ChartPoint[];
  tierDistribution: ChartPoint[];
  orderStatusBreakdown: ChartPoint[];
  channelBreakdown: ChartPoint[];
  periodStart: string;
  periodEnd: string;
}

export interface ErpReportFinding {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface ErpReportRecommendation {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

export interface ErpReport {
  executiveSummary: string;
  keyMetrics: string;
  findings: ErpReportFinding[];
  recommendations: ErpReportRecommendation[];
  riskAlerts: string[];
  generatedAt: string;
}

export const CSV_FILE_SLOTS: Array<{
  key: CsvFileKey;
  label: string;
  hint: string;
  sampleFile: string;
}> = [
  {
    key: "products",
    label: "상품",
    hint: "product_id, product_name, category, brand, unit_cost_krw, unit_price_krw, stock_qty, status",
    sampleFile: "products.csv",
  },
  {
    key: "customers",
    label: "고객",
    hint: "customer_id, customer_name, customer_type, city, phone, email, join_date, tier",
    sampleFile: "customers.csv",
  },
  {
    key: "orders",
    label: "주문",
    hint: "order_no, customer_id, order_date, status, channel, payment_method, total_amount_krw",
    sampleFile: "sales_orders.csv",
  },
  {
    key: "orderDetails",
    label: "주문상세",
    hint: "order_item_id, order_no, product_id, qty, unit_price_krw, discount_pct, amount_krw",
    sampleFile: "sales_order_items.csv",
  },
];

export const STORAGE_KEY = "erp-analysis-dataset";
