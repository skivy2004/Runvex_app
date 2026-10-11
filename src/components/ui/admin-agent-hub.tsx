"use client";

import { useState, useTransition, type ReactNode } from "react";
import { AlertTriangle, Check, Copy, KeyRound, Mail, X } from "lucide-react";
import {
  createAgentKeyAction,
  markAllReadAction,
  replyToAgentAction,
  revokeAgentKeyAction,
  setAiBudgetAction,
  setMessageStatusAction,
} from "@/app/admin/actions";
import { supabaseUrl } from "@/lib/supabase/env";
import type { AgentHub, AgentMessage, AgentMessageKind } from "@/services/admin";
import { Header, Panel } from "./admin-parts";

/*
 * The agent hub on /admin: messages from Hermes and other agents, and managing
 * their keys and the AI budgets (public.admin_hub()).
 * Agent text is always rendered as plain text (React escapes it, no links, no
 * HTML): agents read mail and forums, so their messages may contain injected content.
 */

const dateTime = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const KIND_LABEL: Record<AgentMessageKind, string> = {
  alert: "Alert",
  report: "Rapport",
  mail_summary: "Mail",
  marketing_draft: "Marketing",
  chat: "Overleg",
  note: "Notitie",
};

type Filter = "all" | "alert" | "report" | "mail_summary" | "marketing_draft" | "talk";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Alles" },
  { id: "alert", label: "Alerts" },
  { id: "report", label: "Rapporten" },
  { id: "mail_summary", label: "Mail" },
  { id: "marketing_draft", label: "Marketing" },
  { id: "talk", label: "Overleg" },
];

function matchesFilter(m: AgentMessage, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "talk") return m.kind === "chat" || m.kind === "note";
  return m.kind === filter;
}

/** New messages addressed to the admin, for the badge in the sidebar. */
export function unreadCount(hub: AgentHub) {
  return hub.messages.filter((m) => m.to === "jeremy" && m.status === "new").length;
}

/* ---------- Messages ---------- */

