import { revalidatePath } from "next/cache";

/**
 * Call after every change (plan, swap, move, settings…). The tabs are prefetched
 * and kept in the browser (see BottomNav and next.config.ts), so this purges that
 * cache: the current page re-renders right away, the other tabs on the next visit.
 */
export function refreshAppData() {
  revalidatePath("/", "layout");
}
