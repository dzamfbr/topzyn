import "server-only";

export type PendingMlbbOrder = {
  order_number: string;
  account_id: number | null;
  game_user_id: string;
  game_server: string;
  game_nickname: string | null;
  item_id: number;
  item_code: string;
  item_name: string;
  payment_method_id: number;
  payment_method_code: string;
  payment_method_name: string;
  promo_code: string | null;
  promo_discount: number;
  subtotal_amount: number;
  total_amount: number;
  contact_whatsapp: string;
  status: "pending_payment" | "payment_submitted";
  qris_image_data_url: string | null;
  minimarket_payment_code: string | null;
  payment_confirmed_by_user: boolean;
  payment_confirmed_at: string | null;
  created_at: string;
  expires_at: string;
};

type PendingStoreHolder = typeof globalThis & {
  __topzynPendingMlbbOrders?: Map<string, PendingMlbbOrder>;
};

function getStore(): Map<string, PendingMlbbOrder> {
  const holder = globalThis as PendingStoreHolder;
  if (!holder.__topzynPendingMlbbOrders) {
    holder.__topzynPendingMlbbOrders = new Map<string, PendingMlbbOrder>();
  }
  return holder.__topzynPendingMlbbOrders;
}

export function isWdpItemName(value: string): boolean {
  return /weekly\s*diamond\s*pass|wdp/i.test(value);
}

function randomSuffix(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }
  return output;
}

export function generateMlbbOrderNumber(itemName: string, itemCode: string): string {
  void itemName;
  void itemCode;
  const yearPart = new Date().getFullYear();
  const suffix = randomSuffix(10);
  return `TZ${yearPart}-${suffix}`;
}

export function hasPendingMlbbOrder(orderNumber: string): boolean {
  return getStore().has(orderNumber);
}

export function savePendingMlbbOrder(order: PendingMlbbOrder): void {
  getStore().set(order.order_number, order);
}

export function getPendingMlbbOrder(orderNumber: string): PendingMlbbOrder | null {
  return getStore().get(orderNumber) ?? null;
}

export function updatePendingMlbbOrder(
  orderNumber: string,
  updater: (current: PendingMlbbOrder) => PendingMlbbOrder,
): PendingMlbbOrder | null {
  const store = getStore();
  const current = store.get(orderNumber);
  if (!current) {
    return null;
  }
  const next = updater(current);
  store.set(orderNumber, next);
  return next;
}

export function listPendingMlbbOrders(): PendingMlbbOrder[] {
  return Array.from(getStore().values()).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function removePendingMlbbOrder(orderNumber: string): PendingMlbbOrder | null {
  const store = getStore();
  const current = store.get(orderNumber) ?? null;
  if (!current) {
    return null;
  }
  store.delete(orderNumber);
  return current;
}

export function isPendingOrderExpired(
  order: Pick<PendingMlbbOrder, "expires_at">,
  now = Date.now(),
): boolean {
  return new Date(order.expires_at).getTime() <= now;
}
