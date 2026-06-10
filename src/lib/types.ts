export type VehicleCategory = "two_wheeler" | "three_wheeler";

export type Vehicle = {
  id: string;
  category: VehicleCategory;
  name: string;
  pricePkr: number;
  priceLabel: string;
  imageUrl: string;
  oem: string;
};

export type Claim = {
  id: string;
  applicantName: string;
  cnic: string;
  province: string;
  oem: string;
  vehicleId: string;
  frameNumber: string;
  chassisNumber: string;
  motorNumber: string;
  registrationStatus: "pending" | "registered" | "missing";
  deliveryStatus: "delivered" | "not_confirmed" | "missing_docs";
  category?: "A" | "B";
  confidenceScore?: number;
  sampled?: boolean;
};

export type Agent = {
  id: string;
  name: string;
  status: "available" | "on_call" | "break" | "offline";
  assignedCases: number;
  completedToday: number;
  averageCallMinutes: number;
};

export type ImportBatch = {
  id: string;
  fileName: string;
  importedAt: string;
  records: number;
  source: "sample_csv" | "portal_sync";
};

export type AiResult = {
  claimId: string;
  confidenceScore: number;
  mismatchFlags: string[];
  duplicateFlags: string[];
  analyzedAt: string;
};

export type Assignment = {
  id: string;
  claimId: string;
  agentId: string;
  status: "queued" | "active" | "completed" | "retry";
};

export type VerificationSession = {
  id: string;
  claimId: string;
  agentId: string;
  status: "queued" | "active" | "completed" | "missed";
  checklist: Record<string, boolean>;
  retryCount: number;
  completedAt?: string;
};

export type Decision = {
  id: string;
  claimId: string;
  route: "verified" | "manual_review" | "physical_verification" | "not_recommended";
  label: string;
  createdAt: string;
  supervisorSignoff?: boolean;
};

export type AuditLog = {
  id: string;
  at: string;
  actor: string;
  action: string;
};

export type PaveState = {
  vehicles: Vehicle[];
  claims: Claim[];
  importBatches: ImportBatch[];
  agents: Agent[];
  assignments: Assignment[];
  verificationSessions: VerificationSession[];
  aiResults: AiResult[];
  decisions: Decision[];
  auditLogs: AuditLog[];
};
