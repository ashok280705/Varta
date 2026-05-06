import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const language = searchParams.get("language");
  const search = searchParams.get("search");

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (language && language !== "all") query = query.eq("language", language);
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      language: body.language || "english",
      source: body.source || "website",
      status: "new",
      score: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
