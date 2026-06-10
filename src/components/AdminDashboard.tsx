"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  Headphones,
  Play,
  RefreshCw,
  ShieldCheck,
  Upload,
  Users,
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

function Overview({ state }: { state: PaveState }) {
  const sampled = state.claims.filter((claim) => claim.sampled).length;
  const categoryA = state.claims.filter((claim) => claim.category === "A").length;
  const categoryB = state.claims.filter((claim) => claim.category === "B").length;
  const imported = state.claims.length;
  const analyzed = state.aiResults.length;
  const completedCalls = state.verificationSessions.filter((session) => session.status === "completed").length;
  const decisions = state.decisions.length;
  const progress = [
    { label: "Import", value: imported ? 100 : 0, tone: "good" },
    { label: "AI scoring", value: imported ? Math.round((analyzed / imported) * 100) : 0, tone: "field" },
    { label: "Sampling", value: imported ? Math.round((sampled / imported) * 100) : 0, tone: "warn" },
    { label: "Calls", value: sampled ? Math.round((completedCalls / sampled) * 100) : 0, tone: "field" },
    { label: "Routing", value: sampled ? Math.round((decisions / sampled) * 100) : 0, tone: "good" },
  ];

  return (
    <div className="stack">
      <section className="command-hero">
        <img src="https://pave.gov.pk/landing/img/hero-section2.png" alt="" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">1,314,726 applicant population</p>
          <h2>Wolfiz/PAVE verification command centre</h2>
          <div className="hero-badges">
            <span>95% confidence</span>
            <span>+/-2% margin</span>
            <span>65,736 target sample</span>
          </div>
        </div>
        <div className="hero-console">
          <span>Live prototype</span>
          <strong>{imported || 0}</strong>
          <small>records in browser storage</small>
        </div>
      </section>
      <div className="metric-grid">
        <Metric label="Imported claims" value={state.claims.length} icon={<Database size={20} />} />
        <Metric label="Category A" value={categoryA} icon={<CheckCircle2 size={20} />} />
        <Metric label="Category B" value={categoryB} icon={<AlertTriangle size={20} />} />
        <Metric label="Sampled cases" value={sampled || "65,736 target"} icon={<Activity size={20} />} />
      </div>
      <section className="pipeline-board">
        {([
          ["Data", "Portal import", Database],
          ["AI", "Score + flags", Activity],
          ["Classify", "A/B split", ShieldCheck],
          ["Sample", "Province/OEM", Users],
          ["Call", "7-point check", Headphones],
          ["Route", "Final decision", CheckCircle2],
        ] satisfies [string, string, LucideIcon][]).map(([title, detail, PhaseIcon], index) => {
          return (
            <div className="phase-card" key={String(title)}>
              <span className="phase-number">{index + 1}</span>
              <PhaseIcon size={20} />
              <strong>{title}</strong>
              <small>{detail}</small>
              {index < 5 && <ArrowRight className="phase-arrow" size={16} />}
            </div>
          );
        })}
      </section>
      <section className="ops-grid">
        <div className="panel visual-panel">
          <h2>Workflow Progress</h2>
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
          <h2>Risk Mix</h2>
          <div className="risk-bars">
            <div style={{ height: `${Math.max(10, categoryA)}%` }}>
              <span>A</span>
              <strong>{categoryA}</strong>
            </div>
            <div className="warn" style={{ height: `${Math.max(10, categoryB)}%` }}>
              <span>B</span>
              <strong>{categoryB}</strong>
            </div>
            <div className="field" style={{ height: `${Math.max(10, sampled)}%` }}>
              <span>S</span>
              <strong>{sampled}</strong>
            </div>
            <div className="bad" style={{ height: `${Math.max(10, decisions)}%` }}>
              <span>D</span>
              <strong>{decisions}</strong>
            </div>
          </div>
        </div>
        <div className="panel visual-panel quick-panel">
          <h2>Next Moves</h2>
          {[
            ["Import", "Load PAVE sample file"],
            ["Analyze", "Run AI data checks"],
            ["Sample", "Create verification queue"],
            ["Agent", "Complete calls"],
          ].map(([label, text]) => (
            <div className="quick-card" key={label}>
              <strong>{label}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

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

function AnalysisScreen({ state, onRun }: { state: PaveState; onRun: () => void }) {
  const flags = state.aiResults.reduce((sum, item) => sum + item.mismatchFlags.length + item.duplicateFlags.length, 0);
  return (
    <div className="stack">
      <div className="action-row">
        <Metric label="Records analyzed" value={state.aiResults.length} icon={<BotIcon />} />
        <Metric label="Flags detected" value={flags} icon={<AlertTriangle size={20} />} />
        <button className="primary-button" onClick={onRun}>
          <Play size={18} />
          Run AI analysis
        </button>
      </div>
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

function ClassificationScreen({ state, onClassify }: { state: PaveState; onClassify: () => void }) {
  const categoryA = state.claims.filter((claim) => claim.category === "A");
  const categoryB = state.claims.filter((claim) => claim.category === "B");
  return (
    <div className="stack">
      <div className="action-row">
        <Metric label="Fully complied" value={categoryA.length} icon={<CheckCircle2 size={20} />} />
        <Metric label="Low confidence" value={categoryB.length} icon={<AlertTriangle size={20} />} />
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

function SamplingScreen({ state, onSample }: { state: PaveState; onSample: () => void }) {
  const sampled = state.claims.filter((claim) => claim.sampled);
  const byProvince = groupCount(sampled, "province");
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
      <DataTable title="Province stratification" headers={["Province", "Sampled cases"]} rows={Object.entries(byProvince)} />
      <ClaimList title="Priority sampled cases" claims={sampled.slice(0, 16)} />
    </div>
  );
}

function VerificationScreen({ state }: { state: PaveState }) {
  const rows = state.verificationSessions.map((session) => {
    const claim = state.claims.find((item) => item.id === session.claimId);
    const agent = state.agents.find((item) => item.id === session.agentId);
    return [session.claimId, claim?.applicantName ?? "Unknown", agent?.name ?? session.agentId, session.status, session.retryCount];
  });
  return (
    <div className="stack">
      <div className="metric-grid">
        <Metric label="Queued calls" value={state.verificationSessions.filter((item) => item.status === "queued").length} icon={<HeadsetIcon />} />
        <Metric label="Completed calls" value={state.verificationSessions.filter((item) => item.status === "completed").length} icon={<CheckCircle2 size={20} />} />
        <Metric label="Evidence vault" value={`${state.verificationSessions.length} placeholders`} icon={<FileText size={20} />} />
      </div>
      <DataTable title="Video verification queue" headers={["Claim", "Applicant", "Agent", "Status", "Retries"]} rows={rows} />
    </div>
  );
}

function DecisionsScreen({ state }: { state: PaveState }) {
  const routes = [
    ["Verified", "verified", "Ready for subsidy", "good"],
    ["Manual Review", "manual_review", "Supervisor judgement", "warn"],
    ["Physical", "physical_verification", "Field visit needed", "field"],
    ["Rejected", "not_recommended", "Supervisor sign-off", "bad"],
  ] as const;
  const total = state.decisions.length;
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

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <article className="metric">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function groupCount(items: Claim[], field: "province" | "oem") {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item[field]] = (acc[item[field]] ?? 0) + 1;
    return acc;
  }, {});
}

function BotIcon() {
  return <Activity size={20} />;
}

function HeadsetIcon() {
  return <Users size={20} />;
}
