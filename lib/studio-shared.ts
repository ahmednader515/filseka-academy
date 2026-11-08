export const STUDIO_MAX_BYTES = 100 * 1024 * 1024;

export type StudioExercise = { id: string; title: string; instructions: string; active: boolean };
export type StudioRecording = {
  id: string; student_id: string; student_name: string; title: string;
  exercise_id: string | null; exercise_title: string | null; source: "recording" | "upload";
  size_bytes: number; feedback: string | null; score: number | null;
  reviewer_name: string | null; created_at: string; reviewed_at: string | null;
};
export type StudioData = { exercises: StudioExercise[]; recordings: StudioRecording[] };

const audioTypes: Record<string, string> = {
  mp3: "audio/mpeg", wav: "audio/wav", wave: "audio/wav", m4a: "audio/mp4", mp4: "audio/mp4",
  ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg", webm: "audio/webm",
  flac: "audio/flac", aac: "audio/aac", aif: "audio/aiff", aiff: "audio/aiff",
  amr: "audio/amr", wma: "audio/x-ms-wma", caf: "audio/x-caf", "3gp": "audio/3gpp",
};
export function studioAudioType(name: string, type: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const baseType = type.split(";")[0].trim().toLowerCase();
  return audioTypes[ext] ?? (baseType.startsWith("audio/") ? baseType : null);
}
