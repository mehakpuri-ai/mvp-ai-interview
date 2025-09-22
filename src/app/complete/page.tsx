// src/app/complete/page.tsx  (server component)
import ClientComplete from '@/app/complete/ClientComplete';

export default function CompletePage({ searchParams }: { searchParams?: any }) {
  const sessionId = searchParams?.sessionId ?? searchParams?.session ?? "";

  return <ClientComplete sessionId={String(sessionId)} />;
}