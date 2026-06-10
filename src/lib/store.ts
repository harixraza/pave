"use client";

import vehicles from "@/data/vehicles.json";
import type {
  Agent,
  AiResult,
  Assignment,
  AuditLog,
  Claim,
  Decision,
  ImportBatch,
  PaveState,
  VerificationSession,
  Vehicle,
} from "./types";

const keys = {
  authRole: "pave.authRole",
  vehicles: "pave.vehicles",
  claims: "pave.claims",
  importBatches: "pave.importBatches",
  agents: "pave.agents",
  assignments: "pave.assignments",
  verificationSessions: "pave.verificationSessions",
  aiResults: "pave.aiResults",
  decisions: "pave.decisions",
  auditLogs: "pave.auditLogs",
} as const;

const vehicleData = vehicles as Vehicle[];

export const checklistItems = [
  "Applicant identity confirmed",
  "Vehicle delivery confirmed",
  "Frame and chassis number shown",
  "Motor number shown",
  "Registration status confirmed",
  "No hidden charges confirmed",
  "Physical vehicle possession confirmed",
];

const names = [
  "Ayesha Khan",
  "Bilal Ahmed",
  "Hina Malik",
  "Usman Raza",
  "Sadia Noor",
  "Farhan Ali",
  "Maham Tariq",
  "Zain Qureshi",
  "Nimra Shah",
  "Hamza Iqbal",
  "Rabia Aslam",
  "Danish Butt",
];

const provinces = ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad", "Gilgit-Baltistan", "AJK"];

export function inferOem(name: string): string {
  const upper = name.toUpperCase();
  if (name.startsWith("E-Turbo")) return "E-Turbo";
  if (name.startsWith("Yadea") || name.startsWith("YADEA")) return "Yadea";
  if (name.startsWith("Road Prince")) return "Road Prince";
  if (name.startsWith("United")) return "United";
  if (upper.includes("ECODOST")) return "EcoDost";
  if (name.startsWith("Metro")) return "Metro";
  if (name.startsWith("MS JAGUAR")) return "MS Jaguar";
  if (name.startsWith("JE") || name.startsWith("PE")) return "Jolta/PE";
  if (name.startsWith("OKLA")) return "OKLA";
  if (name.startsWith("ZF") || name.startsWith("ZFY")) return "Zongshen/ZF";
  return "Unassigned OEM";
}

function now() {
  return new Date().toISOString();
}

function readArray<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function writeArray<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function seedAgents(): Agent[] {
  return [
    { id: "agent-1", name: "Sara Verification Officer", status: "available", assignedCases: 0, completedToday: 8, averageCallMinutes: 11 },
    { id: "agent-2", name: "Imran Case Officer", status: "on_call", assignedCases: 0, completedToday: 12, averageCallMinutes: 9 },
    { id: "agent-3", name: "Noor QA Caller", status: "available", assignedCases: 0, completedToday: 6, averageCallMinutes: 13 },
    { id: "agent-4", name: "Taimoor Field Escalation", status: "break", assignedCases: 0, completedToday: 4, averageCallMinutes: 15 },
  ];
}

export function createClaims(count = 72): Claim[] {
  return Array.from({ length: count }, (_, index) => {
    const vehicle = vehicleData[index % vehicleData.length];
    const risky = index % 6 === 0 || index % 11 === 0;
    return {
      id: `PAVE-${String(index + 1).padStart(6, "0")}`,
      applicantName: names[index % names.length],
      cnic: `42101-${String(1000000 + index * 137).slice(0, 7)}-${index % 9}`,
      province: provinces[index % provinces.length],
      oem: vehicle.oem || inferOem(vehicle.name),
      vehicleId: vehicle.id,
      frameNumber: `FR-${vehicle.id.slice(0, 4).toUpperCase()}-${10000 + index}`,
      chassisNumber: `CH-${10000 + index}-${index % 97}`,
      motorNumber: `MT-${70000 + index * 3}`,
      registrationStatus: risky && index % 2 === 0 ? "missing" : index % 5 === 0 ? "pending" : "registered",
      deliveryStatus: risky && index % 3 === 0 ? "missing_docs" : index % 7 === 0 ? "not_confirmed" : "delivered",
    };
  });
}

