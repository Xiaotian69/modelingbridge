/**
 * 回程票 (design doc §6.2): when a learner leaves an exercise to read the related section,
 * the reader shows a bar that brings them back. One ticket at a time; per browser tab
 * (sessionStorage), so it survives a refresh of the lesson but not closing the tab.
 */
export const RETURN_KEY = "mb.v2.return";

export type ReturnTicket = {
  from: { kind: "exercise"; id: string; path: string; label: string };
  to: { sectionId: string };
  createdAt: string;
};

let memory: ReturnTicket | null = null;

function session(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function setReturnTicket(ticket: Omit<ReturnTicket, "createdAt">) {
  memory = { ...ticket, createdAt: new Date().toISOString() };
  try {
    session()?.setItem(RETURN_KEY, JSON.stringify(memory));
  } catch {
    /* in-memory ticket still works for this page view */
  }
}

export function readReturnTicket(): ReturnTicket | null {
  try {
    const raw = session()?.getItem(RETURN_KEY);
    if (raw) {
      const t = JSON.parse(raw) as ReturnTicket;
      if (t?.from?.path?.startsWith("/") && typeof t.from.label === "string" && typeof t.to?.sectionId === "string")
        return t;
    }
  } catch {
    /* fall back to memory */
  }
  return memory;
}

export function clearReturnTicket() {
  memory = null;
  try {
    session()?.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
}
