"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  CarFront,
  ClipboardCheck,
  Database,
  FileText,
  Headphones,
  LogOut,
  Settings,
  Shuffle,
  Users,
} from "lucide-react";

type NavGroup = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const adminNav: NavGroup[] = [
  { title: "Overview", href: "/admin", icon: <BarChart3 size={18} /> },
  {
    title: "Data Intake",
    href: "/admin/import",
    icon: <Database size={18} />,
  },
  {
    title: "AI Verification",
    href: "/admin/analysis",
    icon: <Bot size={18} />,
  },
  {
    title: "Sampling",
    href: "/admin/sampling",
    icon: <Shuffle size={18} />,
  },
  {
    title: "Verification Ops",
    href: "/admin/verification",
    icon: <Headphones size={18} />,
  },
  {
    title: "Decisions",
    href: "/admin/decisions",
    icon: <ClipboardCheck size={18} />,
  },
  {
    title: "Vehicles",
    href: "/admin/vehicles",
    icon: <CarFront size={18} />,
  },
  {
    title: "Agents",
    href: "/admin/agents",
    icon: <Users size={18} />,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: <FileText size={18} />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings size={18} />,
  },
];

const agentNav: NavGroup[] = [
  { title: "My Dashboard", href: "/agent", icon: <BarChart3 size={18} /> },
  { title: "Assigned Calls", href: "/agent#assigned", icon: <Headphones size={18} /> },
  { title: "Active Verification", href: "/agent#active", icon: <ClipboardCheck size={18} /> },
  { title: "Completed Today", href: "/agent#completed", icon: <FileText size={18} /> },
  { title: "Retry Queue", href: "/agent#retry", icon: <Shuffle size={18} /> },
  { title: "Applicant Record", href: "/agent#record", icon: <Database size={18} /> },
  { title: "Call Script", href: "/agent#script", icon: <Bot size={18} /> },
  { title: "Evidence Checklist", href: "/agent#checklist", icon: <ClipboardCheck size={18} /> },
];

export function DashboardShell({
  role,
  title,
  subtitle,
  children,
}: {
  role: "admin" | "agent";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "admin" ? adminNav : agentNav;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href={role === "admin" ? "/admin" : "/agent"}>
          <img src="https://pave.gov.pk/landing/img/pave_gov.png" alt="PAVE" />
          <span>Verification</span>
        </Link>
        <nav className="nav-list">
          {nav.map((group) => {
            const active = pathname === group.href || (group.href !== "/admin" && pathname.startsWith(group.href));
            return (
              <div className="nav-group" key={group.title}>
                <Link href={group.href} className={active ? "nav-link active" : "nav-link"}>
                  {group.icon}
                  <span>{group.title}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{role === "admin" ? "Admin Command Centre" : "Verification Officer Workspace"}</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="ghost-button" onClick={() => router.push("/")}>
            <LogOut size={18} />
            Switch role
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
