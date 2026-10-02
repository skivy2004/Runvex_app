import { Logo } from "@/components/Logo";

// The loading screen while a page gets its data, e.g. when you open the app.
// Switching tabs normally skips it: the tabs are already loaded in the background
// (prefetch in BottomNav), so they appear at once.
export default function Loading() {
  return (
    <div aria-busy className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
      <Logo className="animate-pulse text-3xl motion-reduce:animate-none" />
      <span className="sr-only">…</span>
    </div>
  );
}
