// API favoris : stockage côté Supabase, identifié par un client_id anonyme.
//
// GET    /api/favorites?client_id=xxx          → { jobs, appliedIds }
// POST   /api/favorites { client_id, job_id, applied? }  → ajoute/update un favori
// DELETE /api/favorites { client_id, job_id }  → retire un favori

import { NextResponse } from "next/server";
import { sortByScore } from "@/lib/score";
import { supabaseAdmin } from "@/lib/supabase";
import type { JobRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidClientId(v: unknown): v is string {
  return typeof v === "string" && v.length >= 8 && v.length <= 64;
}

function isValidUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  if (!isValidClientId(clientId)) {
    return NextResponse.json({ error: "invalid client_id" }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const { data: favs, error: e1 } = await supabase
    .from("favorites")
    .select("job_id, applied")
    .eq("client_id", clientId);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const rows = favs || [];
  const ids = rows.map((f) => f.job_id as string);
  const appliedIds = rows
    .filter((f) => f.applied)
    .map((f) => f.job_id as string);

  if (ids.length === 0) {
    return NextResponse.json({ jobs: [] as JobRow[], appliedIds: [] });
  }
  const { data: jobs, error: e2 } = await supabase
    .from("jobs")
    .select("*")
    .in("id", ids);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const sorted = sortByScore((jobs || []) as JobRow[]);
  return NextResponse.json({ jobs: sorted, appliedIds });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { client_id, job_id, applied } = (body || {}) as {
    client_id?: string;
    job_id?: string;
    applied?: boolean;
  };
  if (!isValidClientId(client_id) || !isValidUuid(job_id)) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("favorites").upsert(
    {
      client_id,
      job_id,
      applied: applied ?? false,
    },
    { onConflict: "client_id,job_id" }
  );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { client_id, job_id } = (body || {}) as {
    client_id?: string;
    job_id?: string;
  };
  if (!isValidClientId(client_id) || !isValidUuid(job_id)) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("client_id", client_id)
    .eq("job_id", job_id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