export function getState(): PaveState {
  const baseAgents = readArray<Agent>(keys.agents, seedAgents());
  const assignments = readArray<Assignment>(keys.assignments, []);
  const agentCounts = baseAgents.map((agent) => ({
    ...agent,
    assignedCases: assignments.filter((assignment) => assignment.agentId === agent.id && assignment.status !== "completed").length,
  }));

  return {
    vehicles: readArray<Vehicle>(keys.vehicles, vehicleData),
    claims: readArray<Claim>(keys.claims, []),
    importBatches: readArray<ImportBatch>(keys.importBatches, []),
    agents: agentCounts,
    assignments,
    verificationSessions: readArray<VerificationSession>(keys.verificationSessions, []),
    aiResults: readArray<AiResult>(keys.aiResults, []),
    decisions: readArray<Decision>(keys.decisions, []),
    auditLogs: readArray<AuditLog>(keys.auditLogs, []),
  };
}

export function initializeState() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(keys.vehicles)) writeArray(keys.vehicles, vehicleData);
  if (!window.localStorage.getItem(keys.agents)) writeArray(keys.agents, seedAgents());
  if (!window.localStorage.getItem(keys.auditLogs)) {
    writeArray<AuditLog>(keys.auditLogs, [{ id: "log-seed", at: now(), actor: "System", action: "Seeded PAVE prototype storage" }]);
  }
}

export function setRole(role: "admin" | "agent") {
  window.localStorage.setItem(keys.authRole, role);
}

function log(action: string, actor = "System") {
  const logs = readArray<AuditLog>(keys.auditLogs, []);
  writeArray(keys.auditLogs, [{ id: `log-${Date.now()}`, at: now(), actor, action }, ...logs].slice(0, 80));
}

export function resetStorage() {
  Object.values(keys).forEach((key) => window.localStorage.removeItem(key));
  initializeState();
}

export function importSampleClaims() {
  const existing = readArray<Claim>(keys.claims, []);
  if (existing.length > 0) {
    log("Skipped import because sample claims already exist", "Admin");
    return getState();
  }
  const claims = createClaims();
  const batch: ImportBatch = {
    id: `batch-${Date.now()}`,
    fileName: "pave-portal-sample-claims.csv",
    importedAt: now(),
    records: claims.length,
    source: "sample_csv",
  };
  writeArray(keys.claims, claims);
  writeArray(keys.importBatches, [batch, ...readArray<ImportBatch>(keys.importBatches, [])]);
  log(`Imported ${claims.length} sample applicant claims`, "Admin");
  return getState();
}

export function runAiAnalysis() {
  const claims = readArray<Claim>(keys.claims, []);
  const results = claims.map((claim, index) => {
    const mismatchFlags = [
      claim.registrationStatus === "missing" ? "Registration certificate absent" : "",
      claim.deliveryStatus === "missing_docs" ? "Delivery order missing" : "",
      index % 13 === 0 ? "Same CNIC pattern detected in another batch" : "",
      index % 17 === 0 ? "Dealer delivery timing anomaly" : "",
    ].filter(Boolean);
    const duplicateFlags = index % 13 === 0 ? ["CNIC review required"] : [];
    const confidenceScore = Math.max(42, 98 - mismatchFlags.length * 14 - (index % 7));
    return {
      claimId: claim.id,
      confidenceScore,
      mismatchFlags,
      duplicateFlags,
      analyzedAt: now(),
    };
  });
  writeArray(keys.aiResults, results);
  log(`AI analysis completed for ${claims.length} records`, "AI Verification Engine");
  return getState();
}

