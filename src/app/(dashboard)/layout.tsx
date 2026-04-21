import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <div className="min-h-screen bg-gradient-mint-pink">
      <Sidebar isAdmin={isAdmin} />
      <Header isAdmin={isAdmin} />
      <main className="md:pl-64">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
