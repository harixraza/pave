import { AdminDashboard } from "@/components/AdminDashboard";

type AdminPageProps = {
  params: Promise<{ section?: string[] }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { section } = await params;
  return <AdminDashboard section={section?.[0] ?? "overview"} />;
}
