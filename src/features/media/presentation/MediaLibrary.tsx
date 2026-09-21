"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Search, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteMedia } from "../application/media-actions";
import { IMAGE_TYPES, type MediaAsset } from "../domain/MediaAsset";
import { DeleteButton } from "@/shared/components/DeleteButton";

export function MediaLibrary({ initial, maxBytes, onSelect }: { initial: MediaAsset[]; maxBytes: number; onSelect?: (url: string) => void }) {
  const t = useTranslations("cms");
  const [assets, setAssets] = useState(initial);
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [limit, setLimit] = useState(maxBytes);
  const input = useRef<HTMLInputElement>(null);
  function upload(file?: File) {
    if (!file || progress !== null) return;
    if (input.current) input.current.value = "";
    if (file.size > limit) { setMessage(t("imageTooLarge", { size: Math.floor(limit / 1024) })); return; }
    if (!IMAGE_TYPES.includes(file.type) || !file.size) { setMessage(t("invalidFile")); return; }
    setMessage(""); setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.timeout = 120000;
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onerror = () => { setMessage(t("error")); setProgress(null); };
    xhr.ontimeout = xhr.onerror;
    xhr.onload = () => {
      setProgress(null);
      if (xhr.response?.maxBytes) setLimit(xhr.response.maxBytes);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.asset) { setAssets((previous) => [xhr.response.asset, ...previous]); setMessage(t("uploaded")); }
      else setMessage(xhr.response?.message || (xhr.status === 413 ? t("imageTooLarge", { size: Math.floor(limit / 1024) }) : t("error")));
    };
    const form = new FormData(); form.set("file", file); xhr.send(form);
    if (input.current) input.current.value = "";
  }
  const filtered = assets.filter((asset) => asset.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="media-library">
    <div className="admin-toolbar">
      <label className="admin-search"><Search size={17} /><input type="search" aria-label={t("search")} placeholder={t("search")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" aria-label={t("upload")} onChange={(event) => upload(event.target.files?.[0])} />
      <button type="button" className="admin-button primary" disabled={progress !== null} onClick={() => input.current?.click()}><Upload size={17} />{t(progress !== null ? "uploading" : "upload")}</button>
    </div>
    {progress !== null && <progress max={100} value={progress} aria-label={t("uploading")} />}
    <p className="media-limit">{t("imageLimit", { size: Math.floor(limit / 1024) })}</p>
    {message && <p role="status">{message}</p>}
    {!filtered.length && <p className="admin-empty">{t("mediaEmpty")}</p>}
    <div className="media-grid">{filtered.map((asset) => <article className="media-item" key={asset.id}>
      <div className="media-image"><Image src={asset.url} alt={asset.name} fill sizes="(max-width: 760px) 50vw, 25vw" /></div>
      <p title={asset.name}>{asset.name}</p><small>{Math.ceil(asset.bytes / 1024)} KB · {asset.width} × {asset.height}</small>
      <div className="admin-actions">
        {onSelect && <button type="button" className="admin-button" onClick={() => onSelect(asset.url)}><Check size={15} />{t("select")}</button>}
        <DeleteButton action={() => deleteMedia(asset.id)} onDeleted={() => setAssets((previous) => previous.filter((item) => item.id !== asset.id))} />
      </div>
    </article>)}</div>
  </div>;
}
