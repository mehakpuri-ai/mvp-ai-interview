"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import posthog from "posthog-js";

export default function RecorderUploader({ sessionId, questionId, timeLimit, onUploaded }:{sessionId:string,questionId:number,timeLimit:number,onUploaded:(path:string)=>void}) {
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const mrRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [secsLeft, setSecsLeft] = useState(timeLimit);

  useEffect(()=>{
    let t: any;
    if(recording){
      t = setInterval(()=> setSecsLeft(s=> {
        if (s<=1) { stopRecord(); return 0; }
        return s-1;
      }), 1000);
    } else setSecsLeft(timeLimit);
    return ()=> clearInterval(t);
  }, [recording]);

  const startRecord = async () => {
    // 3..2..1 UI can be added in parent; keep simple
    const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    const mr = new MediaRecorder(stream, { mimeType:'video/webm;codecs=vp8,opus' });
    mrRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e)=> { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    mr.onstart = ()=> { setRecording(true); posthog.capture('recording_started',{ sessionId, questionId }); };
    mr.onstop = async ()=>{
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type:'video/webm' });
      const fileName = `sessions/${sessionId}/answers/q${questionId}_${Date.now()}.webm`;
      const { error:uploadErr } = await supabase.storage.from('sessions').upload(fileName, blob);
      if(uploadErr){ alert('Upload failed: '+uploadErr.message); posthog.capture('recording_upload_failed',{sessionId, questionId}); return; }
      await supabase.from('answers').insert([{ session_id: sessionId, question_id: questionId, video_path: fileName, duration: (timeLimit - secsLeft) }]);
      const { data: urlData } = supabase.storage.from('sessions').getPublicUrl(fileName);
      posthog.capture('recording_uploaded',{ sessionId, questionId, path: fileName });
      setPreview(URL.createObjectURL(blob));
      onUploaded(fileName);
      // stop tracks
      stream.getTracks().forEach(t=>t.stop());
    };
    mr.start();
    // small delay to ensure recorder started
    setTimeout(()=>{},100);
  };

  const stopRecord = () => {
    if(mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop();
      posthog.capture('recording_stopped', { sessionId, questionId, duration: timeLimit - secsLeft });
    }
  };

  return (
    <div className="w-full">
      <div className="relative aspect-video w-full bg-black">
        {/* preview area */}
        {preview ? <video src={preview} controls className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/50">Your answer will show here</div>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className={`font-mono ${secsLeft<=10 ? 'text-red-400' : 'text-white'}`}>{secsLeft}s</div>
        <div className="flex gap-2">
          {!recording ? <button onClick={startRecord} className="px-4 py-2 bg-[#E83F6F] rounded">Record</button> : <button onClick={stopRecord} className="px-4 py-2 bg-red-600 rounded">Stop</button>}
        </div>
      </div>
    </div>
  );
}
