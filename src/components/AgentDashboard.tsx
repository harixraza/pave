"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Headphones,
  MapPin,
  PhoneCall,
  PlayCircle,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import { checklistItems, completeVerification, getState, initializeState } from "@/lib/store";
import type { Claim, PaveState } from "@/lib/types";

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

export function AgentDashboard() {
  const [state, setState] = useState<PaveState>(emptyState);
  const [selectedClaimId, setSelectedClaimId] = useState<string>("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    Object.fromEntries(checklistItems.map((item) => [item, true])),
  );

  useEffect(() => {
    initializeState();
    const loaded = getState();
    setState(loaded);
    setSelectedClaimId(loaded.assignments[0]?.claimId ?? "");
  }, []);

  const selected = useMemo(
    () => state.claims.find((claim) => claim.id === selectedClaimId),
    [state.claims, selectedClaimId],
  );
  const selectedVehicle = useMemo(
    () => state.vehicles.find((v) => v.id === selected?.vehicleId),
    [state.vehicles, selected],
  );
  const selectedAiResult = useMemo(
    () => state.aiResults.find((r) => r.claimId === selectedClaimId),
    [state.aiResults, selectedClaimId],
  );

  const assignedClaims = state.assignments
    .filter((assignment) => assignment.status !== "completed")
    .map((assignment) => state.claims.find((claim) => claim.id === assignment.claimId))
    .filter(Boolean) as Claim[];

  const completed = state.verificationSessions.filter((session) => session.status === "completed").length;
  const missed = state.verificationSessions.filter((session) => session.status === "missed").length;
  const decisionsByOutcome = {
    verified: state.decisions.filter((d) => d.route === "verified").length,
    manual_review: state.decisions.filter((d) => d.route === "manual_review").length,
    physical: state.decisions.filter((d) => d.route === "physical_verification").length,
    rejected: state.decisions.filter((d) => d.route === "not_recommended").length,
  };
  const totalDecisions = Object.values(decisionsByOutcome).reduce((s, v) => s + v, 0);
  const successRate = totalDecisions ? Math.round((decisionsByOutcome.verified / totalDecisions) * 100) : 0;
  const checklistProgress = Math.round(
    (Object.values(checkedItems).filter(Boolean).length / checklistItems.length) * 100,
  );

  function finish(outcome: "verified" | "manual_review" | "physical_verification" | "not_recommended") {
    if (!selectedClaimId) return;
    const next = completeVerification(selectedClaimId, outcome);
    setState(next);
    const nextClaim = next.assignments.find((assignment) => assignment.status !== "completed")?.claimId ?? "";
    setSelectedClaimId(nextClaim);
    setCheckedItems(Object.fromEntries(checklistItems.map((item) => [item, true])));
  }

  function toggle(item: string) {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  return (
    <DashboardShell
      role="agent"
      title="Agent Video Verification Dashboard"
      subtitle="Open assigned sampled applicants, follow the seven-point RFP checklist, and submit an AI-assisted outcome."
    >
      <div className="stack">
        <AgentHero
          completed={completed}
          assigned={assignedClaims.length}
          successRate={successRate}
        />

        <div className="metric-grid">
          <Metric label="Assigned" value={assignedClaims.length} icon={<PhoneCall size={20} />} />
          <Metric label="Completed today" value={completed} icon={<CheckCircle2 size={20} />} delta={completed ? "+OK" : "—"} />
          <Metric label="Retry queue" value={missed} icon={<RotateCcw size={20} />} />
          <Metric label="Success rate" value={`${successRate}%`} icon={<TrendingUp size={20} />} delta={successRate ? `${decisionsByOutcome.verified}/${totalDecisions}` : "—"} />
        </div>

        <div className="agent-workspace">
          <aside className="agent-side">
            <section className="panel queue-panel" id="assigned">
              <div className="panel-head">
                <div className="panel-head-left">
                  <span className="panel-head-icon"><PhoneCall size={16} /></span>
                  <h2>Assigned Calls</h2>
                </div>
                <span className="panel-head-hint">{assignedClaims.length} waiting</span>
              </div>
              {assignedClaims.length === 0 && (
                <div className="queue-empty">
                  <Headphones size={28} />
                  <strong>No assignments</strong>
                  <span>Admin must import, analyze, classify, and sample first.</span>
                </div>
              )}
              {assignedClaims.map((claim) => (
                <button
                  className={claim.id === selectedClaimId ? "queue-item active" : "queue-item"}
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                >
                  <div className="queue-item-top">
                    <strong>{claim.id}</strong>
                    <span className={claim.category === "B" ? "risk-pill high" : "risk-pill"}>
                      {claim.category ?? "A"}
                    </span>
                  </div>
                  <span>{claim.applicantName}</span>
                  <small>
                    <MapPin size={11} /> {claim.province} · {claim.oem}
                  </small>
                </button>
              ))}
            </section>

            <section className="panel shift-panel">
              <div className="panel-head">
                <div className="panel-head-left">
                  <span className="panel-head-icon"><Clock size={16} /></span>
                  <h2>Today's Shift</h2>
                </div>
              </div>
              <div className="shift-grid">
                <div>
                  <span>Started</span>
                  <strong>09:00</strong>
                </div>
                <div>
                  <span>Avg call</span>
                  <strong>11m</strong>
                </div>
                <div>
                  <span>Verified</span>
                  <strong>{decisionsByOutcome.verified}</strong>
                </div>
                <div>
                  <span>Flagged</span>
                  <strong>{decisionsByOutcome.manual_review + decisionsByOutcome.rejected}</strong>
                </div>
              </div>
              <div className="shift-badge">
                <Award size={14} />
                <span>On track for daily target</span>
              </div>
            </section>
          </aside>

          <section className="agent-main">
            {selected ? (
              <>
                <section className="call-hero panel">
                  <div className="call-hero-left">
                    <div className="call-status">
                      <span className="call-dot" />
                      Video session ready
                    </div>
                    <h2 className="call-name">{selected.applicantName}</h2>
                    <div className="call-meta">
                      <span><Shield size={13} /> {selected.id}</span>
                      <span><FileText size={13} /> CNIC {selected.cnic}</span>
                      <span><MapPin size={13} /> {selected.province}</span>
                    </div>
                    <div className="call-actions">
                      <button className="primary-button">
                        <Video size={16} /> Start video call
                      </button>
                      <button className="secondary-button">
                        <PlayCircle size={16} /> Open script
                      </button>
                    </div>
                  </div>

                  {selectedVehicle && (
                    <div className="call-vehicle">
                      <img src={selectedVehicle.imageUrl} alt={selectedVehicle.name} />
                      <div>
                        <small>Vehicle on claim</small>
                        <strong>{selectedVehicle.name}</strong>
                        <span>{selectedVehicle.priceLabel}</span>
                      </div>
                    </div>
                  )}
                </section>

                <section className="call-context">
                  <div className="panel risk-card">
                    <div className="panel-head">
                      <div className="panel-head-left">
                        <span className="panel-head-icon"><Activity size={16} /></span>
                        <h2>AI Risk Score</h2>
                      </div>
                    </div>
                    <RiskGauge score={selectedAiResult?.confidenceScore ?? (selected.confidenceScore ?? 0)} />
                    <div className="risk-flags">
                      {(selectedAiResult?.mismatchFlags ?? []).slice(0, 3).map((flag) => (
                        <div className="risk-flag" key={flag}>
                          <ShieldAlert size={14} />
                          <span>{flag}</span>
                        </div>
                      ))}
                      {(!selectedAiResult || selectedAiResult.mismatchFlags.length === 0) && (
                        <div className="risk-flag clean">
                          <CheckCircle2 size={14} />
                          <span>No AI flags raised on this case</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="panel record-card" id="record">
                    <div className="panel-head">
                      <div className="panel-head-left">
                        <span className="panel-head-icon"><FileText size={16} /></span>
                        <h2>Applicant Record</h2>
                      </div>
                      <span className={selected.category === "B" ? "risk-pill high" : "risk-pill"}>
                        Category {selected.category ?? "Pending"}
                      </span>
                    </div>
                    <div className="record-grid">
                      <Record label="Vehicle OEM" value={selected.oem} />
                      <Record label="Frame number" value={selected.frameNumber} />
                      <Record label="Chassis number" value={selected.chassisNumber} />
                      <Record label="Motor number" value={selected.motorNumber} />
                      <Record label="Registration" value={selected.registrationStatus} status={selected.registrationStatus === "registered" ? "good" : selected.registrationStatus === "pending" ? "warn" : "bad"} />
                      <Record label="Delivery" value={selected.deliveryStatus} status={selected.deliveryStatus === "delivered" ? "good" : selected.deliveryStatus === "not_confirmed" ? "warn" : "bad"} />
                    </div>
                  </div>
                </section>

                <section className="panel script-card" id="script">
                  <div className="script-head">
                    <div>
                      <p className="script-eyebrow"><Sparkles size={12} /> Suggested script</p>
                      <h3>Call Script — 7-point RFP check</h3>
                    </div>
                  </div>
                  <p>
                    Confirm applicant identity, ask applicant to show the vehicle, read frame/chassis/motor numbers,
                    confirm delivery, registration, hidden charges, and physical possession.
                  </p>
                  <div className="script-tags">
                    <span>Verify CNIC face</span>
                    <span>Show frame & chassis</span>
                    <span>Read motor number</span>
                    <span>Confirm hidden charges</span>
                    <span>Physical possession</span>
                  </div>
                </section>

                <section className="panel checklist-card" id="checklist">
                  <div className="panel-head">
                    <div className="panel-head-left">
                      <span className="panel-head-icon"><ClipboardCheck size={16} /></span>
                      <h2>Evidence Checklist</h2>
                    </div>
                    <span className="checklist-progress">
                      <strong>{checklistProgress}%</strong> complete
                    </span>
                  </div>
                  <div className="checklist-track">
                    <span style={{ width: `${checklistProgress}%` }} />
                  </div>
                  <div className="checklist" id="checklist-grid">
                    {checklistItems.map((item) => (
                      <label key={item} className={checkedItems[item] ? "checked" : ""}>
                        <input
                          type="checkbox"
                          checked={checkedItems[item] ?? false}
                          onChange={() => toggle(item)}
                        />
                        <span>{item}</span>
                        {checkedItems[item] && <CheckCircle2 size={14} className="check-icon" />}
                      </label>
                    ))}
                  </div>
                </section>

                <section className="panel decision-card">
                  <div className="panel-head">
                    <div className="panel-head-left">
                      <span className="panel-head-icon"><Zap size={16} /></span>
                      <h2>Submit Outcome</h2>
                    </div>
                    <span className="panel-head-hint">Routes case to the next workflow lane</span>
                  </div>
                  <div className="decision-actions">
                    <button className="primary-button" onClick={() => finish("verified")}>
                      <CheckCircle2 size={16} /> Verified
                    </button>
                    <button className="secondary-button" onClick={() => finish("manual_review")}>
                      Manual review
                    </button>
                    <button className="secondary-button" onClick={() => finish("physical_verification")}>
                      Physical verification
                    </button>
                    <button className="danger-button" onClick={() => finish("not_recommended")}>
                      <ShieldAlert size={16} /> Not recommended
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <section className="panel">
                <div className="empty-state">
                  <PhoneCall size={36} />
                  <strong>No active applicant selected</strong>
                  <span>Generate assignments from the admin sampling screen to begin agent calls.</span>
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ============================================================
   AGENT HERO
   ============================================================ */

function AgentHero({ completed, assigned, successRate }: { completed: number; assigned: number; successRate: number }) {
  const target = 24;
  const progressPct = Math.min(100, Math.round((completed / target) * 100));
  return (
    <section className="agent-hero">
      <div className="agent-hero-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <div className="agent-hero-left">
        <p className="eyebrow agent-hero-eyebrow">
          <span className="pulse-dot" />
          Shift active · Wolfiz Pakistan
        </p>
        <h2>Good day, <span className="grad-text">Verification Officer</span></h2>
        <p className="agent-hero-sub">
          {assigned} {assigned === 1 ? "call" : "calls"} in your queue. Daily target {target}.
          {completed ? ` You've completed ${completed}.` : " Let's get started."}
        </p>
        <div className="agent-hero-stats">
          <div>
            <small>Completed</small>
            <strong>{completed}/{target}</strong>
          </div>
          <div className="agent-hero-divider" />
          <div>
            <small>Success rate</small>
            <strong>{successRate}%</strong>
          </div>
          <div className="agent-hero-divider" />
          <div>
            <small>Streak</small>
            <strong>3 days</strong>
          </div>
        </div>
      </div>
      <div className="agent-hero-right">
        <div className="hero-progress">
          <svg viewBox="0 0 140 140" width="140" height="140">
            <defs>
              <linearGradient id="heroProg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="58" stroke="rgba(255,255,255,0.12)" strokeWidth="12" fill="none" />
            <circle
              cx="70"
              cy="70"
              r="58"
              stroke="url(#heroProg)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={(2 * Math.PI * 58) * (1 - progressPct / 100)}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </svg>
          <div className="hero-progress-num">
            <strong>{progressPct}%</strong>
            <span>of daily</span>
          </div>
        </div>
        <div className="hero-rating">
          <Star size={14} fill="#fbbf24" stroke="none" />
          <Star size={14} fill="#fbbf24" stroke="none" />
          <Star size={14} fill="#fbbf24" stroke="none" />
          <Star size={14} fill="#fbbf24" stroke="none" />
          <Star size={14} fill="#fbbf24" stroke="none" />
          <span>4.9 QA rating</span>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AI RISK GAUGE
   ============================================================ */

function RiskGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone = clamped >= 78 ? "good" : clamped >= 60 ? "warn" : "bad";
  const label = clamped >= 78 ? "Low risk" : clamped >= 60 ? "Medium risk" : "High risk";

  return (
    <div className="risk-gauge">
      <div className="risk-gauge-track">
        <div className={`risk-gauge-fill ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="risk-gauge-meta">
        <div>
          <span>AI confidence</span>
          <strong>{clamped}</strong>
        </div>
        <div className={`risk-gauge-pill ${tone}`}>{label}</div>
      </div>
    </div>
  );
}

/* ============================================================
   Smaller components
   ============================================================ */

function Record({ label, value, status }: { label: string; value: string; status?: "good" | "warn" | "bad" }) {
  return (
    <div className={status ? `record-cell ${status}` : "record-cell"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
