import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { getSessionProfile } from "@/lib/supabase/server-auth";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

type ElevenLabsTranscript = {
  text?: string;
  transcripts?: Array<{ text?: string }>;
};

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice transcription is not configured. Please type your report." },
      { status: 503 }
    );
  }

  try {
    const requestData = await request.formData();
    const audio = requestData.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "An audio recording is required." }, { status: 400 });
    }
    if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Recording must be between 1 byte and 20 MB." },
        { status: 400 }
      );
    }
    if (audio.type && !audio.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Only audio recordings are accepted." }, { status: 400 });
    }

    const formData = new FormData();
    formData.append("file", audio, audio.name || "problem-report.webm");
    formData.append("model_id", "scribe_v2");
    formData.append("no_verbatim", "true");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
      cache: "no-store",
    });
    const data = (await response.json()) as ElevenLabsTranscript & {
      detail?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(data.detail?.message || "ElevenLabs could not transcribe the recording.");
    }

    const transcript =
      data.text?.trim() ||
      data.transcripts
        ?.map((item) => item.text?.trim())
        .filter(Boolean)
        .join("\n")
        .trim();
    if (!transcript) {
      return NextResponse.json(
        { error: "No speech was detected. Please try again or type your report." },
        { status: 422 }
      );
    }

    try {
      await logAudit({
        actor_type: "human",
        actor_id: profile.id,
        action_type: "problem_report_audio_transcribed",
        inputs: { bytes: audio.size, content_type: audio.type },
        outputs: { character_count: transcript.length },
        outcome: "success",
      });
    } catch {
      // Audit failure must not discard a successful transcription.
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not transcribe the recording.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
