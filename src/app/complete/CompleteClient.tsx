'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function CompleteClient() {
  const searchParams = useSearchParams();

  // read params safely
  const sessionId = searchParams?.get('sessionId') ?? '';
  const score = searchParams?.get('score') ?? '';

  return (
    <div>
      {/* replicate the client-dependent UI that used useSearchParams() */}
      <h2>Completion</h2>
      {sessionId ? (
        <p>Session ID: {sessionId}</p>
      ) : (
        <p>No session id found in the URL.</p>
      )}
      {score ? <p>Your score: {score}</p> : null}
      {/* if your original component had more behavior (useEffect, state),
          move that into this component */}
    </div>
  );
}
