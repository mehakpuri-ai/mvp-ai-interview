// src/app/results/page.tsx
import ResultsClient from "@/app/results/ResultsClient";

export default function ResultsPage({ searchParams }: { searchParams?: any }) {
  const sessionId = searchParams?.sessionId ?? "";
  const name = searchParams?.name ?? "";

  return <ResultsClient sessionId={String(sessionId)} name={String(name)} />;
}
