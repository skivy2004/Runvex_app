// Shown immediately when you tap a tab, while the page loads its data.
// Next.js prefetches this placeholder, so the switch feels instant.
export default function Loading() {
  return (
    <div aria-busy className="flex animate-pulse flex-col gap-4 motion-reduce:animate-none">
      <span className="sr-only">…</span>
      <div className="h-8 w-40 rounded-full bg-surface" />
      <div className="h-28 rounded-3xl bg-surface" />
      <div className="h-40 rounded-3xl bg-surface" />
      <div className="h-32 rounded-3xl bg-surface" />
    </div>
  );
}
