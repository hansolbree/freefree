import { createClient } from "@/lib/supabase/server";
import { ClientsPageClient } from "./page-client";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let clients: {
    id: string;
    name: string;
    center_id: string;
    phone: string | null;
    is_active: boolean;
    centers: { name: string } | null;
  }[] = [];

  let userCenters: {
    center_id: string;
    color: string;
    centers: { id: string; name: string } | null;
  }[] = [];

  if (user) {
    const [clientsRes, centersRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, center_id, phone, is_active, centers(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_centers")
        .select("center_id, color, centers(id, name)")
        .eq("user_id", user.id)
        .eq("is_active", true),
    ]);
    clients = (clientsRes.data as typeof clients) ?? [];
    userCenters = (centersRes.data as typeof userCenters) ?? [];
  }

  return <ClientsPageClient clients={clients} userCenters={userCenters} />;
}
