"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronsRight,
  Dumbbell,
  ExternalLink,
  LayoutDashboard,
  Mail,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { gambarino, switzer } from "@/components/landing/fonts";
import type { AdminOverview } from "@/services/admin";

/*
 * Admin dashboard with a collapsible sidebar. Based on the "dashboard with
 * collapsible sidebar" component, restyled like the landing page (lp-* color
 * tokens in globals.css, Gambarino headings, Switzer body) and filled with real
 * numbers from public.admin_overview().
 * Admin-only and Dutch-speaking audience of one, so the texts are not translated.
 */

type Tab = "overview" | "waitlist" | "users" | "ai";
type IconType = ComponentType<{ className?: string }>;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 3 });
const dateTime = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });
const shortDay = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });

export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className={`${gambarino.variable} ${switzer.variable} flex min-h-dvh w-full bg-lp-bg font-body text-lp-chalk`}>
      <Sidebar tab={tab} setTab={setTab} waitlistCount={overview.waitlist_7d} />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        {tab === "overview" && <OverviewTab o={overview} />}
        {tab === "waitlist" && <WaitlistTab o={overview} />}
        {tab === "users" && <UsersTab o={overview} />}
        {tab === "ai" && <AiTab o={overview} />}
      </main>
    </div>
  );
}

/* ---------- Sidebar ---------- */

function Sidebar({
  tab,
  setTab,
  waitlistCount,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  waitlistCount: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    // On phones the sidebar always stays narrow (icons only), so the content keeps its room.
    <nav
      className={`sticky top-0 h-dvh shrink-0 border-r border-lp-line bg-lp-bg-deep p-2 transition-[width] duration-300 ease-out max-md:w-16 ${
        open ? "w-64" : "w-16"
      }`}
    >
      <TitleSection open={open} />

      <div className="mb-8 space-y-1">
        <Option Icon={LayoutDashboard} title="Overzicht" selected={tab === "overview"} onClick={() => setTab("overview")} open={open} />
        <Option Icon={Mail} title="Wachtlijst" selected={tab === "waitlist"} onClick={() => setTab("waitlist")} open={open} notifs={waitlistCount} />
        <Option Icon={Users} title="Gebruikers" selected={tab === "users"} onClick={() => setTab("users")} open={open} />
        <Option Icon={Sparkles} title="AI-kosten" selected={tab === "ai"} onClick={() => setTab("ai")} open={open} />
      </div>

      <div className="space-y-1 border-t border-lp-line pt-4">
        {open && (
          <div className="px-3 py-2 text-xs font-medium tracking-[0.12em] text-lp-coral uppercase max-md:hidden">Site</div>
        )}
        <Link
          href="/"
          className="flex h-11 w-full items-center rounded-[15px] text-lp-pink transition-colors hover:bg-lp-card hover:text-lp-chalk"
        >
          <div className="grid h-full w-12 shrink-0 place-content-center">
            <ExternalLink className="h-4 w-4" />
          </div>
          {open && <span className="text-sm font-medium max-md:hidden">Bekijk site</span>}
        </Link>
      </div>

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
}

function Option({
  Icon,
  title,
  selected,
  onClick,
  open,
  notifs,
}: {
  Icon: IconType;
  title: string;
  selected: boolean;
  onClick: () => void;
  open: boolean;
  notifs?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-current={selected ? "page" : undefined}
      className={`relative flex h-11 w-full items-center rounded-[15px] transition-colors duration-200 ${
        selected ? "bg-lp-coral text-lp-bg" : "text-lp-pink hover:bg-lp-card hover:text-lp-chalk"
      }`}
    >
      <div className="grid h-full w-12 shrink-0 place-content-center">
        <Icon className="h-4 w-4" />
      </div>
      {open && <span className="text-sm font-medium max-md:hidden">{title}</span>}
      {notifs ? (
        open && (
          <span
            className={`absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium max-md:hidden ${
              selected ? "bg-lp-bg text-lp-coral" : "bg-lp-coral text-lp-bg"
            }`}
          >
            {notifs}
          </span>
        )
      ) : null}
    </button>
  );
}

/** The word mark from the landing page nav; collapsed it becomes just the "R". */
function TitleSection({ open }: { open: boolean }) {
  return (
    <div className="mb-6 flex h-16 items-center border-b border-lp-line px-3 pb-2">
      <span className="font-display text-[2rem] leading-none tracking-[-0.05em] text-lp-coral">
        {open ? (
          <>
            <span className="max-md:hidden">Runvex</span>
            <span className="md:hidden">R</span>
          </>
        ) : (
          "R"
        )}
      </span>
      {open && <span className="ml-2 self-end pb-1 text-xs text-lp-pink max-md:hidden">admin</span>}
    </div>
  );
}

function ToggleClose({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="absolute right-0 bottom-0 left-0 border-t border-lp-line text-lp-pink transition-colors hover:bg-lp-card hover:text-lp-chalk max-md:hidden"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight className={`h-4 w-4 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`} />
        </div>
        {open && <span className="text-sm font-medium">Inklappen</span>}
      </div>
    </button>
  );
}

/* ---------- Building blocks ---------- */

/** Coral eyebrow + Gambarino title, like the landing page section headings. */
function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <p className="text-sm font-medium tracking-[0.12em] text-lp-coral uppercase">{eyebrow}</p>
      <h1 className="font-display text-[2.75rem] leading-none tracking-[-0.02em] sm:text-6xl">{title}</h1>
      <p className="text-lg text-lp-pink">{subtitle}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-lp-card p-6 sm:p-8 ${className}`}>
      {title && <h3 className="mb-6 font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em]">{title}</h3>}
      {children}
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
  note,
  accent = false,
}: {
  Icon: IconType;
  label: string;
  value: string | number;
  note?: string;
  /** One highlighted card in coral, like the waitlist band on the landing page. */
  accent?: boolean;
}) {
  return (
    <div className={`rounded-3xl p-6 ${accent ? "bg-lp-coral text-lp-bg" : "bg-lp-card"}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className={`text-sm font-medium tracking-[0.12em] uppercase ${accent ? "text-lp-bg/80" : "text-lp-pink"}`}>{label}</h3>
        <Icon className={`h-5 w-5 ${accent ? "text-lp-bg" : "text-lp-coral"}`} />
      </div>
      <p className="font-display text-5xl leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      {note && <p className={`mt-3 text-sm ${accent ? "text-lp-bg/80" : "text-lp-chalk/70"}`}>{note}</p>}
    </div>
  );
}

