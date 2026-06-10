"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Gauge,
  Headphones,
  MapPin,
  Phone,
  Play,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import {
  classifyClaims,
  createSampleAndAssignments,
  getState,
  importSampleClaims,
  initializeState,
  resetStorage,
  runAiAnalysis,
} from "@/lib/store";
import type { Claim, PaveState, Vehicle } from "@/lib/types";

const emptyState: PaveState = {
  vehicles: [],
  claims: [],
  importBatches: [],
  agents: [],
  assignments: [],
  verificationSessions: [],
  aiResults: [],
  decisions: [],
  auditLogs: [],
};

const sectionTitles: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: "PAVE Verification Overview",
    subtitle: "Import, score, sample, call, decide.",
  },
  import: {
    title: "Data Intake",
    subtitle: "Pull dummy PAVE claim records into browser storage.",
  },
  analysis: {
    title: "AI Data Analysis",
    subtitle: "Score records and surface mismatch signals.",
  },
  classification: {
    title: "AI Classification",
    subtitle: "Split claims into Category A and Category B.",
  },
  sampling: {
    title: "Sample Selection",
    subtitle: "Build the 5% province/OEM sample.",
  },
  verification: {
    title: "Verification Operations",
    subtitle: "Track video calls, retries, and evidence.",
  },
  decisions: {
    title: "Decision Routing",
    subtitle: "Move cases into final action lanes.",
  },
  vehicles: {
    title: "PAVE Vehicle Catalog",
    subtitle: "Vehicles, prices, images, and OEM groups.",
  },
  agents: {
    title: "Agent Operations",
    subtitle: "Caller availability and workload.",
  },
  reports: {
    title: "Reports & Audit Trail",
    subtitle: "Reports, evidence, and decision logs.",
  },
  settings: {
    title: "Prototype Settings",
    subtitle: "SLA rules, sampling rules, reset.",
  },
};

export function AdminDashboard({ section }: { section: string }) {
  const [state, setState] = useState<PaveState>(emptyState);
  const active = sectionTitles[section] ? section : "overview";

  useEffect(() => {
    initializeState();
    setState(getState());
  }, []);

  function refresh(next?: PaveState) {
    setState(next ?? getState());
  }

  const title = sectionTitles[active];

  return (
    <DashboardShell role="admin" title={title.title} subtitle={title.subtitle}>
      {active === "overview" && <Overview state={state} />}
      {active === "import" && <ImportScreen state={state} onImport={() => refresh(importSampleClaims())} />}
      {active === "analysis" && <AnalysisScreen state={state} onRun={() => refresh(runAiAnalysis())} />}
      {active === "classification" && <ClassificationScreen state={state} onClassify={() => refresh(classifyClaims())} />}
      {active === "sampling" && <SamplingScreen state={state} onSample={() => refresh(createSampleAndAssignments())} />}
      {active === "verification" && <VerificationScreen state={state} />}
      {active === "decisions" && <DecisionsScreen state={state} />}
      {active === "vehicles" && <VehiclesScreen vehicles={state.vehicles} />}
      {active === "agents" && <AgentsScreen state={state} />}
      {active === "reports" && <ReportsScreen state={state} />}
      {active === "settings" && <SettingsScreen onReset={() => refresh(resetAndReturn())} />}
    </DashboardShell>
  );
}

function resetAndReturn() {
  resetStorage();
  return getState();
}

/* ============================================================
   OVERVIEW
   ============================================================ */

