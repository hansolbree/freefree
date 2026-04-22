import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { SettingsClient } from "./page-client";

export default async function SettingsPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  let profile: { name: string | null; phone: string | null; email: string } = {
    name: null,
    phone: null,
    email: user?.email ?? "",
  };

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name, phone, email")
      .eq("id", user.id)
      .single();
    if (data) profile = data;
  }

  return <SettingsClient profile={profile} />;
}
