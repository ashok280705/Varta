import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [leadRes, convRes, interRes] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase.from("conversations").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("interactions").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);

  if (leadRes.error) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({
    lead: leadRes.data,
    conversations: convRes.data || [],
    interactions: interRes.data || [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("leads")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
