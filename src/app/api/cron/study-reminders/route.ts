import { NextResponse } from "next/server";

import { sendStudyReminders } from "@/server/services/reminder-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Chamada diaria pelo cron da Vercel (vercel.json). A Vercel envia "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({ sent: await sendStudyReminders() });
}
