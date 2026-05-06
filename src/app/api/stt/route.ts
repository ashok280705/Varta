import { NextResponse } from "next/server";
import { transcribeAudioDeepgram } from "@/lib/voice/stt";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const result = await transcribeAudioDeepgram(arrayBuffer);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("STT Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 500 });
  }
}