export function MessagesTab({ hub }: { hub: AgentHub }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showArchive, setShowArchive] = useState(false);
  const [pending, startTransition] = useTransition();

  const unread = unreadCount(hub);
  const visible = hub.messages.filter((m) => matchesFilter(m, filter) && (showArchive || m.status !== "done"));
  // Open alerts always first, then newest first (the list arrives newest first).
  const ordered = [
    ...visible.filter((m) => m.kind === "alert" && m.status === "new"),
    ...visible.filter((m) => !(m.kind === "alert" && m.status === "new")),
  ];

  return (
    <>
      <Header
        eyebrow="Admin"
        title="Berichten"
        subtitle={unread === 0 ? "Alles gelezen." : `${unread} ongelezen ${unread === 1 ? "bericht" : "berichten"} van je agents.`}
      />

      {!hub.email_ready && (
        <p className="mb-6 rounded-2xl border border-lp-line px-5 py-4 text-sm text-lp-pink">
          E-mailmeldingen staan nog uit: er is nog geen Resend-sleutel. Zie het tabblad Agents.
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.id ? "bg-lp-coral text-lp-bg" : "bg-lp-card text-lp-pink hover:text-lp-chalk"
            }`}
          >
            {f.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-lp-pink">
          <input type="checkbox" checked={showArchive} onChange={(e) => setShowArchive(e.target.checked)} className="accent-lp-coral" />
          Archief tonen
        </label>
        {unread > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => void (await markAllReadAction()))}
            className="rounded-full border border-lp-line px-4 py-2 text-sm text-lp-pink transition-colors hover:text-lp-chalk disabled:opacity-50"
          >
            Alles gelezen
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <Panel>
          <p className="text-lp-pink">
            {hub.messages.length === 0 ? "Nog geen berichten. Zodra Hermes is gekoppeld verschijnen ze hier." : "Niets in dit filter."}
          </p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {ordered.map((m) => (
            <MessageCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </>
  );
}

function MessageCard({ m }: { m: AgentMessage }) {
  const [pending, startTransition] = useTransition();
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpenAlert = m.kind === "alert" && m.status === "new";
  const isNew = m.status === "new";
  // Answer agents, not the database's own alerts or your own messages.
  const canReply = m.from !== "runvex" && m.from !== "jeremy";

  function act(work: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) setError(result.error ?? "Mislukt.");
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${m.title}\n\n${m.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Kopiëren lukt niet in deze browser.");
    }
  }

  return (
    <article
      className={`rounded-3xl p-6 sm:p-7 ${isOpenAlert ? "border-2 border-lp-coral bg-lp-card" : "bg-lp-card"} ${
        m.status === "done" ? "opacity-60" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-[0.08em] uppercase">
        <span className={`flex items-center gap-1 font-medium ${m.kind === "alert" ? "text-lp-coral" : "text-lp-pink"}`}>
          {m.kind === "alert" && <AlertTriangle className="h-3.5 w-3.5" />}
          {KIND_LABEL[m.kind]}
        </span>
        <span className="text-lp-chalk/60 normal-case">
          {m.from} → {m.to}
        </span>
        <span className="text-lp-chalk/60 normal-case">{dateTime.format(new Date(m.created_at))}</span>
        {isNew && <span className="rounded-full bg-lp-coral px-2 py-0.5 text-[0.65rem] text-lp-bg">nieuw</span>}
        {m.status === "approved" && <span className="text-lp-pink">goedgekeurd</span>}
        {m.status === "rejected" && <span className="text-lp-chalk/60">afgewezen</span>}
        {m.emailed && <Mail className="h-3.5 w-3.5 text-lp-chalk/50" aria-label="gemaild" />}
      </div>

      <h3 className="mb-3 font-display text-2xl leading-tight tracking-[-0.01em] break-words">{m.title}</h3>
      {m.body && <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words text-lp-chalk/90">{m.body}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {m.kind === "marketing_draft" && m.status !== "approved" && (
          <SmallButton accent disabled={pending} onClick={() => act(() => setMessageStatusAction(m.id, "approved"))}>
            <Check className="h-4 w-4" /> Goedkeuren
          </SmallButton>
        )}
        {m.kind === "marketing_draft" && m.status !== "rejected" && (
          <SmallButton disabled={pending} onClick={() => act(() => setMessageStatusAction(m.id, "rejected"))}>
            <X className="h-4 w-4" /> Afwijzen
          </SmallButton>
        )}
        {m.kind === "marketing_draft" && (
          <SmallButton onClick={copy}>
            <Copy className="h-4 w-4" /> {copied ? "Gekopieerd" : "Kopiëren"}
          </SmallButton>
        )}
        {isNew && m.kind !== "marketing_draft" && m.to === "jeremy" && (
          <SmallButton disabled={pending} onClick={() => act(() => setMessageStatusAction(m.id, "read"))}>
            {isOpenAlert ? "Gezien" : "Gelezen"}
          </SmallButton>
        )}
        {canReply && !replying && <SmallButton onClick={() => setReplying(true)}>Antwoorden</SmallButton>}
        {m.status !== "done" ? (
          <SmallButton disabled={pending} onClick={() => act(() => setMessageStatusAction(m.id, "done"))}>
            Archiveren
          </SmallButton>
        ) : (
          <SmallButton disabled={pending} onClick={() => act(() => setMessageStatusAction(m.id, "read"))}>
            Terugzetten
          </SmallButton>
        )}
      </div>

      {replying && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const result = await replyToAgentAction(m.from, reply, m.thread_id ?? m.id);
              if (result.ok) {
                setReply("");
                setReplying(false);
              }
              return result;
            });
          }}
        >
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={8000}
            rows={3}
            placeholder={`Antwoord aan ${m.from}…`}
            className="w-full rounded-2xl border border-lp-line bg-lp-bg px-4 py-3 text-base text-lp-chalk placeholder:text-lp-chalk/40 focus:border-lp-coral focus:outline-none"
          />
          <div className="flex gap-2">
            <SmallButton accent type="submit" disabled={pending || reply.trim() === ""}>
              Versturen
            </SmallButton>
            <SmallButton onClick={() => setReplying(false)}>Annuleren</SmallButton>
          </div>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-lp-coral">{error}</p>}
    </article>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
  accent = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  accent?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
        accent ? "bg-lp-coral text-lp-bg hover:bg-lp-coral/90" : "border border-lp-line text-lp-pink hover:text-lp-chalk"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Agents, keys and budgets ---------- */

