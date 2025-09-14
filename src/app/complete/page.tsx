"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Complete(){
  const params = useSearchParams();
  const session = params.get('session') || '';
  const router = useRouter();

  useEffect(()=>{
    // call server to process session (mock feedback)
    (async ()=>{
      await fetch('/api/process-session', { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ sessionId: session }) });
      router.push(`/results?session=${session}`);
    })();
  }, [session]);

  return <div className="min-h-dvh flex items-center justify-center">Processing your results…</div>;
}
