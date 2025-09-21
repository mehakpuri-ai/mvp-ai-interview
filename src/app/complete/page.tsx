// src/app/complete/page.tsx
import React, { Suspense } from 'react';
import CompleteClient from './CompleteClient'; // adjust path if you placed it elsewhere

export const metadata = {
  title: 'Complete',
};

export default function Page() {
  return (
    <main>
      <h1>Thank you</h1>

      <Suspense fallback={<div>Loading details…</div>}>
        <CompleteClient />
      </Suspense>

      {/* rest of the server-rendered content */}
    </main>
  );
}
