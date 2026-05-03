import { createFileRoute } from "@tanstack/react-router";
import MoodMirror from "@/components/MoodMirror";

export const Route = createFileRoute("/")({
  component: MoodMirror,
  head: () => ({
    meta: [
      { title: "MoodMirror — Your Mind, Understood" },
      { name: "description", content: "AI-powered mental wellness platform: mood tracking, journaling, voice & face emotion analysis, therapist support." },
    ],
  }),
});
