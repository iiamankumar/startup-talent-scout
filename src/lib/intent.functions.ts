import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Applies the account type (engineer vs founder) chosen at signup.
// Only allowed while the account is still "fresh": no engineer profile and
// no hire requests yet. Prevents switching sides on an established account.
export const applySignupIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { intent: "engineer" | "founder" }) => {
    if (data?.intent !== "engineer" && data?.intent !== "founder") {
      throw new Error("Invalid intent");
    }
    return { intent: data.intent };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const current = (roles ?? []).map((r) => r.role as string);
    if (current.includes("admin")) return { ok: false, reason: "admin" };
    if (current.includes(data.intent)) return { ok: true, changed: false };

    const [{ count: engCount }, { count: reqCount }] = await Promise.all([
      supabaseAdmin.from("engineers").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin.from("hire_requests").select("id", { count: "exact", head: true }).eq("founder_id", userId),
    ]);
    if ((engCount ?? 0) > 0 || (reqCount ?? 0) > 0) {
      return { ok: false, reason: "account_in_use" };
    }

    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .in("role", ["engineer", "founder"]);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.intent });
    if (error) throw new Error(error.message);

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { intent: data.intent },
    });

    return { ok: true, changed: true };
  });
