// src/app/interview/page.tsx
import InterviewClient from "./InterviewClient";

export default function InterviewPage({ searchParams }: { searchParams?: any }) {
  const sessionId = searchParams?.sessionId ?? "";
  const skill = searchParams?.skill ?? "Beginner";
  const name = searchParams?.name ?? "";

  return (
    <InterviewClient
      sessionId={String(sessionId)}
      skill={String(skill)}
      name={String(name)}
    />
  );
}