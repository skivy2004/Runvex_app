// Development-only page to preview the design tokens and UI components.
// Texts here are hardcoded on purpose; real pages will use translations.
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const swatches = [
  { name: "background", className: "bg-background border border-line" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-raised", className: "bg-surface-raised" },
  { name: "accent", className: "bg-accent" },
  { name: "muted", className: "bg-muted" },
  { name: "danger", className: "bg-danger" },
];

export default function StyleguidePage() {
  return (
    <main className="flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-bold">Styleguide</h1>

      <section className="grid grid-cols-3 gap-3">
        {swatches.map((swatch) => (
          <div key={swatch.name} className="flex flex-col gap-1.5">
            <div className={`h-12 rounded-2xl ${swatch.className}`} />
            <span className="text-xs text-muted">{swatch.name}</span>
          </div>
        ))}
      </section>

      <Card className="flex flex-col gap-3">
        <span className="text-muted">Training this week</span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-accent">4,5</span>
          <span className="text-sm text-muted">/ 7 h</span>
        </div>
        <ProgressBar value={4.5} max={7} label="Training hours this week" />
      </Card>

      <Card className="flex flex-col gap-2">
        <span className="font-semibold">Tuesday</span>
        <div className="rounded-2xl bg-surface-raised p-4">
          <p className="text-sm font-semibold">Easy run</p>
          <p className="text-xs text-muted">45 min</p>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1">
          Previous
        </Button>
        <Button className="flex-1">Next</Button>
      </div>
      <Button fullWidth>Get started</Button>
      <Button fullWidth disabled>
        Disabled
      </Button>
      {/* Spacer so the fixed tab bar doesn't cover the last button. */}
      <div className="h-24" />
      <BottomNav />
    </main>
  );
}
