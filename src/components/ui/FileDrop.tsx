"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, File as FileIcon, UploadCloud, X } from "lucide-react";
import { Progress } from "./primitives";

type Item = { id: number; name: string; size: number; progress: number; speed: number };

const fmt = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

/**
 * Drag-and-drop yuklash zonasi. Yuklash jarayoni demo uchun simulyatsiya qilingan —
 * haqiqiy API (S3 / presigned URL) ulanganda `startUpload` ichini almashtiring.
 */
export function FileDrop({
  accept, hint, maxMB = 50, multiple = true, showSpeed = false,
}: { accept?: string; hint: string; maxMB?: number; multiple?: boolean; showSpeed?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  function startUpload(file: File) {
    const id = ++seq.current;
    const speed = 2 + Math.random() * 6; // MB/s
    setItems((l) => (multiple ? [...l, { id, name: file.name, size: file.size, progress: 0, speed }] : [{ id, name: file.name, size: file.size, progress: 0, speed }]));
    const timer = setInterval(() => {
      setItems((l) => l.map((i) => (i.id === id ? { ...i, progress: Math.min(100, i.progress + 4 + Math.random() * 9) } : i)));
    }, 250);
    setTimeout(() => clearInterval(timer), 8000);
  }

  function add(files: FileList | null) {
    if (!files) return;
    setError("");
    for (const f of Array.from(files)) {
      if (f.size > maxMB * 1024 * 1024) { setError(`"${f.name}" ${maxMB}MB dan katta`); continue; }
      startUpload(f);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        role="button"
        tabIndex={0}
        className={clsx(
          "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition",
          over ? "border-primary bg-primary/10 shadow-glow" : "border-line-accent bg-low hover:border-primary/50",
        )}
      >
        <UploadCloud className="size-8 text-primary" />
        <p className="text-sm font-semibold">Faylni shu yerga tashlang yoki <span className="text-primary">tanlang</span></p>
        <p className="text-xs text-slate-500">{hint} · maks. {maxMB}MB</p>
        <input ref={input} type="file" hidden multiple={multiple} accept={accept} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>

      {error && <p className="text-xs font-semibold text-danger">{error}</p>}

      {items.map((i) => {
        const done = i.progress >= 100;
        return (
          <div key={i.id} className="rounded-xl border border-line bg-low p-3">
            <div className="mb-2 flex items-center gap-3">
              {done ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <FileIcon className="size-5 shrink-0 text-primary" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.name}</p>
                <p className="text-xs text-slate-500">
                  {fmt(i.size)} · {done ? "Yuklandi" : `${Math.round(i.progress)}%`}
                  {showSpeed && !done && ` · ${i.speed.toFixed(1)} MB/s`}
                </p>
              </div>
              <button onClick={() => setItems((l) => l.filter((x) => x.id !== i.id))} className="rounded-lg p-1.5 text-slate-500 hover:bg-fg/5 hover:text-danger" aria-label="Olib tashlash">
                <X className="size-4" />
              </button>
            </div>
            <Progress value={i.progress} tone={done ? "success" : "info"} />
          </div>
        );
      })}
    </div>
  );
}
