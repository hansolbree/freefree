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

  const [clientRes, sessionsRes, userCentersRes, clientTestsRes] =
    await Promise.all([
      supabase
        .from("clients")
        .select("*, centers(name)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("sessions")
        .select("*")
        .eq("client_id", id)
        .eq("user_id", user.id)
        .order("session_number", { ascending: false }),
      supabase
        .from("user_centers")
        .select("center_id, color, centers(id, name)")
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("client_tests")
        .select("*")
        .eq("client_id", id)
        .eq("user_id", user.id)
        .order("test_date", { ascending: false }),
    ]);

  const client = clientRes.data;
  const sessions = sessionsRes.data;
  const userCenters = userCentersRes.data;
  const clientTests = clientTestsRes.data;

  if (!client) notFound();

  return (
    <ClientDetailClient
      client={client}
      sessions={sessions ?? []}
      userCenters={userCenters ?? []}
      clientTests={clientTests ?? []}
    />
  );
}