function Meter({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-lp-pink">{label}</span>
        <span className="text-sm font-medium tabular-nums">{display}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-lp-line/60">
        <div className="h-1.5 rounded-full bg-lp-coral" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Bars per day for the last 14 days: waitlist in coral, new accounts in pink. */
function DailyChart({ daily }: { daily: AdminOverview["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => Math.max(d.waitlist, d.signups)));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 border-b border-lp-line">
        {daily.map((d) => (
          <div
            key={d.day}
            className="flex h-full flex-1 items-end justify-center gap-0.5"
            title={`${shortDay.format(new Date(d.day))}: ${d.waitlist} wachtlijst, ${d.signups} accounts`}
          >
            <div className="w-full max-w-3 rounded-t bg-lp-coral" style={{ height: `${(d.waitlist / max) * 100}%` }} />
            <div className="w-full max-w-3 rounded-t bg-lp-pink" style={{ height: `${(d.signups / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-lp-pink">
        <span>{daily[0] && shortDay.format(new Date(daily[0].day))}</span>
        <span>vandaag</span>
      </div>
      <div className="mt-5 flex gap-5 text-sm text-lp-chalk/70">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-lp-coral" />Wachtlijst</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-lp-pink" />Accounts</span>
      </div>
    </div>
  );
}

/** Editorial list with hairlines between the rows, like the features list on the landing page. */
function WaitlistTable({ rows }: { rows: AdminOverview["waitlist_recent"] }) {
  if (rows.length === 0) return <p className="text-lp-pink">Nog niemand op de wachtlijst.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="text-xs tracking-[0.12em] text-lp-coral uppercase">
          <tr>
            <th className="pb-4 font-medium">E-mail</th>
            <th className="pb-4 font-medium">Taal</th>
            <th className="pb-4 text-right font-medium">Aangemeld</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email} className="border-t border-lp-line">
              <td className="max-w-0 truncate py-4 pr-4">{r.email}</td>
              <td className="py-4 pr-4 text-lp-pink uppercase">{r.locale}</td>
              <td className="py-4 text-right whitespace-nowrap text-lp-chalk/70">{dateTime.format(new Date(r.created_at))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Tabs ---------- */

function OverviewTab({ o }: { o: AdminOverview }) {
  return (
    <>
      <Header eyebrow="Admin" title="Overzicht" subtitle="Hoe staat Runvex ervoor?" />
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard accent Icon={Mail} label="Wachtlijst" value={o.waitlist_total} note={`+${o.waitlist_7d} afgelopen 7 dagen`} />
        <StatCard Icon={Users} label="Accounts" value={o.users_total} note={`+${o.signups_7d} afgelopen 7 dagen`} />
        <StatCard Icon={Activity} label="Actief (7 dagen)" value={o.active_users_7d} />
        <StatCard Icon={Sparkles} label="AI deze maand" value={usd.format(o.ai_cost_month)} note={`${usd.format(o.ai_cost_today)} vandaag`} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Laatste 14 dagen" className="lg:col-span-2">
          <DailyChart daily={o.daily} />
        </Panel>
        <Panel title="Snel overzicht">
          <div className="space-y-5">
            <Meter label="Intake afgerond" value={o.users_onboarded} max={o.users_total} display={`${o.users_onboarded} / ${o.users_total}`} />
            <Meter label="Actief deze week" value={o.active_users_7d} max={o.users_total} display={`${o.active_users_7d} / ${o.users_total}`} />
            <Meter label="Wachtlijst Nederlands" value={o.waitlist_nl} max={o.waitlist_total} display={`${o.waitlist_nl} / ${o.waitlist_total}`} />
          </div>
        </Panel>
      </div>
    </>
  );
}

function WaitlistTab({ o }: { o: AdminOverview }) {
  return (
    <>
      <Header eyebrow="Admin" title="Wachtlijst" subtitle={`${o.waitlist_total} aanmeldingen, de laatste 100 hieronder.`} />
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard accent Icon={Mail} label="Totaal" value={o.waitlist_total} />
        <StatCard Icon={TrendingUp} label="Afgelopen 7 dagen" value={o.waitlist_7d} />
        <StatCard Icon={Users} label="NL / EN" value={`${o.waitlist_nl} / ${o.waitlist_total - o.waitlist_nl}`} />
      </div>
      <Panel title="Laatste aanmeldingen">
        <WaitlistTable rows={o.waitlist_recent} />
      </Panel>
    </>
  );
}

function UsersTab({ o }: { o: AdminOverview }) {
  return (
    <>
      <Header eyebrow="Admin" title="Gebruikers" subtitle="Accounts en wat ze de afgelopen 7 dagen deden." />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard accent Icon={Users} label="Accounts" value={o.users_total} note={`${o.users_onboarded} met afgeronde intake`} />
        <StatCard Icon={TrendingUp} label="Nieuw (7 dagen)" value={o.signups_7d} />
        <StatCard Icon={Activity} label="Actief (7 dagen)" value={o.active_users_7d} />
        <StatCard Icon={Dumbbell} label="Trainingen gedaan" value={o.trainings_done_7d} />
        <StatCard Icon={ExternalLink} label=".FIT-uploads" value={o.fit_uploads_7d} />
        <StatCard Icon={Sparkles} label="Berichten aan coach" value={o.coach_messages_7d} />
      </div>
    </>
  );
}

function AiTab({ o }: { o: AdminOverview }) {
  const maxCost = Math.max(0, ...o.ai_by_purpose.map((p) => p.cost));
  return (
    <>
      <Header eyebrow="Admin" title="AI-kosten" subtitle="Claude-gebruik deze maand (budget $0,65 per gebruiker per week)." />
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard accent Icon={Sparkles} label="Deze maand" value={usd.format(o.ai_cost_month)} />
        <StatCard Icon={TrendingUp} label="Vandaag" value={usd.format(o.ai_cost_today)} />
        <StatCard Icon={Activity} label="Calls deze maand" value={o.ai_calls_month} />
        <StatCard Icon={Users} label="Boven 80% budget" value={o.ai_users_over_80pct} />
      </div>
      <Panel title="Per onderdeel">
        {o.ai_by_purpose.length === 0 ? (
          <p className="text-lp-pink">Deze maand nog geen AI-calls.</p>
        ) : (
          <div className="space-y-5">
            {o.ai_by_purpose.map((p) => (
              <Meter key={p.purpose} label={`${p.purpose} · ${p.calls} calls`} value={p.cost} max={maxCost} display={usd.format(p.cost)} />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
