"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import {
  FighterCardApiError,
  fighterCardService,
  type PhotoConstraints,
} from "@/services/fighter-card.service";

function initialsOf(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email ? email[0].toUpperCase() : "?";
}

function humanSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

interface PhotoUploadProps {
  /** Signed URL from the card just fetched — never cached. */
  photo: string | null;
  fullName: string | null;
  email: string;
  constraints: PhotoConstraints;
  /** Server error keyed on `photo`, from the last failed attempt. */
  error?: string;
  /** Fires after any change so the caller can re-read the card. */
  onChanged: () => void | Promise<void>;
  onError: (message: string | null) => void;
}

export default function PhotoUpload({
  photo,
  fullName,
  email,
  constraints,
  error,
  onChanged,
  onError,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  /** Local object URL shown while the upload is in flight. */
  const [preview, setPreview] = useState<string | null>(null);

  // Object URLs are a document-lifetime leak until revoked.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clearPreview = () => {
    setPreview((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  };

  const handleFile = async (file: File) => {
    onError(null);

    // Checked here so a 5 MB round trip is not needed to be told no. The server
    // enforces both regardless, and its 400 comes back keyed on `photo`.
    if (file.size > constraints.max_bytes) {
      onError(`That image is ${humanSize(file.size)}. The limit is ${humanSize(constraints.max_bytes)}.`);
      return;
    }
    if (file.type && !constraints.content_types.includes(file.type)) {
      onError(`${file.type} is not supported. Use ${constraints.extensions.join(", ")}.`);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setBusy(true);
    try {
      await fighterCardService.uploadPhoto(file);
      // Re-read the card: uploading fills a required field, so is_complete and
      // missing_fields both move.
      await onChanged();
    } catch (e) {
      // Surface the server's own message — it explains HEIC and the like far
      // better than a generic failure would.
      onError(
        e instanceof FighterCardApiError
          ? e.forField("photo") ?? e.message
          : "Could not upload that photo. Please try again."
      );
    } finally {
      setBusy(false);
      clearPreview();
    }
  };

  const handleRemove = async () => {
    onError(null);
    setBusy(true);
    try {
      await fighterCardService.deletePhoto();
      // Removing un-completes the card, so the caller must re-read it.
      await onChanged();
    } catch (e) {
      onError(e instanceof FighterCardApiError ? e.message : "Could not remove the photo.");
    } finally {
      setBusy(false);
    }
  };

  const shown = preview ?? photo;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 shrink-0 border border-white/20 bg-white/[0.05] overflow-hidden">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, expires; not a static asset
            <img src={shown} alt="Your fighter photo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <span className="font-barlow font-black italic text-2xl text-primary">
                {initialsOf(fullName, email)}
              </span>
              <User size={12} className="text-white/25" />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 font-barlow font-bold text-[13px] tracking-[0.2em] uppercase bg-primary text-black hover:shadow-[0_0_22px_-6px_hsl(var(--primary)/0.8)] transition-all duration-300 disabled:opacity-60"
            >
              <Camera size={13} />
              {photo ? "Change Photo" : "Add Photo"}
            </button>
            {photo && (
              <button
                type="button"
                disabled={busy}
                onClick={handleRemove}
                className="inline-flex items-center gap-2 px-4 py-2.5 font-barlow font-bold text-[13px] tracking-[0.2em] uppercase border border-white/18 text-white/65 hover:text-red-300 hover:border-red-400/45 transition-colors disabled:opacity-60"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <p className="font-grotesk text-[12px] text-white/45">
            {constraints.extensions.join(", ").toUpperCase()} · up to {humanSize(constraints.max_bytes)}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        // accept comes from the server, not a hard-coded list
        accept={constraints.content_types.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset first, so choosing the same file twice still fires a change.
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />

      {error && <p className="font-grotesk text-[12px] text-red-400">{error}</p>}
    </div>
  );
}
