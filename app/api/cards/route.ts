import { NextResponse } from "next/server";
import { isStatus } from "@/lib/kanban";
import { getPublicSupabase } from "@/lib/supabase";

export async function GET() {
  const connection = getPublicSupabase();
  if ("response" in connection) return connection.response;

  try {
    const { data, error } = await connection.supabase
      .from("cards")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const connection = getPublicSupabase();
  if ("response" in connection) return connection.response;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("title" in body)) {
    return NextResponse.json({ error: "A task title is required." }, { status: 400 });
  }

  const { title, status } = body as { title: unknown; status?: unknown };
  const cleanTitle = typeof title === "string" ? title.trim() : "";

  if (!cleanTitle || cleanTitle.length > 200) {
    return NextResponse.json(
      { error: "Task titles must be between 1 and 200 characters." },
      { status: 422 },
    );
  }

  if (status !== undefined && !isStatus(status)) {
    return NextResponse.json({ error: "Choose To do, Doing, or Done." }, { status: 422 });
  }

  try {
    const { data, error } = await connection.supabase
      .from("cards")
      .insert({ title: cleanTitle, status: status ?? "todo" })
      .select("id, title, status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The board could not reach its database." }, { status: 502 });
  }
}