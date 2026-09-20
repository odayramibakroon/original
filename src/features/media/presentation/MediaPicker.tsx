"use client";
import { useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/shared/components/Dialog";
import { listMedia } from "../application/media-actions";
import type { MediaAsset } from "../domain/MediaAsset";
import { MediaLibrary } from "./MediaLibrary";

export function MediaPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const t = useTranslations("cms");
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return <>
    <button type="button" className="admin-button" disabled={pending} onClick={() => startTransition(async () => {
      setError("");
      try { const result = await listMedia(); if (result.ok) setAssets(result.data); else setError(result.message); }
      catch { setError(t("error")); }
    })}><ImagePlus size={17} />{t("chooseImage")}</button>
    {error && <p role="alert">{error}</p>}
    <Dialog open={assets !== null} title={t("media")} onClose={() => setAssets(null)}>
      {assets && <MediaLibrary initial={assets} onSelect={(url) => { onSelect(url); setAssets(null); }} />}
    </Dialog>
  </>;
}
