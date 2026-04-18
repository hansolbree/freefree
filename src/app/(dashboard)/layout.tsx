import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-mint-pink">
      <Sidebar />
      <Header />
      <main className="md:pl-64">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