export function AgentsTab({ hub }: { hub: AgentHub }) {
  return (
    <>
      <Header eyebrow="Admin" title="Agents" subtitle="Sleutels, AI-budget en e-mailmeldingen." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Agents en sleutels">
          <AgentKeys hub={hub} />
        </Panel>
        <div className="space-y-6">
          <Panel title="AI-budget">
            <AiBudget hub={hub} />
          </Panel>
          <Panel title="E-mail">
            {hub.email_ready ? (
              <p className="text-lp-chalk/80">
                Aan. Elk nieuw bericht aan jou komt ook als mail binnen (een reeks tegelijk als één mail). Van mailsamenvattingen
                krijg je alleen een seintje, de inhoud staat hier.
              </p>
            ) : (
              <p className="text-lp-chalk/80">
                Uit. Maak een gratis account op resend.com, maak een API-sleutel en zet die in Supabase (SQL Editor):
                <code className="mt-3 block rounded-xl bg-lp-bg px-4 py-3 text-sm break-all text-lp-pink">
                  select vault.create_secret(&apos;re_…&apos;, &apos;resend_api_key&apos;);
                </code>
              </p>
            )}
          </Panel>
          <Panel title="Verbinden">
            <p className="mb-3 text-lp-chalk/80">Agents roepen deze adressen aan met hun eigen sleutel (uitleg in hermes/hub.md):</p>
            <code className="block rounded-xl bg-lp-bg px-4 py-3 text-sm break-all text-lp-pink">
              {supabaseUrl}/rest/v1/rpc/agent_post_messages
              <br />
              {supabaseUrl}/rest/v1/rpc/agent_report
              <br />
              {supabaseUrl}/rest/v1/rpc/agent_inbox
            </code>
          </Panel>
        </div>
      </div>
    </>
  );
}

