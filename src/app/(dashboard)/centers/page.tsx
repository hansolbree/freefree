import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { CenterCard } from "@/components/centers/center-card";
import { CenterPageClient } from "./page-client";

export default async function CentersPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  let centers: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    notes: string | null;
    user_centers: { color: string }[];
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from("centers")
      .select("*, user_centers(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    centers = (data as typeof centers) ?? [];
  }

  return <CenterPageClient centers={centers} />;
}
