import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { AdminPanel } from "@/components/admin/AdminPanel";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return (
    <div>
      <h1 className="font-display text-2xl text-brass-light mb-4">The House</h1>
      <AdminPanel />
    </div>
  );
}
