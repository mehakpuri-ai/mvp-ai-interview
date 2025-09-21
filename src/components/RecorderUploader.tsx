// src/components/RecorderUploader.tsx
import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient'; // adjust import path if different

type RecorderUploaderProps = {
  onUploaded?: (url: string) => void;
  maxFileSizeBytes?: number;
  timeLimit?: number | null;
};

export default function RecorderUploader({
  onUploaded,
  maxFileSizeBytes = 50 * 1024 * 1024, // 50MB default
  timeLimit = null,
}: RecorderUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [secsLeft, setSecsLeft] = useState<number | null>(timeLimit);

  useEffect(() => {
    if (timeLimit === null) {
      setSecsLeft(null);
      return;
    }
    setSecsLeft(timeLimit);
    const iv = setInterval(() => {
      setSecsLeft((s) => (s && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(iv);
    // we depend on timeLimit; do not disable exhaustive-deps
  }, [timeLimit]);

  async function uploadFile(file: File) {
    if (!file) return;
    if (file.size > maxFileSizeBytes) {
      alert('File too large');
      return;
    }
    try {
      setUploading(true);
      const path = `recordings/${Date.now()}_${file.name}`;
      const { data, error } = await supabaseClient.storage
        .from('public') // change bucket name if needed
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      // get public URL
      const { data: urlData } = supabaseClient.storage.from('public').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setUploading(false);
      onUploaded?.(publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Upload failed', err);
      setUploading(false);
      alert('Upload failed');
      return null;
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  }

  return (
    <div>
      <input type="file" accept="audio/*,video/*" onChange={handleFileChange} />
      {uploading ? <div>Uploading…</div> : null}
      {secsLeft !== null && <div>Time left: {secsLeft}s</div>}
    </div>
  );
}
