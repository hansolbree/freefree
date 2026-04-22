import { cache } from "react";
import { createClient } from "./server";

// 같은 요청 트리 안에서 여러 서버 컴포넌트가 호출해도 Supabase에 한 번만 질의
// (layout + page + nested layout 등 합쳐서 dedupe)
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
