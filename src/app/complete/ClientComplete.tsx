'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientComplete({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/start');
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setProcessing(true);
        const res = await fetch('/api/process-session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (!mounted) return;
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        router.replace(`/results?sessionId=${encodeURIComponent(sessionId)}`);
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (mounted) setProcessing(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sessionId, router]);

  if (processing && !error) {
    return <div className="min-h-dvh flex items-center justify-center">Processing your results…</div>;
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center flex-col gap-4 px-4 text-center">
        <div className="text-red-500">Failed to process results: {error}</div>
        <button onClick={() => router.replace('/start')} className="px-4 py-2 rounded bg-gray-200">
          Back to start
        </button>
      </div>
    );
  }

  return null;
}
