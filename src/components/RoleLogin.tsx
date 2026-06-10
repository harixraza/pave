"use client";

import { ArrowRight, Bot, CheckCircle2, MapPin, ShieldCheck, Sparkles, UserRoundCheck, Zap } from "lucide-react";
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
        <p className="login-foot">
          <Sparkles size={14} />
          <span>Prototype build — data stays in your browser</span>
        </p>
      </section>

      <section className="login-visual" aria-label="PAVE electric vehicle program">
        <div className="visual-mesh" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="grid-overlay" />
        </div>

        <div className="visual-frame">
          <div className="visual-eyebrow">
            <span className="pulse-dot" />
            PAVE Program · Live
          </div>

          <h2 className="visual-headline">
            Verifying <span className="grad-text">1.3M+ EV</span> applicants across Pakistan.
          </h2>

          <p className="visual-sub">
            AI-driven intake, stratified sampling, and video verification — built for the 95% confidence target.
          </p>

          <div className="visual-stats">
            <div className="stat-card">
              <div className="stat-icon"><Zap size={18} /></div>
              <strong>1,314,726</strong>
              <span>Applicant population</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle2 size={18} /></div>
              <strong>65,736</strong>
              <span>Sample target · 95%</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><MapPin size={18} /></div>
              <strong>7</strong>
              <span>Provinces covered</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Bot size={18} /></div>
              <strong>7-pt</strong>
              <span>RFP checklist</span>
            </div>
          </div>

          <div className="visual-marquee" aria-hidden="true">
            <div className="marquee-track">
              {["Yadea", "E-Turbo", "Road Prince", "United", "Metro", "Jolta", "OKLA", "Zongshen", "EcoDost"].map((oem) => (
                <span key={oem}>{oem}</span>
              ))}
              {["Yadea", "E-Turbo", "Road Prince", "United", "Metro", "Jolta", "OKLA", "Zongshen", "EcoDost"].map((oem) => (
                <span key={`${oem}-dup`}>{oem}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
