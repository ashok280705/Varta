import textToSpeech from "@google-cloud/text-to-speech";

// Ensure this uses the credentials in the environment
const client = new textToSpeech.TextToSpeechClient();

export async function synthesizeSpeech(text: string, language: string = "english"): Promise<Uint8Array> {
  const languageCode = language.toLowerCase() === "hindi" ? "hi-IN" : "en-IN";
  const name = languageCode === "hi-IN" ? "hi-IN-Wavenet-A" : "en-IN-Wavenet-D";

  const request = {
    input: { text },
    voice: {
      languageCode,
      name,
    },
    audioConfig: {
      audioEncoding: "MP3" as const,
    },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    if (!response.audioContent) {
      throw new Error("No audio content returned from Google TTS");
    }
    return response.audioContent;
  } catch (error: any) {
    console.error("Google TTS Error:", error);
    throw new Error(`Google Cloud TTS failed: ${error.message}`);
  }
}
