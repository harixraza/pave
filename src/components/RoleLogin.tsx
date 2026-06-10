"use client";

import { ArrowRight, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { initializeState, setRole } from "@/lib/store";
import { useEffect } from "react";

export function RoleLogin() {
  const router = useRouter();

  useEffect(() => {
    initializeState();
  }, []);

  function login(role: "admin" | "agent") {
    setRole(role);
    router.push(role === "admin" ? "/admin" : "/agent");
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <img src="https://pave.gov.pk/landing/img/pave_gov.png" alt="PAVE" className="login-logo" />
        <div>
          <p className="eyebrow">Wolfiz Verification Console</p>
          <h1>PAVE applicant claim verification dashboard</h1>
          <p className="login-copy">
            Static browser-storage prototype for importing PAVE claims, running AI analysis, sampling cases,
            assigning video calls, routing decisions, and producing audit reports.
          </p>
        </div>
        <div className="role-grid">
          <button className="role-card" onClick={() => login("admin")}>
            <ShieldCheck size={30} />
            <span>
              <strong>Login as Admin</strong>
              <small>Import, analyze, sample, monitor agents, and review reports.</small>
            </span>
            <ArrowRight size={20} />
          </button>
          <button className="role-card" onClick={() => login("agent")}>
            <UserRoundCheck size={30} />
            <span>
              <strong>Login as Agent</strong>
              <small>Open assigned calls, complete RFP checklist, and submit outcomes.</small>
            </span>
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
      <section className="login-visual" aria-label="PAVE electric vehicle program">
        <img src="https://pave.gov.pk/landing/img/hero-section2.png" alt="" />
      </section>
    </main>
  );
}
