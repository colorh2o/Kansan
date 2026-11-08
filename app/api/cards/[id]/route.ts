import { NextResponse } from "next/server";
import { isStatus } from "@/lib/kanban";
import { getPublicSupabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const connection = getPublicSupabase();
  if ("response" in connection) return connection.response;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("status" in body) || !isStatus(body.status)) {
    return NextResponse.json({ error: "Choose To do, Doing, or Done." }, { status: 422 });
  }

  try {
    const { id } = await params;
    const { data, error } = await connection.supabase
      .from("cards")
      .update({ status: body.status })
      .eq("id", id)
      .select("id, title, status, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
    }
    if (!data) return NextResponse.json({ error: "That task no longer exists." }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const connection = getPublicSupabase();
  if ("response" in connection) return connection.response;

  try {
    const { id } = await params;
    const { data, error } = await connection.supabase
      .from("cards")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
    }
    if (!data) return NextResponse.json({ error: "That task no longer exists." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
  }
}