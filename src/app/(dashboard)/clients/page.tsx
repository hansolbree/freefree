import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { ClientsPageClient } from "./page-client";

export default async function ClientsPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  let clients: {
    id: string;
    name: string;
    center_id: string;
    phone: string | null;
    email: string | null;
    gender: string | null;
    occupation: string | null;
    birth_date: string | null;
    notes: string | null;
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
        .select("id, name, center_id, phone, email, gender, occupation, birth_date, notes, is_active, centers(name)")
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
