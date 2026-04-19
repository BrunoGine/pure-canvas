import { Transaction } from "@/hooks/useTransactions";

/**
 * Compute credit card invoice cycle boundaries based on closing day.
 *
 * Returns:
 *  - currentCycleStart / currentCycleEnd: the most recently CLOSED invoice cycle
 *    (closed at the most recent closing_day on or before today)
 *  - nextCycleStart / nextCycleEnd: the OPEN cycle that will close at the next closing_day
 */
export function getInvoiceCycles(closingDay: number, today: Date = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  const day = today.getDate();

  // Last closing date (already passed)
  const lastClosing =
    day >= closingDay
      ? new Date(year, month, closingDay)
      : new Date(year, month - 1, closingDay);

  // Previous closing (one cycle before lastClosing)
  const prevClosing = new Date(
    lastClosing.getFullYear(),
    lastClosing.getMonth() - 1,
    closingDay
  );

  // Next closing (one cycle after lastClosing)
  const nextClosing = new Date(
    lastClosing.getFullYear(),
    lastClosing.getMonth() + 1,
    closingDay
  );

  return {
    // Current invoice = most recently closed cycle (prevClosing+1 .. lastClosing)
    currentCycleStart: addDays(prevClosing, 1),
    currentCycleEnd: lastClosing,
    // Next invoice = open cycle (lastClosing+1 .. nextClosing)
    nextCycleStart: addDays(lastClosing, 1),
    nextCycleEnd: nextClosing,
  };
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function inRange(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr + "T00:00:00");
  return d >= stripTime(start) && d <= stripTime(end);
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function computeCardInvoices(
  transactions: Transaction[],
  cardId: string,
  closingDay: number,
  today: Date = new Date()
) {
  const cycles = getInvoiceCycles(closingDay, today);

  const creditTxs = transactions.filter(
    (t) =>
      t.card_id === cardId &&
      t.type === "expense" &&
      t.payment_method === "credito"
  );

  const current = creditTxs
    .filter((t) => inRange(t.date, cycles.currentCycleStart, cycles.currentCycleEnd))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  const next = creditTxs
    .filter((t) => inRange(t.date, cycles.nextCycleStart, cycles.nextCycleEnd))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  return {
    current: Math.round(current * 100) / 100,
    next: Math.round(next * 100) / 100,
    cycles,
  };
}

export function formatBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function formatDateShort(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
