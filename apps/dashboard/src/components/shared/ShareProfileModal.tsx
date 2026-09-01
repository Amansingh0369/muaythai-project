"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Send,
  History,
  Check,
} from "lucide-react";
import {
  userService,
  ShareApiError,
  type DossierSection,
  type ProfileShare,
  type SharePreview,
  type ShareSection,
} from "@/services/user.service";

/** Who is being shared. `label` is a name when we have one, else their email. */
export interface ShareSubject {
  id: number;
  label: string;
}

interface ShareProfileModalProps {
  isOpen: boolean;
  subject: ShareSubject | null;
  onClose: () => void;
  /** Fired after a successful send so the page can confirm the address. */
  onShared: (share: ProfileShare) => void;
}

const ALL_SECTIONS: ShareSection[] = ["customer", "fighter_card"];

const SECTION_LABELS: Record<ShareSection, { title: string; detail: string }> = {
  customer: {
    title: "Customer",
    detail: "Contact details, passport, emergency contact, medical notes",
  },
  fighter_card: {
    title: "Fighter card",
    detail: "Training history and the private injuries / trainer-only section",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PREVIEW_DEBOUNCE_MS = 300;

function fmtShareDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** The dossier exactly as the backend rendered it — no reformatting here. */
function DossierView({ sections }: { sections: DossierSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.key}>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
            {section.title}
          </h4>

          {/* A note with no blocks means "nothing to show" — informational,
              never an error, so it is not styled as one. */}
          {section.blocks.length === 0 ? (
            <p className="text-white/40 text-sm leading-relaxed">{section.note}</p>
          ) : (
            <div className="space-y-4">
              {section.blocks.map((block, i) => (
                <div key={`${section.key}-${i}`}>
                  {block.subtitle && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                      {block.subtitle}
                    </p>
                  )}
                  <dl className="space-y-1.5">
                    {block.rows.map((row, r) => (
                      <div
                        key={`${section.key}-${i}-${r}`}
                        className="flex items-start gap-4 text-sm"
                      >
                        <dt className="text-white/40 w-[45%] shrink-0">{row.label}</dt>
                        <dd className="text-white/90 min-w-0 break-words">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ShareProfileModal({
  isOpen,
  subject,
  onClose,
  onShared,
}: ShareProfileModalProps) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Record<ShareSection, boolean>>({
    customer: true,
    fighter_card: true,
  });

  const [preview, setPreview] = useState<SharePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [history, setHistory] = useState<ProfileShare[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const selected = ALL_SECTIONS.filter((key) => picked[key]);
  // Both ticked is "everything", which the API wants as an omitted parameter.
  const sectionsArg = selected.length === ALL_SECTIONS.length ? undefined : selected;
  const emailIsValid = EMAIL_RE.test(email.trim());
  const canSend = emailIsValid && selected.length > 0 && !isSending;

  // Only the newest preview request may write state; ticking fast otherwise
  // lets a slow earlier response overwrite a newer one.
  const previewRequestId = useRef(0);

  const subjectId = subject?.id ?? null;

  // Reset on open. The recipient is deliberately never carried over from the
  // previous share, the student, or anything else — it is typed every time.
  useEffect(() => {
    if (!isOpen || subjectId === null) return;
    setEmail("");
    setNote("");
    setPicked({ customer: true, fighter_card: true });
    setPreview(null);
    setPreviewError(null);
    setSendError(null);
    setEmailError(null);

    let cancelled = false;
    setIsLoadingHistory(true);
    userService
      .getProfileShares(subjectId)
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch(() => {
        // History is context, not the job — its absence must not block a share.
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, subjectId]);

  // Debounced so toggling both boxes quickly fires one request, not three.
  const sectionKey = selected.join(",");
  useEffect(() => {
    if (!isOpen || subjectId === null) return;
    if (selected.length === 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    const requestId = ++previewRequestId.current;
    setIsPreviewing(true);
    const timer = setTimeout(() => {
      userService
        .previewProfileShare(subjectId, sectionsArg)
        .then((data) => {
          if (requestId !== previewRequestId.current) return;
          setPreview(data);
          setPreviewError(null);
        })
        .catch((err) => {
          if (requestId !== previewRequestId.current) return;
          setPreview(null);
          setPreviewError(
            err instanceof Error ? err.message : "Failed to load the preview"
          );
        })
        .finally(() => {
          if (requestId === previewRequestId.current) setIsPreviewing(false);
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // sectionKey stands in for `selected`, which is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, subjectId, sectionKey]);

  const toggleSection = (key: ShareSection) => {
    setPicked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // At least one must stay ticked; Send is disabled if somehow none are.
      return next;
    });
  };

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (subjectId === null || !canSend) return;

      setSendError(null);
      setEmailError(null);
      setIsSending(true);
      try {
        const share = await userService.shareProfile(subjectId, {
          email: email.trim(),
          sections: sectionsArg,
          note: note.trim() || undefined,
        });
        onShared(share);
        onClose();
      } catch (err) {
        if (err instanceof ShareApiError && err.status === 400) {
          // Validation — belongs against the field it came from.
          setEmailError(err.message);
        } else if (err instanceof ShareApiError && err.status === 502) {
          setSendError(
            `${err.message} The email did not go out and nothing was recorded — your form is untouched, so you can try again.`
          );
        } else {
          setSendError(
            err instanceof Error ? err.message : "Failed to share the profile."
          );
        }
      } finally {
        setIsSending(false);
      }
    },
    [subjectId, canSend, email, sectionsArg, note, onShared, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && subject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSending ? undefined : onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-black border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[min(92vh,900px)]"
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4 p-6 md:p-8 border-b border-white/5 shrink-0">
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter truncate">
                  Share <span className="text-primary">{subject.label}</span>
                </h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                  Emails their profile to an address outside the platform
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSending}
                className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSend}
              className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-2 lg:gap-0"
            >
              {/* ── LEFT: the form ── */}
              <div className="overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6 lg:border-r border-white/5">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-200/80 text-[13px] leading-relaxed">
                    This sends passport, medical and emergency-contact details, and
                    the fighter card&apos;s private trainer section, to whatever
                    address you type. It cannot be recalled.
                  </p>
                </div>

                {/* Recipient */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                    Recipient email
                  </label>
                  <input
                    required
                    type="email"
                    // Never pre-filled — not from the student, not from the last
                    // share, and autofill is off so the browser can't either.
                    autoComplete="off"
                    name="share-recipient"
                    placeholder="coach@camp.com"
                    className={`w-full bg-white/5 border rounded-2xl p-4 text-white focus:outline-none focus:ring-2 transition-all ${
                      emailError
                        ? "border-red-500/50 focus:ring-red-500/40"
                        : "border-white/10 focus:ring-primary/50"
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                  />
                  {emailError && (
                    <p className="text-red-400 text-[13px] leading-relaxed ml-1">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Sections */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                    What to include
                  </label>
                  <div className="space-y-3">
                    {ALL_SECTIONS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleSection(key)}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${
                          picked[key]
                            ? "bg-primary/5 border-primary/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            picked[key]
                              ? "bg-primary border-primary text-white"
                              : "border-white/20 text-transparent"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-white text-sm font-bold">
                            {SECTION_LABELS[key].title}
                          </span>
                          <span className="block text-white/40 text-[11px] mt-0.5 leading-relaxed">
                            {SECTION_LABELS[key].detail}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {selected.length === 0 && (
                    <p className="text-amber-400/80 text-[13px] ml-1">
                      Pick at least one section to share.
                    </p>
                  )}
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                    Covering note (optional)
                  </label>
                  <textarea
                    maxLength={2000}
                    placeholder="Arriving Tuesday — please review the shoulder injury."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-24 resize-none"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <p className="text-white/30 text-[11px] ml-1">
                    Shown to the recipient above the profile. {note.length}/2000
                  </p>
                </div>

                {/* History */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 ml-1">
                    <History className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                      Previously shared with
                    </span>
                  </div>
                  {isLoadingHistory ? (
                    <p className="text-white/30 text-[13px] ml-1">Checking…</p>
                  ) : history.length === 0 ? (
                    <p className="text-white/30 text-[13px] ml-1">
                      This profile has never been shared.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {history.map((row) => (
                        <li
                          key={row.id}
                          className="text-white/50 text-[13px] leading-relaxed"
                        >
                          <span className="text-white/80">{row.recipient_email}</span>{" "}
                          on {fmtShareDate(row.created_at)}
                          {row.shared_by_email ? ` by ${row.shared_by_email}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* ── RIGHT: the preview ── */}
              <div className="flex flex-col min-h-0 border-t lg:border-t-0 border-white/5">
                <div className="px-6 md:px-8 pt-6 pb-3 shrink-0">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                    Exactly what will be sent
                  </span>
                </div>

                {/* Only this pane spins — the form stays usable throughout. */}
                <div className="flex-1 min-h-[220px] overflow-y-auto custom-scrollbar px-6 md:px-8 pb-6">
                  {selected.length === 0 ? (
                    <p className="text-white/30 text-sm">
                      Nothing selected, so there is nothing to send.
                    </p>
                  ) : isPreviewing && !preview ? (
                    <div className="h-full flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : previewError ? (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm leading-relaxed">
                        {previewError}
                      </p>
                    </div>
                  ) : preview ? (
                    <div className={isPreviewing ? "opacity-40 transition-opacity" : ""}>
                      <DossierView sections={preview.sections} />
                    </div>
                  ) : null}
                </div>
              </div>
            </form>

            {/* Footer — send + the errors that matter most */}
            <div className="shrink-0 border-t border-white/5 p-6 md:p-8 space-y-4">
              {sendError && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm leading-relaxed">{sendError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSending}
                  className="sm:w-40 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex-1 bg-primary hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] text-sm py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