function AgentKeys({ hub }: { hub: AgentHub }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function makeKey(agent: string) {
    const exists = hub.agents.some((a) => a.name === agent);
    if (exists && !window.confirm(`Nieuwe sleutel voor ${agent}? De oude werkt daarna niet meer.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await createAgentKeyAction(agent);
      if (result.ok) {
        setNewKey({ name: agent, key: result.key });
        setName("");
      } else {
        setError(result.error);
      }
    });
  }

  function revoke(agent: string) {
    if (!window.confirm(`Sleutel van ${agent} intrekken? De agent kan dan niets meer.`)) return;
    startTransition(async () => {
      const result = await revokeAgentKeyAction(agent);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {newKey && (
        <div className="rounded-2xl border-2 border-lp-coral p-5">
          <p className="mb-3 text-sm text-lp-chalk">
            Sleutel voor <strong>{newKey.name}</strong>. Kopieer hem nu: je ziet hem <strong>maar één keer</strong>. Zet hem
            alleen in de geheime instellingen van de agent, nooit in code of chat.
          </p>
          <code className="mb-3 block rounded-xl bg-lp-bg px-4 py-3 text-sm break-all text-lp-pink">{newKey.key}</code>
          <div className="flex gap-2">
            <SmallButton
              accent
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(newKey.key);
                  setCopied(true);
                } catch {
                  setError("Kopiëren lukt niet, selecteer de sleutel handmatig.");
                }
              }}
            >
              <Copy className="h-4 w-4" /> {copied ? "Gekopieerd" : "Kopiëren"}
            </SmallButton>
            <SmallButton
              onClick={() => {
                setNewKey(null);
                setCopied(false);
              }}
            >
              Klaar
            </SmallButton>
          </div>
        </div>
      )}

      {hub.agents.length === 0 ? (
        <p className="text-lp-pink">Nog geen agents.</p>
      ) : (
        <ul>
          {hub.agents.map((a) => (
            <li key={a.name} className="flex flex-wrap items-center gap-3 border-t border-lp-line py-4 first:border-t-0">
              <KeyRound className={`h-4 w-4 ${a.active ? "text-lp-coral" : "text-lp-chalk/40"}`} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-lp-chalk/60">
                  {a.active ? "actief" : "ingetrokken"} ·{" "}
                  {a.last_seen_at ? `laatst gezien ${dateTime.format(new Date(a.last_seen_at))}` : "nog nooit verbonden"}
                </p>
              </div>
              <SmallButton disabled={pending} onClick={() => makeKey(a.name)}>
                Nieuwe sleutel
              </SmallButton>
              {a.active && (
                <SmallButton disabled={pending} onClick={() => revoke(a.name)}>
                  Intrekken
                </SmallButton>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-wrap gap-2 border-t border-lp-line pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          makeKey(name.trim().toLowerCase());
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="naam, bijv. hermes"
          maxLength={32}
          className="h-10 min-w-0 flex-1 rounded-full border border-lp-line bg-lp-bg px-4 text-base text-lp-chalk placeholder:text-lp-chalk/40 focus:border-lp-coral focus:outline-none"
        />
        <SmallButton accent type="submit" disabled={pending || name.trim() === ""}>
          Agent toevoegen
        </SmallButton>
      </form>

      {error && <p className="text-sm text-lp-coral">{error}</p>}
    </div>
  );
}

function AiBudget({ hub }: { hub: AgentHub }) {
  const [pending, startTransition] = useTransition();
  const [monthly, setMonthly] = useState(String(hub.monthly_ai_budget_usd));
  const [topup, setTopup] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const spent = hub.ai_credit_spent_usd ?? 0;
  const credit = hub.ai_credit_usd ?? 0;
  const pct = credit > 0 ? Math.min(100, (spent / credit) * 100) : 0;

  return (
    <div className="space-y-6">
      {credit > 0 && hub.ai_credit_since && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-lp-pink">Anthropic-tegoed sinds {dateTime.format(new Date(hub.ai_credit_since))}</span>
            <span className="font-medium tabular-nums">
              {usd.format(spent)} / {usd.format(credit)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-lp-line/60">
            <div className="h-1.5 rounded-full bg-lp-coral" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          const monthlyValue = Number(monthly.replace(",", "."));
          const topupValue = topup.trim() === "" ? null : Number(topup.replace(",", "."));
          startTransition(async () => {
            const result = await setAiBudgetAction(monthlyValue, topupValue);
            setMessage(result.ok ? "Opgeslagen." : result.error);
            if (result.ok) setTopup("");
          });
        }}
      >
        <label className="block text-sm text-lp-pink">
          Maandbudget Claude (USD) — alert bij 80% en 100%
          <input
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            inputMode="decimal"
            className="mt-2 h-10 w-full rounded-full border border-lp-line bg-lp-bg px-4 text-base text-lp-chalk focus:border-lp-coral focus:outline-none"
          />
        </label>
        <label className="block text-sm text-lp-pink">
          Net opgewaardeerd in de Anthropic Console? Vul het bedrag in (USD) — alert bij 80% en 95% verbruikt
          <input
            value={topup}
            onChange={(e) => setTopup(e.target.value)}
            inputMode="decimal"
            placeholder="bijv. 25"
            className="mt-2 h-10 w-full rounded-full border border-lp-line bg-lp-bg px-4 text-base text-lp-chalk placeholder:text-lp-chalk/40 focus:border-lp-coral focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-3">
          <SmallButton accent type="submit" disabled={pending}>
            Opslaan
          </SmallButton>
          {message && <span className="text-sm text-lp-pink">{message}</span>}
        </div>
        <p className="text-xs text-lp-chalk/60">
          Verbruik is wat Runvex zelf meet per AI-call (ai_usage), dus een goede schatting, niet het exacte saldo van Anthropic.
        </p>
      </form>
    </div>
  );
}