export function classifyClaims() {
  const claims = readArray<Claim>(keys.claims, []);
  const results = readArray<AiResult>(keys.aiResults, []);
  const updated = claims.map((claim) => {
    const result = results.find((item) => item.claimId === claim.id);
    const score = result?.confidenceScore ?? 85;
    return {
      ...claim,
      confidenceScore: score,
      category: score >= 78 && claim.registrationStatus !== "missing" && claim.deliveryStatus !== "missing_docs" ? "A" : "B",
    } satisfies Claim;
  });
  writeArray(keys.claims, updated);
  log("Classified records into Category A and Category B", "AI Verification Engine");
  return getState();
}

export function createSampleAndAssignments() {
  const claims = readArray<Claim>(keys.claims, []);
  const agents = readArray<Agent>(keys.agents, seedAgents());
  const grouped = new Map<string, Claim[]>();
  claims.forEach((claim) => {
    const key = `${claim.province}-${claim.oem}-${claim.category ?? "unclassified"}`;
    grouped.set(key, [...(grouped.get(key) ?? []), claim]);
  });

  const sampledIds = new Set<string>();
  grouped.forEach((items) => {
    const sorted = [...items].sort((a, b) => (a.confidenceScore ?? 100) - (b.confidenceScore ?? 100));
    sorted.slice(0, Math.max(1, Math.ceil(items.length * 0.05))).forEach((claim) => sampledIds.add(claim.id));
  });

  const sampledClaims = claims.map((claim) => ({ ...claim, sampled: sampledIds.has(claim.id) }));
  const assignments: Assignment[] = sampledClaims
    .filter((claim) => claim.sampled)
    .map((claim, index) => ({
      id: `assign-${claim.id}`,
      claimId: claim.id,
      agentId: agents[index % agents.length].id,
      status: "queued",
    }));
  const sessions: VerificationSession[] = assignments.map((assignment) => ({
    id: `session-${assignment.claimId}`,
    claimId: assignment.claimId,
    agentId: assignment.agentId,
    status: "queued",
    retryCount: 0,
    checklist: Object.fromEntries(checklistItems.map((item) => [item, false])),
  }));

  writeArray(keys.claims, sampledClaims);
  writeArray(keys.assignments, assignments);
  writeArray(keys.verificationSessions, sessions);
  log(`Selected ${assignments.length} sampled cases and assigned them to agents`, "Sampling Engine");
  return getState();
}

export function completeVerification(claimId: string, outcome: "verified" | "manual_review" | "physical_verification" | "not_recommended") {
  const sessions = readArray<VerificationSession>(keys.verificationSessions, []);
  const assignments = readArray<Assignment>(keys.assignments, []);
  const decisions = readArray<Decision>(keys.decisions, []);
  const session = sessions.find((item) => item.claimId === claimId);

  writeArray(
    keys.verificationSessions,
    sessions.map((item) =>
      item.claimId === claimId
        ? {
            ...item,
            status: "completed",
            completedAt: now(),
            checklist: Object.fromEntries(checklistItems.map((check) => [check, true])),
          }
        : item,
    ),
  );
  writeArray(keys.assignments, assignments.map((item) => (item.claimId === claimId ? { ...item, status: "completed" } : item)));
  writeArray<Decision>(keys.decisions, [
    {
      id: `decision-${claimId}`,
      claimId,
      route: outcome,
      label:
        outcome === "verified"
          ? "Verified and Recommended"
          : outcome === "manual_review"
            ? "Manual Review"
            : outcome === "physical_verification"
              ? "Physical Verification"
              : "Not Verified and Not Recommended",
      createdAt: now(),
      supervisorSignoff: outcome === "not_recommended",
    },
    ...decisions.filter((decision) => decision.claimId !== claimId),
  ]);
  log(`Completed video verification for ${claimId} with route ${outcome}`, session?.agentId ?? "Agent");
  return getState();
}
