"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, PhoneCall, RotateCcw, ShieldAlert } from "lucide-react";
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

  useEffect(() => {
    initializeState();
    const loaded = getState();
    setState(loaded);
    setSelectedClaimId(loaded.assignments[0]?.claimId ?? "");
  }, []);

  const selected = useMemo(() => state.claims.find((claim) => claim.id === selectedClaimId), [state.claims, selectedClaimId]);
  const assignedClaims = state.assignments
    .filter((assignment) => assignment.status !== "completed")
    .map((assignment) => state.claims.find((claim) => claim.id === assignment.claimId))
    .filter(Boolean) as Claim[];
  const completed = state.verificationSessions.filter((session) => session.status === "completed").length;

  function finish(outcome: "verified" | "manual_review" | "physical_verification" | "not_recommended") {
    if (!selectedClaimId) return;
    const next = completeVerification(selectedClaimId, outcome);
    setState(next);
    const nextClaim = next.assignments.find((assignment) => assignment.status !== "completed")?.claimId ?? "";
    setSelectedClaimId(nextClaim);
  }

  return (
    <DashboardShell
      role="agent"
      title="Agent Video Verification Dashboard"
      subtitle="Open assigned sampled applicants, follow the seven-point RFP checklist, and submit a dummy AI-assisted outcome."
    >
      <div className="stack">
        <div className="metric-grid">
          <Metric label="Assigned queue" value={assignedClaims.length} icon={<PhoneCall size={20} />} />
          <Metric label="Completed" value={completed} icon={<CheckCircle2 size={20} />} />
          <Metric label="Retry queue" value={state.verificationSessions.filter((session) => session.status === "missed").length} icon={<RotateCcw size={20} />} />
          <Metric label="Checklist points" value={7} icon={<ClipboardCheck size={20} />} />
        </div>
        <div className="agent-workspace">
          <section className="panel queue-panel" id="assigned">
            <h2>Assigned calls</h2>
            {assignedClaims.length === 0 && <p className="muted">No assigned calls yet. Admin must import, analyze, classify, and sample first.</p>}
            {assignedClaims.map((claim) => (
              <button
                className={claim.id === selectedClaimId ? "queue-item active" : "queue-item"}
                key={claim.id}
                onClick={() => setSelectedClaimId(claim.id)}
              >
                <strong>{claim.id}</strong>
                <span>{claim.applicantName}</span>
                <small>{claim.province} / {claim.oem}</small>
              </button>
            ))}
          </section>
          <section className="panel verification-panel" id="active">
            {selected ? (
              <>
                <div className="panel-header">
                  <div>
                    <h2>{selected.applicantName}</h2>
                    <p>{selected.id} / CNIC {selected.cnic}</p>
                  </div>
                  <span className={selected.category === "B" ? "risk-pill high" : "risk-pill"}>Category {selected.category ?? "Pending"}</span>
                </div>
                <div className="record-grid" id="record">
                  <Record label="Vehicle OEM" value={selected.oem} />
                  <Record label="Frame number" value={selected.frameNumber} />
                  <Record label="Chassis number" value={selected.chassisNumber} />
                  <Record label="Motor number" value={selected.motorNumber} />
                  <Record label="Registration" value={selected.registrationStatus} />
                  <Record label="Delivery" value={selected.deliveryStatus} />
                </div>
                <div className="call-script" id="script">
                  <h3>Call script</h3>
                  <p>
                    Confirm applicant identity, ask applicant to show the vehicle, read frame/chassis/motor numbers,
                    confirm delivery, registration, hidden charges, and physical possession.
                  </p>
                </div>
                <div className="checklist" id="checklist">
                  {checklistItems.map((item) => (
                    <label key={item}>
                      <input type="checkbox" defaultChecked />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                <div className="decision-actions">
                  <button className="primary-button" onClick={() => finish("verified")}>Verified</button>
                  <button className="secondary-button" onClick={() => finish("manual_review")}>Manual review</button>
                  <button className="secondary-button" onClick={() => finish("physical_verification")}>Physical verification</button>
                  <button className="danger-button" onClick={() => finish("not_recommended")}>
                    <ShieldAlert size={18} />
                    Not recommended
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <PhoneCall size={36} />
                <strong>No active applicant selected</strong>
                <span>Generate assignments from the admin sampling screen to begin agent calls.</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
