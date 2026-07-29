import { NextResponse } from "next/server";
import { drainEvents } from "@/server/events/drain";

/**
 * Pensado para ser invocado por un cron externo (no por el navegador ni por
 * ninguna Server Action). Protegido por un secreto compartido — sin
 * INTERNAL_CRON_SECRET configurado, rechaza todo.
 */
export async function POST(request: Request) {
  const secret = process.env.INTERNAL_CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await drainEvents();
  return NextResponse.json(result);
}