function Overview({ state }: { state: PaveState }) {
  const sampled = state.claims.filter((claim) => claim.sampled).length;
  const categoryA = state.claims.filter((claim) => claim.category === "A").length;
  const categoryB = state.claims.filter((claim) => claim.category === "B").length;
  const imported = state.claims.length;
  const analyzed = state.aiResults.length;
  const completedCalls = state.verificationSessions.filter((session) => session.status === "completed").length;
  const decisions = state.decisions.length;
  const verified = state.decisions.filter((d) => d.route === "verified").length;
  const flagged = state.aiResults.reduce((sum, item) => sum + item.mismatchFlags.length, 0);

  const progress = [
    { label: "Import", value: imported ? 100 : 0, tone: "good" },
    { label: "AI scoring", value: imported ? Math.round((analyzed / imported) * 100) : 0, tone: "field" },
    { label: "Sampling", value: imported ? Math.round((sampled / imported) * 100) : 0, tone: "warn" },
    { label: "Calls", value: sampled ? Math.round((completedCalls / sampled) * 100) : 0, tone: "field" },
    { label: "Routing", value: sampled ? Math.round((decisions / sampled) * 100) : 0, tone: "good" },
  ];

  const provinceBreakdown = computeBreakdown(state.claims, "province");
  const oemBreakdown = computeBreakdown(state.claims, "oem");
  const recentLogs = state.auditLogs.slice(0, 6);

  return (
    <div className="stack">
      <section className="command-hero">
        <img src="https://pave.gov.pk/landing/img/hero-section2.png" alt="" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">1,314,726 applicant population</p>
          <h2>Wolfiz/PAVE verification command centre</h2>
          <p className="hero-sub">Real-time orchestration across intake, AI scoring, sampling, agent calls, and routing.</p>
          <div className="hero-badges">
            <span>95% confidence</span>
            <span>+/-2% margin</span>
            <span>65,736 target sample</span>
            <span>7-point RFP check</span>
          </div>
        </div>
        <div className="hero-console">
          <span>Live records</span>
          <strong>{(imported || 0).toLocaleString()}</strong>
          <small>in browser storage</small>
          <div className="hero-spark" aria-hidden="true">
            <Sparkline values={[3, 5, 8, 6, 10, 14, 12, 18, 22, 19, 26]} />
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <Metric label="Imported claims" value={imported.toLocaleString()} icon={<Database size={20} />} delta={imported ? "+100%" : "—"} />
        <Metric label="AI scored" value={analyzed.toLocaleString()} icon={<Bot size={20} />} delta={analyzed ? `${Math.round((analyzed / Math.max(imported, 1)) * 100)}%` : "—"} />
        <Metric label="Sampled cases" value={sampled.toLocaleString()} icon={<Activity size={20} />} delta={sampled ? "5%" : "0%"} />
        <Metric label="Verified" value={verified.toLocaleString()} icon={<CheckCircle2 size={20} />} delta={verified ? "+OK" : "—"} />
      </div>

      <section className="pipeline-board">
        {([
          ["Data", "Portal import", Database],
          ["AI", "Score + flags", Activity],
          ["Classify", "A/B split", ShieldCheck],
          ["Sample", "Province/OEM", Users],
          ["Call", "7-point check", Headphones],
          ["Route", "Final decision", CheckCircle2],
        ] satisfies [string, string, LucideIcon][]).map(([title, detail, PhaseIcon], index) => (
          <div className="phase-card" key={String(title)}>
            <span className="phase-number">{index + 1}</span>
            <PhaseIcon size={20} />
            <strong>{title}</strong>
            <small>{detail}</small>
            {index < 5 && <ArrowRight className="phase-arrow" size={16} />}
          </div>
        ))}
      </section>

      <section className="ops-grid">
        <div className="panel visual-panel">
          <PanelHeader title="Workflow Progress" hint="End-to-end pipeline state" icon={<Gauge size={16} />} />
          {progress.map((item) => (
            <div className="progress-row" key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}%</strong>
              </div>
              <div className="progress-track">
                <span className={item.tone} style={{ width: `${Math.min(100, item.value)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel visual-panel">
          <PanelHeader title="Risk Mix" hint="A vs B vs sampled vs decided" icon={<Shield size={16} />} />
          <RiskMix categoryA={categoryA} categoryB={categoryB} sampled={sampled} decisions={decisions} />
        </div>

        <div className="panel visual-panel quick-panel">
          <PanelHeader title="Next Moves" hint="Suggested actions" icon={<Sparkles size={16} />} />
          {[
            ["Import", "Load PAVE sample file", "/admin/import"],
            ["Analyze", "Run AI data checks", "/admin/analysis"],
            ["Sample", "Create verification queue", "/admin/sampling"],
            ["Agent", "Complete calls", "/admin/verification"],
          ].map(([label, text]) => (
            <div className="quick-card" key={label}>
              <strong>{label}</strong>
              <span>{text}</span>
              <ArrowUpRight size={14} className="quick-arrow" />
            </div>
          ))}
        </div>
      </section>

      <section className="ops-grid-2">
        <div className="panel">
          <PanelHeader title="Province Distribution" hint="Where claims are coming from" icon={<MapPin size={16} />} />
          <DistributionBars items={provinceBreakdown} emptyText="No claims imported yet" />
        </div>
        <div className="panel">
          <PanelHeader title="OEM Mix" hint="Vehicle manufacturer breakdown" icon={<Zap size={16} />} />
          <DistributionBars items={oemBreakdown} tone="teal" emptyText="No claims imported yet" />
        </div>
        <div className="panel activity-panel">
          <PanelHeader title="Live Activity" hint="System and agent events" icon={<Activity size={16} />} dot />
          <ActivityFeed items={recentLogs} />
        </div>
      </section>

      <section className="health-strip">
        <HealthTile label="System" value="Operational" tone="good" icon={<Shield size={16} />} />
        <HealthTile label="AI engine" value={analyzed ? `${analyzed} processed` : "Idle"} tone={analyzed ? "good" : "muted"} icon={<Bot size={16} />} />
        <HealthTile label="Flags raised" value={flagged.toLocaleString()} tone={flagged > 30 ? "warn" : "good"} icon={<AlertTriangle size={16} />} />
        <HealthTile label="Agents online" value={`${state.agents.filter((a) => a.status !== "offline").length}/${state.agents.length}`} tone="good" icon={<Headphones size={16} />} />
        <HealthTile label="Avg call" value="11 min" tone="muted" icon={<Clock size={16} />} />
        <HealthTile label="SLA" value="On track" tone="good" icon={<TrendingUp size={16} />} />
      </section>
    </div>
  );
}

/* ============================================================
   IMPORT
   ============================================================ */

function ImportScreen({ state, onImport }: { state: PaveState; onImport: () => void }) {
  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Sample file import</h2>
            <p>Fake upload. Seeds claims, CNICs, vehicle IDs, delivery states, and registration states.</p>
          </div>
          <button className="primary-button" onClick={onImport}>
            <Upload size={18} />
            Import sample claims
          </button>
        </div>
        <div className="dropzone">
          <Upload size={28} />
          <strong>pave-portal-sample-claims.csv</strong>
          <span>Fake uploader only. Records are written to localStorage under pave.claims.</span>
        </div>
      </section>
      <DataTable
        title="Imported batches"
        rows={state.importBatches.map((batch) => [batch.fileName, batch.records, new Date(batch.importedAt).toLocaleString(), batch.source])}
        headers={["File", "Records", "Imported", "Source"]}
      />
      <section className="panel" id="templates">
        <h2>Sample file templates</h2>
        <div className="template-grid">
          {["Applicant claims CSV", "OEM receipts CSV", "Delivery evidence ZIP", "Registration extract CSV"].map((item) => (
            <div className="template-card" key={item}>
              <FileText size={22} />
              <strong>{item}</strong>
              <span>Dummy template placeholder</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   ANALYSIS
   ============================================================ */

function AnalysisScreen({ state, onRun }: { state: PaveState; onRun: () => void }) {
  const flags = state.aiResults.reduce((sum, item) => sum + item.mismatchFlags.length + item.duplicateFlags.length, 0);
  const duplicates = state.aiResults.reduce((sum, item) => sum + item.duplicateFlags.length, 0);
  const avgScore = state.aiResults.length
    ? Math.round(state.aiResults.reduce((s, r) => s + r.confidenceScore, 0) / state.aiResults.length)
    : 0;
  const histogram = buildHistogram(state.aiResults.map((r) => r.confidenceScore), 8);
  const flagCounts = buildFlagCounts(state.aiResults);

  return (
    <div className="stack">
      <section className="action-row">
        <Metric label="Records analyzed" value={state.aiResults.length} icon={<Bot size={20} />} />
        <Metric label="Total flags" value={flags} icon={<AlertTriangle size={20} />} />
        <Metric label="Duplicates" value={duplicates} icon={<Database size={20} />} />
        <button className="primary-button" onClick={onRun}>
          <Play size={18} />
          Run AI analysis
        </button>
      </section>

      <section className="ops-grid-3">
        <div className="panel score-card">
          <PanelHeader title="Confidence Score" hint="Engine-weighted average" icon={<Gauge size={16} />} />
          <ScoreDial value={avgScore} />
          <div className="score-meta">
            <div>
              <span>Min</span>
              <strong>{state.aiResults.length ? Math.min(...state.aiResults.map((r) => r.confidenceScore)) : 0}</strong>
            </div>
            <div>
              <span>Avg</span>
              <strong>{avgScore}</strong>
            </div>
            <div>
              <span>Max</span>
              <strong>{state.aiResults.length ? Math.max(...state.aiResults.map((r) => r.confidenceScore)) : 0}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <PanelHeader title="Score Distribution" hint="Buckets of 0-100 confidence" icon={<Activity size={16} />} />
          <Histogram buckets={histogram} />
        </div>

        <div className="panel">
          <PanelHeader title="Top Mismatch Flags" hint="Most common AI signals" icon={<AlertTriangle size={16} />} />
          {flagCounts.length === 0 ? (
            <EmptyChart text="Run AI analysis to see flags" />
          ) : (
            <DistributionBars items={flagCounts} tone="amber" />
          )}
        </div>
      </section>

      <DataTable
        title="AI findings"
        headers={["Claim", "Score", "Mismatch flags", "Duplicate flags"]}
        rows={state.aiResults.slice(0, 14).map((item) => [
          item.claimId,
          item.confidenceScore,
          item.mismatchFlags.join(", ") || "None",
          item.duplicateFlags.join(", ") || "None",
        ])}
      />
    </div>
  );
}

/* ============================================================
   CLASSIFICATION
   ============================================================ */

function ClassificationScreen({ state, onClassify }: { state: PaveState; onClassify: () => void }) {
  const categoryA = state.claims.filter((claim) => claim.category === "A");
  const categoryB = state.claims.filter((claim) => claim.category === "B");
  const total = state.claims.length;
  return (
    <div className="stack">
      <div className="action-row">
        <Metric label="Fully complied" value={categoryA.length} icon={<CheckCircle2 size={20} />} />
        <Metric label="Low confidence" value={categoryB.length} icon={<AlertTriangle size={20} />} />
        <Metric label="A vs B" value={total ? `${Math.round((categoryA.length / total) * 100)}% / ${Math.round((categoryB.length / total) * 100)}%` : "—"} icon={<Shield size={20} />} />
        <button className="primary-button" onClick={onClassify}>
          <RefreshCw size={18} />
          Classify all records
        </button>
      </div>
      <ClaimList title="Category A - Fully Complied Records" claims={categoryA.slice(0, 10)} />
      <ClaimList title="Category B - Non-Complied or Low Confidence Records" claims={categoryB.slice(0, 10)} />
    </div>
  );
}

/* ============================================================
   SAMPLING
   ============================================================ */

function SamplingScreen({ state, onSample }: { state: PaveState; onSample: () => void }) {
  const sampled = state.claims.filter((claim) => claim.sampled);
  const byProvince = groupCount(sampled, "province");
  const byOem = groupCount(sampled, "oem");
  const total = state.claims.length;
  const samplePct = total ? Math.round((sampled.length / total) * 1000) / 10 : 0;
  const provinceBars = Object.entries(byProvince).map(([name, value]) => ({ name, value }));
  const oemBars = Object.entries(byOem).map(([name, value]) => ({ name, value }));

  return (
    <div className="stack">
      <div className="action-row">
        <Metric label="Sample target" value="65,736" icon={<Activity size={20} />} />
        <Metric label="Prototype sample" value={sampled.length} icon={<Users size={20} />} />
        <Metric label="Confidence / margin" value="95% / +/-2%" icon={<CheckCircle2 size={20} />} />
        <button className="primary-button" onClick={onSample}>
          <Play size={18} />
          Generate 5% sample
        </button>
      </div>

      <section className="ops-grid-3">
        <div className="panel">
          <PanelHeader title="Sample Coverage" hint={`${samplePct}% of population`} icon={<Gauge size={16} />} />
          <ScoreDial value={samplePct * 20} display={`${samplePct}%`} />
          <p className="muted score-foot">A stratified 5% sample across province + OEM + category.</p>
        </div>

        <div className="panel">
          <PanelHeader title="Province Stratification" hint="Sampled cases by region" icon={<MapPin size={16} />} />
          {provinceBars.length === 0 ? (
            <EmptyChart text="Generate sample to see breakdown" />
          ) : (
            <DistributionBars items={provinceBars} />
          )}
        </div>

        <div className="panel">
          <PanelHeader title="OEM Mix" hint="Manufacturer distribution" icon={<Zap size={16} />} />
          {oemBars.length === 0 ? (
            <EmptyChart text="Generate sample to see breakdown" />
          ) : (
            <DistributionBars items={oemBars} tone="teal" />
          )}
        </div>
      </section>

      <section className="panel formula-card">
        <PanelHeader title="Sampling Formula" hint="Stratified random + confidence-weighted" icon={<Sparkles size={16} />} />
        <div className="formula-grid">
          <div><span>Population</span><strong>{total.toLocaleString()}</strong></div>
          <div><span>Strata</span><strong>Province × OEM × Category</strong></div>
          <div><span>Per-stratum rate</span><strong>5%</strong></div>
          <div><span>Confidence</span><strong>95%</strong></div>
          <div><span>Margin</span><strong>+/-2%</strong></div>
          <div><span>Bias</span><strong>Low-score first</strong></div>
        </div>
      </section>

      <ClaimList title="Priority sampled cases" claims={sampled.slice(0, 16)} />
    </div>
  );
}

/* ============================================================
   VERIFICATION
   ============================================================ */

function VerificationScreen({ state }: { state: PaveState }) {
  const queued = state.verificationSessions.filter((item) => item.status === "queued").length;
  const completed = state.verificationSessions.filter((item) => item.status === "completed").length;
  const active = state.verificationSessions.filter((item) => item.status === "active").length;
  const missed = state.verificationSessions.filter((item) => item.status === "missed").length;
  const total = state.verificationSessions.length;

  const rows = state.verificationSessions.map((session) => {
    const claim = state.claims.find((item) => item.id === session.claimId);
    const agent = state.agents.find((item) => item.id === session.agentId);
    return [session.claimId, claim?.applicantName ?? "Unknown", agent?.name ?? session.agentId, session.status, session.retryCount];
  });

  const agentLoad = state.agents.map((agent) => ({
    name: agent.name.split(" ")[0],
    value: agent.assignedCases || agent.completedToday,
  }));

  return (
    <div className="stack">
      <div className="metric-grid">
        <Metric label="Queued" value={queued} icon={<Phone size={20} />} />
        <Metric label="Active" value={active} icon={<Headphones size={20} />} />
        <Metric label="Completed" value={completed} icon={<CheckCircle2 size={20} />} />
        <Metric label="Missed / Retry" value={missed} icon={<RefreshCw size={20} />} />
      </div>

      <section className="ops-grid">
        <div className="panel visual-panel">
          <PanelHeader title="Queue Status" hint={`${total} sessions tracked`} icon={<Activity size={16} />} />
          <StackedBar segments={[
            { label: "Completed", value: completed, tone: "good" },
            { label: "Active", value: active, tone: "field" },
            { label: "Queued", value: queued, tone: "warn" },
            { label: "Missed", value: missed, tone: "bad" },
          ]} />
          <div className="legend">
            <LegendDot tone="good" label={`Completed ${completed}`} />
            <LegendDot tone="field" label={`Active ${active}`} />
            <LegendDot tone="warn" label={`Queued ${queued}`} />
            <LegendDot tone="bad" label={`Missed ${missed}`} />
          </div>
        </div>

        <div className="panel visual-panel">
          <PanelHeader title="Agent Load" hint="Cases per officer" icon={<Users size={16} />} />
          {agentLoad.length === 0 ? (
            <EmptyChart text="No agents online" />
          ) : (
            <DistributionBars items={agentLoad} tone="teal" />
          )}
        </div>

        <div className="panel visual-panel quick-panel">
          <PanelHeader title="SLA Tracker" hint="Service-level targets" icon={<Clock size={16} />} />
          <SlaItem label="Initial call attempt" target="<4 hrs of sampling" status="good" />
          <SlaItem label="Retry window" target="2 retries within 48 hrs" status="good" />
          <SlaItem label="Case report" target="<5 days of completion" status="warn" />
          <SlaItem label="AI report" target="<24 hrs of session" status="good" />
        </div>
      </section>

      <DataTable
        title="Video verification queue"
        headers={["Claim", "Applicant", "Agent", "Status", "Retries"]}
        rows={rows}
      />
    </div>
  );
}

/* ============================================================
   DECISIONS
   ============================================================ */

function DecisionsScreen({ state }: { state: PaveState }) {
  const routes = [
    ["Verified", "verified", "Ready for subsidy", "good"],
    ["Manual Review", "manual_review", "Supervisor judgement", "warn"],
    ["Physical", "physical_verification", "Field visit needed", "field"],
    ["Rejected", "not_recommended", "Supervisor sign-off", "bad"],
  ] as const;
  const total = state.decisions.length;
  const counts = routes.map(([label, route, , tone]) => ({
    name: label,
    value: state.decisions.filter((d) => d.route === route).length,
    tone,
  }));

  return (
    <div className="stack">
      <section className="route-summary">
        {routes.map(([label, route, hint, tone]) => {
          const count = state.decisions.filter((decision) => decision.route === route).length;
          return (
            <div className={`route-stat ${tone}`} key={route}>
              <span>{label}</span>
              <strong>{count}</strong>
              <small>{hint}</small>
            </div>
          );
        })}
      </section>

      <section className="ops-grid-2">
        <div className="panel">
          <PanelHeader title="Routing Mix" hint={`${total} total decisions`} icon={<Shield size={16} />} />
          {total === 0 ? (
            <EmptyChart text="Complete agent calls to see routing mix" />
          ) : (
            <StackedBar segments={counts.map((c) => ({ label: c.name, value: c.value, tone: c.tone }))} />
          )}
          <div className="legend">
            {counts.map((c) => <LegendDot key={c.name} tone={c.tone} label={`${c.name} ${c.value}`} />)}
          </div>
        </div>
        <div className="panel">
          <PanelHeader title="Outcome Velocity" hint="Decisions over recent activity" icon={<TrendingUp size={16} />} />
          {total === 0 ? (
            <EmptyChart text="Nothing routed yet" />
          ) : (
            <Sparkline values={generateVelocityCurve(total)} large />
          )}
        </div>
      </section>

      <div className="kanban">
        {routes.map(([label, route, hint, tone]) => {
          const decisions = state.decisions.filter((decision) => decision.route === route);
          return (
            <section className={`lane ${tone}`} key={route}>
              <header>
                <div>
                  <h2>{label}</h2>
                  <span>{hint}</span>
                </div>
                <strong>{decisions.length}</strong>
              </header>
              {decisions.map((decision) => (
                <div className="case-card" key={decision.id}>
                  <strong>{decision.claimId}</strong>
                  <span>{decision.label}</span>
                  <small>{new Date(decision.createdAt).toLocaleString()}</small>
                </div>
              ))}
              {decisions.length === 0 && <div className="empty-lane">No cases</div>}
            </section>
          );
        })}
      </div>
      <section className="flow-strip">
        <span>Imported</span>
        <span>AI scored</span>
        <span>Sampled</span>
        <span>Called</span>
        <span>{total} routed</span>
      </section>
    </div>
  );
}

/* ============================================================
   OTHER SCREENS
   ============================================================ */

function VehiclesScreen({ vehicles }: { vehicles: Vehicle[] }) {
  const [filter, setFilter] = useState("all");
  const filtered = vehicles.filter((vehicle) => filter === "all" || vehicle.category === filter || vehicle.oem === filter);
  const oems = Array.from(new Set(vehicles.map((vehicle) => vehicle.oem))).sort();

  return (
    <div className="stack">
      <div className="filters">
        {["all", "two_wheeler", "three_wheeler", ...oems].map((item) => (
          <button key={item} className={filter === item ? "chip active" : "chip"} onClick={() => setFilter(item)}>
            {item.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="vehicle-grid">
        {filtered.map((vehicle) => (
          <article className="vehicle-card" key={vehicle.id}>
            <div className="vehicle-image">
              <img src={vehicle.imageUrl} alt={vehicle.name} />
            </div>
            <div>
              <strong>{vehicle.name}</strong>
              <span>{vehicle.oem}</span>
              <p>{vehicle.priceLabel}</p>
              <small>{vehicle.category === "two_wheeler" ? "Two Wheeler" : "Three Wheeler"}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AgentsScreen({ state }: { state: PaveState }) {
  return (
    <div className="stack">
      <div className="agent-grid">
        {state.agents.map((agent) => (
          <article className="panel agent-card" key={agent.id}>
            <div>
              <strong>{agent.name}</strong>
              <span className={`status ${agent.status}`}>{agent.status.replace("_", " ")}</span>
            </div>
            <dl>
              <dt>Assigned</dt>
              <dd>{agent.assignedCases}</dd>
              <dt>Completed today</dt>
              <dd>{agent.completedToday}</dd>
              <dt>Avg call</dt>
              <dd>{agent.averageCallMinutes} min</dd>
            </dl>
          </article>
        ))}
      </div>
      <DataTable
        title="Workload"
        headers={["Agent", "Status", "Assigned", "Completed", "Avg call"]}
        rows={state.agents.map((agent) => [agent.name, agent.status, agent.assignedCases, agent.completedToday, `${agent.averageCallMinutes} min`])}
      />
    </div>
  );
}

function ReportsScreen({ state }: { state: PaveState }) {
  const verified = state.decisions.filter((item) => item.route === "verified").length;
  const doubtful = state.decisions.filter((item) => item.route === "not_recommended").length;
  return (
    <div className="stack">
      <div className="metric-grid">
        <Metric label="Case reports" value={verified} icon={<FileText size={20} />} />
        <Metric label="Doubtful reports" value={doubtful} icon={<AlertTriangle size={20} />} />
        <Metric label="Fortnightly report" value="Draft ready" icon={<CheckCircle2 size={20} />} />
        <Metric label="Audit logs" value={state.auditLogs.length} icon={<Database size={20} />} />
      </div>
      <DataTable
        title="Audit trail"
        headers={["Time", "Actor", "Action"]}
        rows={state.auditLogs.map((log) => [new Date(log.at).toLocaleString(), log.actor, log.action])}
      />
    </div>
  );
}

function SettingsScreen({ onReset }: { onReset: () => void }) {
  return (
    <div className="stack">
      <section className="panel">
        <h2>SLA and storage settings</h2>
        <div className="settings-grid">
          <div><strong>Case report SLA</strong><span>Within 5 days of verification completion</span></div>
          <div><strong>AI report generation</strong><span>Within 24 hours of video session completion</span></div>
          <div><strong>Storage mode</strong><span>Browser localStorage only</span></div>
          <div><strong>Evidence vault</strong><span>AES-256 / TLS 1.3 copy displayed as prototype policy text</span></div>
        </div>
        <button className="danger-button" onClick={onReset}>
          <RefreshCw size={18} />
          Reset dummy browser data
        </button>
      </section>
    </div>
  );
}

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */

function ClaimList({ title, claims }: { title: string; claims: Claim[] }) {
  return (
    <DataTable
      title={title}
      headers={["Claim", "Applicant", "Province", "OEM", "Score", "Status"]}
      rows={claims.map((claim) => [
        claim.id,
        claim.applicantName,
        claim.province,
        claim.oem,
        claim.confidenceScore ?? "-",
        claim.sampled ? "Sampled" : claim.category ? `Category ${claim.category}` : "Pending",
      ])}
    />
  );
}

function DataTable({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <section className="panel table-panel">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length}>No data yet. Run the previous workflow action first.</td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value, icon, delta }: { label: string; value: string | number; icon: React.ReactNode; delta?: string }) {
  return (
    <article className="metric">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {delta && <em className="metric-delta">{delta}</em>}
    </article>
  );
}

function PanelHeader({ title, hint, icon, dot }: { title: string; hint?: string; icon?: React.ReactNode; dot?: boolean }) {
  return (
    <div className="panel-head">
      <div className="panel-head-left">
        {icon && <span className="panel-head-icon">{icon}</span>}
        <h2>{title}</h2>
        {dot && <span className="live-dot" />}
      </div>
      {hint && <span className="panel-head-hint">{hint}</span>}
    </div>
  );
}

function RiskMix({ categoryA, categoryB, sampled, decisions }: { categoryA: number; categoryB: number; sampled: number; decisions: number }) {
  const data = [
    { label: "Cat A", value: categoryA, tone: "good" as const },
    { label: "Cat B", value: categoryB, tone: "warn" as const },
    { label: "Sampled", value: sampled, tone: "field" as const },
    { label: "Decided", value: decisions, tone: "bad" as const },
  ];
  const max = Math.max(...data.map((d) => d.value), 1);
  const isEmpty = data.every((d) => d.value === 0);

  if (isEmpty) {
    return (
      <div className="risk-empty">
        <Shield size={28} />
        <strong>No risk data yet</strong>
        <span>Run AI analysis and sampling to populate the mix.</span>
      </div>
    );
  }

  return (
    <div className="risk-chart">
      <div className="risk-bars">
        {data.map((d) => {
          const heightPct = Math.max(8, (d.value / max) * 100);
          return (
            <div className="risk-col" key={d.label}>
              <span className="risk-val">{d.value}</span>
              <div className={`risk-bar ${d.tone}`} style={{ height: `${heightPct}%` }} />
              <small>{d.label}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistributionBars({ items, tone = "good", emptyText }: { items: { name: string; value: number }[]; tone?: "good" | "teal" | "amber"; emptyText?: string }) {
  if (items.length === 0) return <EmptyChart text={emptyText ?? "No data"} />;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="dist-bars">
      {items.slice(0, 7).map((item) => (
        <div className="dist-row" key={item.name}>
          <span className="dist-name" title={item.name}>{item.name}</span>
          <div className="dist-track">
            <span className={`dist-fill ${tone}`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <strong className="dist-val">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function StackedBar({ segments }: { segments: { label: string; value: number; tone: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="stacked-bar">
      {segments.map((seg) => (
        <span
          key={seg.label}
          className={`stacked-seg ${seg.tone}`}
          style={{ width: `${(seg.value / total) * 100}%` }}
          title={`${seg.label}: ${seg.value}`}
        >
          {seg.value > 0 && (seg.value / total) > 0.08 ? seg.value : ""}
        </span>
      ))}
    </div>
  );
}

function LegendDot({ tone, label }: { tone: string; label: string }) {
  return (
    <div className="legend-dot">
      <span className={`dot ${tone}`} />
      <small>{label}</small>
    </div>
  );
}

function ScoreDial({ value, display }: { value: number; display?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="score-dial">
      <svg viewBox="0 0 120 120" width="160" height="160">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" stroke="rgba(15, 50, 42, 0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r="52"
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="score-num">
        <strong>{display ?? clamped}</strong>
        <span>{display ? "coverage" : "of 100"}</span>
      </div>
    </div>
  );
}

function Histogram({ buckets }: { buckets: { range: string; count: number }[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const isEmpty = buckets.every((b) => b.count === 0);
  if (isEmpty) return <EmptyChart text="Run AI analysis to populate" />;
  return (
    <div className="histogram">
      {buckets.map((b) => (
        <div className="histo-col" key={b.range}>
          <div className="histo-bar" style={{ height: `${(b.count / max) * 100}%` }}>
            <span>{b.count > 0 ? b.count : ""}</span>
          </div>
          <small>{b.range}</small>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ values, large = false }: { values: number[]; large?: boolean }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = large ? 480 : 120;
  const height = large ? 140 : 36;
  const step = width / (values.length - 1 || 1);
  const points = values
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={large ? "sparkline lg" : "sparkline"} width="100%" height={height}>
      <defs>
        <linearGradient id={large ? "sparkLg" : "sparkSm"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
          <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${large ? "sparkLg" : "sparkSm"})`} points={areaPoints} />
      <polyline fill="none" stroke="#10b981" strokeWidth={large ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" points={points} />
      {large && values.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - ((v - min) / range) * height} r="3" fill="#10b981" />
      ))}
    </svg>
  );
}

function ActivityFeed({ items }: { items: { id: string; at: string; actor: string; action: string }[] }) {
  if (items.length === 0) {
    return <p className="muted">No activity yet. Trigger an import or analysis.</p>;
  }
  return (
    <ul className="activity-list">
      {items.map((item) => (
        <li key={item.id}>
          <span className="activity-bullet" />
          <div>
            <strong>{item.actor}</strong>
            <p>{item.action}</p>
            <small>{new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}

function HealthTile({ label, value, tone, icon }: { label: string; value: string; tone: "good" | "warn" | "bad" | "muted"; icon: React.ReactNode }) {
  return (
    <div className={`health-tile ${tone}`}>
      <span className="health-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SlaItem({ label, target, status }: { label: string; target: string; status: "good" | "warn" | "bad" }) {
  return (
    <div className={`sla-item ${status}`}>
      <div>
        <strong>{label}</strong>
        <span>{target}</span>
      </div>
      <span className={`sla-dot ${status}`} />
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="empty-chart">
      <Activity size={22} />
      <span>{text}</span>
    </div>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

function groupCount(items: Claim[], field: "province" | "oem") {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item[field]] = (acc[item[field]] ?? 0) + 1;
    return acc;
  }, {});
}

function computeBreakdown(items: Claim[], field: "province" | "oem") {
  const counts = groupCount(items, field);
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildHistogram(values: number[], bucketCount: number) {
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    range: `${Math.round((i * 100) / bucketCount)}-${Math.round(((i + 1) * 100) / bucketCount)}`,
    count: 0,
  }));
  values.forEach((v) => {
    const idx = Math.min(bucketCount - 1, Math.floor((v / 100) * bucketCount));
    buckets[idx].count += 1;
  });
  return buckets;
}

function buildFlagCounts(results: { mismatchFlags: string[] }[]) {
  const counts = new Map<string, number>();
  results.forEach((r) => r.mismatchFlags.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1)));
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function generateVelocityCurve(total: number) {
  return [0, Math.round(total * 0.05), Math.round(total * 0.15), Math.round(total * 0.32), Math.round(total * 0.55), Math.round(total * 0.78), total];
}
