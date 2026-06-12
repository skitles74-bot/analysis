import type {
  CrossValidationResult,
  Customer,
  ErpDataset,
  Product,
  SalesOrder,
  SalesOrderItem,
  ValidationError,
} from "@/lib/types";

const AMOUNT_TOLERANCE = 1;

function validateForeignKeys(
  orders: SalesOrder[],
  orderDetails: SalesOrderItem[],
  customers: Customer[],
  products: Product[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const customerIds = new Set(customers.map((c) => c.customer_id));
  const productIds = new Set(products.map((p) => p.product_id));
  const orderNos = new Set(orders.map((o) => o.order_no));

  orders.forEach((order, index) => {
    if (!customerIds.has(order.customer_id)) {
      errors.push({
        file: "cross",
        row: index + 2,
        column: "customer_id",
        message: `주문 ${order.order_no}: 존재하지 않는 고객 ID ${order.customer_id}`,
      });
    }
  });

  orderDetails.forEach((item, index) => {
    if (!orderNos.has(item.order_no)) {
      errors.push({
        file: "cross",
        row: index + 2,
        column: "order_no",
        message: `주문상세 ${item.order_item_id}: 존재하지 않는 주문번호 ${item.order_no}`,
      });
    }
    if (!productIds.has(item.product_id)) {
      errors.push({
        file: "cross",
        row: index + 2,
        column: "product_id",
        message: `주문상세 ${item.order_item_id}: 존재하지 않는 상품 ID ${item.product_id}`,
      });
    }

    const expected =
      item.qty * item.unit_price_krw * (1 - item.discount_pct / 100);
    if (Math.abs(expected - item.amount_krw) > AMOUNT_TOLERANCE) {
      errors.push({
        file: "cross",
        row: index + 2,
        column: "amount_krw",
        message: `주문상세 ${item.order_item_id}: 금액 불일치 (기대값 ${Math.round(expected)}, 실제 ${item.amount_krw})`,
      });
    }
  });

  return errors.slice(0, 50);
}

export function crossValidateDataset(dataset: ErpDataset): CrossValidationResult {
  const errors = validateForeignKeys(
    dataset.orders,
    dataset.orderDetails,
    dataset.customers,
    dataset.products
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildDataset(
  products: Product[],
  customers: Customer[],
  orders: SalesOrder[],
  orderDetails: SalesOrderItem[]
): ErpDataset {
  return { products, customers, orders, orderDetails };
}
