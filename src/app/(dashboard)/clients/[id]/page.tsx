import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientDetailClient } from "./page-client";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("*, centers(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!client) notFound();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", id)
    .eq("user_id", user.id)
    .order("session_number", { ascending: false });

  const { data: userCenters } = await supabase
    .from("user_centers")
    .select("center_id, color, centers(id, name)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  return (
    <ClientDetailClient
      client={client}
      sessions={sessions ?? []}
      userCenters={userCenters ?? []}
    />
  );
}
