"use client";

import { useEffect, useMemo, useState } from "react";

export type TopzynNoticeTone = "success" | "error" | "warning" | "info";

type TopzynNoticeProps = {
  open: boolean;
  tone: TopzynNoticeTone;
  title: string;
  message: string;
  onClose: () => void;
  autoHideMs?: number;
};

type ToneMeta = {
  cardClass: string;
  iconWrapClass: string;
  iconClass: string;
  progressClass: string;
};

const TONE_META: Record<TopzynNoticeTone, ToneMeta> = {
  success: {
    cardClass:
      "border-emerald-200/90 bg-[linear-gradient(145deg,#f5fffb_0%,#effcf6_55%,#e4f8ef_100%)] text-emerald-900",
    iconWrapClass: "bg-emerald-100/90 ring-1 ring-emerald-200/80",
    iconClass: "text-emerald-600",
    progressClass: "bg-emerald-500/85",
  },
  error: {
    cardClass:
      "border-red-200/90 bg-[linear-gradient(145deg,#fff7f7_0%,#fff1f1_55%,#ffe5e5_100%)] text-red-900",
    iconWrapClass: "bg-red-100/90 ring-1 ring-red-200/80",
    iconClass: "text-red-600",
    progressClass: "bg-red-500/85",
  },
  warning: {
    cardClass:
      "border-amber-200/90 bg-[linear-gradient(145deg,#fffaf0_0%,#fff5e5_55%,#ffedd5_100%)] text-amber-900",
    iconWrapClass: "bg-amber-100/90 ring-1 ring-amber-200/80",
    iconClass: "text-amber-600",
    progressClass: "bg-amber-500/85",
  },
  info: {
    cardClass:
      "border-[#293275]/20 bg-[linear-gradient(145deg,#f4f7ff_0%,#eef3ff_55%,#e6edff_100%)] text-[#1f2a67]",
    iconWrapClass: "bg-[#dfe7ff] ring-1 ring-[#cbd8ff]",
    iconClass: "text-[#293275]",
    progressClass: "bg-[#293275]/80",
  },
};

function NoticeIcon({ tone }: { tone: TopzynNoticeTone }) {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path
          d="M9.5 16.2L5.8 12.5l-1.4 1.4 5.1 5.1 10-10-1.4-1.4z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M11 7h2v6h-2zm0 8h2v2h-2z" fill="currentColor" />
        <path
          d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path
          d="M12 3.2 2.7 20h18.6L12 3.2Zm0 4.6a1 1 0 0 1 1 1v5.6a1 1 0 1 1-2 0V8.8a1 1 0 0 1 1-1Zm0 10a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TopzynNotice({
  open,
  tone,
  title,
  message,
  onClose,
  autoHideMs = 5000,
}: TopzynNoticeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isProgressRunning, setIsProgressRunning] = useState(false);

  const toneMeta = useMemo(() => TONE_META[tone], [tone]);

  useEffect(() => {
    if (!open) {
      setIsVisible(false);
      return;
    }

    setIsVisible(false);
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [open]);

  useEffect(() => {
    if (!open || autoHideMs <= 0) {
      setIsProgressRunning(false);
      return;
    }

    setIsProgressRunning(false);
    const frameId = window.requestAnimationFrame(() => {
      setIsProgressRunning(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [open, autoHideMs, title, message, tone]);

  useEffect(() => {
    if (!open || autoHideMs <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, autoHideMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, autoHideMs, onClose, title, message, tone]);

  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[1300] flex justify-center px-3 sm:top-4">
      <div
        role="alert"
        aria-live="polite"
        className={[
          "pointer-events-auto w-full max-w-[460px] overflow-hidden rounded-2xl border shadow-[0_16px_42px_rgba(16,24,40,0.22)] backdrop-blur-sm transition-all duration-300",
          toneMeta.cardClass,
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
        ].join(" ")}
      >
        <div className="flex items-start gap-3 px-3.5 pb-3.5 pt-3 sm:px-4">
          <div
            className={[
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              toneMeta.iconWrapClass,
              toneMeta.iconClass,
            ].join(" ")}
          >
            <NoticeIcon tone={tone} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold tracking-[0.01em] sm:text-[15px]">
              {title}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-700 sm:text-[13px]">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-white"
          >
            Tutup
          </button>
        </div>
        {autoHideMs > 0 ? (
          <div className="h-1 w-full bg-black/5">
            <div
              className={["h-full transition-[width] ease-linear", toneMeta.progressClass].join(
                " ",
              )}
              style={{
                width: isProgressRunning ? "0%" : "100%",
                transitionDuration: `${autoHideMs}ms`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

