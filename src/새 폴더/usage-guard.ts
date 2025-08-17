import { db } from "./db";
export const DAILY_LIMIT = { free: 20, pro: 9999 }; // 예시

export async function guardCompile(userId: string) {
  const plan =
    (await db.one("select plan from profiles where id=$1", [userId])).plan ||
    "free";
  const { count } = await db.one(
    "select count(*)::int as count from usage_events where user_id=$1 and event='compile' and created_at::date = now()::date",
    [userId]
  );
  if (count >= DAILY_LIMIT[plan]) {
    return new Response(JSON.stringify({ error: "quota_exceeded" }), {
      status: 402,
    });
  }
  return null; // 통과
}
