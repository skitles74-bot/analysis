import type {
  ChartPoint,
  Customer,
  ErpDataset,
  KpiSummary,
  Product,
  SalesOrder,
  SalesOrderItem,
} from "@/lib/types";

export interface EnrichedOrderItem extends SalesOrderItem {
  product_name: string;
  category: string;
  brand: string;
  customer_id: number;
  customer_name: string;
  city: string;
  tier: string;
  order_date: string;
  order_status: string;
  channel: string;
}

export function joinDataset(dataset: ErpDataset): EnrichedOrderItem[] {
  const productMap = new Map<number, Product>(
    dataset.products.map((p) => [p.product_id, p])
  );
  const customerMap = new Map<number, Customer>(
    dataset.customers.map((c) => [c.customer_id, c])
  );
  const orderMap = new Map<number, SalesOrder>(
    dataset.orders.map((o) => [o.order_no, o])
  );

  return dataset.orderDetails
    .map((item) => {
      const product = productMap.get(item.product_id);
      const order = orderMap.get(item.order_no);
      const customer = order ? customerMap.get(order.customer_id) : undefined;

      if (!product || !order || !customer) return null;

      return {
        ...item,
        product_name: product.product_name,
        category: product.category,
        brand: product.brand,
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        city: customer.city,
        tier: customer.tier,
        order_date: order.order_date,
        order_status: order.status,
        channel: order.channel,
      };
    })
    .filter((row): row is EnrichedOrderItem => row !== null);
}

function aggregateByKey(
  items: EnrichedOrderItem[],
  keyFn: (item: EnrichedOrderItem) => string,
  valueFn: (item: EnrichedOrderItem) => number = (i) => i.amount_krw
): ChartPoint[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + valueFn(item));
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function computeKpis(dataset: ErpDataset): KpiSummary {
  const enriched = joinDataset(dataset);
  const totalRevenue = enriched.reduce((sum, i) => sum + i.amount_krw, 0);
  const orderCount = dataset.orders.length;
  const activeCustomerIds = new Set(dataset.orders.map((o) => o.customer_id));

  const dates = dataset.orders
    .map((o) => o.order_date)
    .sort((a, b) => a.localeCompare(b));

  const monthlyMap = new Map<string, number>();
  enriched.forEach((item) => {
    const month = formatMonth(item.order_date);
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + item.amount_krw);
  });

  const monthlyRevenue = Array.from(monthlyMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalRevenue: Math.round(totalRevenue),
    orderCount,
    avgOrderValue: orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0,
    activeCustomerCount: activeCustomerIds.size,
    totalCustomers: dataset.customers.length,
    totalProducts: dataset.products.length,
    monthlyRevenue,
    categoryRevenue: aggregateByKey(enriched, (i) => i.category).slice(0, 10),
    topProducts: aggregateByKey(enriched, (i) => i.product_name).slice(0, 10),
    cityRevenue: aggregateByKey(enriched, (i) => i.city).slice(0, 10),
    tierDistribution: aggregateByKey(
      enriched,
      (i) => i.tier,
      () => 1
    ).map((p) => ({
      ...p,
      value: p.value,
    })),
    orderStatusBreakdown: (() => {
      const map = new Map<string, number>();
      dataset.orders.forEach((o) => {
        map.set(o.status, (map.get(o.status) ?? 0) + 1);
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    })(),
    channelBreakdown: aggregateByKey(enriched, (i) => i.channel),
    periodStart: dates[0] ?? "",
    periodEnd: dates[dates.length - 1] ?? "",
  };
}
