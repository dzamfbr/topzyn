"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  waveClass: string;
  iconWrapClass: string;
  iconClass: string;
  titleClass: string;
  messageClass: string;
  closeClass: string;
  progressClass: string;
};

const TONE_META: Record<TopzynNoticeTone, ToneMeta> = {
  success: {
    cardClass: "border-emerald-100 bg-white",
    waveClass: "fill-emerald-400/24",
    iconWrapClass: "bg-emerald-100/90 ring-1 ring-emerald-200/80",
    iconClass: "text-emerald-600",
    titleClass: "text-emerald-700",
    messageClass: "text-slate-600",
    closeClass: "text-slate-500 hover:bg-emerald-50/80 hover:text-emerald-700",
    progressClass: "bg-emerald-500/85",
  },
  error: {
    cardClass: "border-rose-100 bg-white",
    waveClass: "fill-rose-400/24",
    iconWrapClass: "bg-rose-100/90 ring-1 ring-rose-200/80",
    iconClass: "text-red-600",
    titleClass: "text-rose-700",
    messageClass: "text-slate-600",
    closeClass: "text-slate-500 hover:bg-rose-50/80 hover:text-rose-700",
    progressClass: "bg-red-500/85",
  },
  warning: {
    cardClass: "border-amber-100 bg-white",
    waveClass: "fill-amber-400/30",
    iconWrapClass: "bg-amber-100/90 ring-1 ring-amber-200/80",
    iconClass: "text-amber-600",
    titleClass: "text-amber-700",
    messageClass: "text-slate-600",
    closeClass: "text-slate-500 hover:bg-amber-50/90 hover:text-amber-700",
    progressClass: "bg-amber-500/85",
  },
  info: {
    cardClass: "border-sky-100 bg-white",
    waveClass: "fill-sky-400/24",
    iconWrapClass: "bg-sky-100/90 ring-1 ring-sky-200/80",
    iconClass: "text-sky-600",
    titleClass: "text-sky-700",
    messageClass: "text-slate-600",
    closeClass: "text-slate-500 hover:bg-sky-50/80 hover:text-sky-700",
    progressClass: "bg-sky-500/85",
  },
};

function NoticeIcon({ tone }: { tone: TopzynNoticeTone }) {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 512 512" className="h-[17px] w-[17px]" aria-hidden="true">
        <path
          d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg viewBox="0 0 512 512" className="h-[17px] w-[17px]" aria-hidden="true">
        <path
          d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0L256 222.1l47.1-47.1c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9L289.9 256l47.1 47.1c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0L256 289.9l-47.1 47.1c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47.1-47.1-47.1-47.1c-9.4-9.3-9.4-24.5 0-33.9z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg viewBox="0 0 512 512" className="h-[17px] w-[17px]" aria-hidden="true">
        <path
          d="M256 48c17.7 0 34 9.2 43.1 24.4l200.2 336.5c9.4 15.8 9.6 35.5.4 51.5-9.2 16.1-26.4 26-44.9 26H57.2c-18.4 0-35.6-9.9-44.9-26-9.2-16-9-35.7.4-51.5L212.9 72.4C222 57.2 238.3 48 256 48zm0 126.5c-13.3 0-24 10.7-24 24v113c0 13.3 10.7 24 24 24s24-10.7 24-24v-113c0-13.3-10.7-24-24-24zm0 226.8a28 28 0 1 0 0-56 28 28 0 0 0 0 56z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 512 512" className="h-[17px] w-[17px]" aria-hidden="true">
      <path
        d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm24 304a24 24 0 1 0-48 0 24 24 0 1 0 48 0zm-8-184c0-8.8-7.2-16-16-16h-16c-8.8 0-16 7.2-16 16v128c0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16V168z"
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
  const onCloseRef = useRef(onClose);

  const toneMeta = useMemo(() => TONE_META[tone], [tone]);
  const safeTitle =
    title.trim() ||
    (tone === "success"
      ? "Berhasil"
      : tone === "error"
        ? "Terjadi Kesalahan"
        : tone === "warning"
          ? "Peringatan"
          : "Informasi");

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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
      onCloseRef.current();
    }, autoHideMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, autoHideMs, title, message, tone]);

  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[1300] flex justify-center px-3 sm:top-4">
      <div
        role="alert"
        aria-live="polite"
        className={[
          "topzyn-notice-card pointer-events-auto relative flex min-h-[82px] w-full max-w-[360px] items-center gap-3 overflow-hidden rounded-[10px] border px-3 py-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.18)] will-change-transform sm:px-3.5",
          toneMeta.cardClass,
          isVisible ? "notice-visible" : "",
        ].join(" ")}
      >
        <svg
          className="notice-wave"
          viewBox="0 0 1440 320"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
            className={toneMeta.waveClass}
            fillOpacity="1"
          />
        </svg>
        <div
          className={[
            "notice-icon-container ml-1 flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full",
            toneMeta.iconWrapClass,
            toneMeta.iconClass,
          ].join(" ")}
        >
          <NoticeIcon tone={tone} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={["truncate text-[15px] font-bold", toneMeta.titleClass].join(" ")}>
            {safeTitle}
          </p>
          <p className={["mt-0.5 text-[12px] leading-[1.35]", toneMeta.messageClass].join(" ")}>
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className={[
            "notice-close flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            toneMeta.closeClass,
          ].join(" ")}
        >
          <svg viewBox="0 0 15 15" className="h-[15px] w-[15px]" aria-hidden="true">
            <path
              d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
              fill="currentColor"
              clipRule="evenodd"
              fillRule="evenodd"
            />
          </svg>
        </button>
        {autoHideMs > 0 ? (
          <div className="notice-progress-track">
            <div
              className={["notice-progress-bar", toneMeta.progressClass].join(" ")}
              style={{
                width: isProgressRunning ? "0%" : "100%",
                transitionDuration: `${autoHideMs}ms`,
              }}
            />
          </div>
        ) : null}
        <style jsx>{`
          .topzyn-notice-card {
            opacity: 0;
            transform: translateY(-14px) scale(0.96);
            transition:
              opacity 280ms ease,
              transform 320ms cubic-bezier(0.21, 0.8, 0.28, 1);
          }

          .notice-visible {
            opacity: 1;
            transform: translateY(0) scale(1);
            animation: cardFloat 4.2s ease-in-out 360ms infinite;
          }

          .notice-wave {
            position: absolute;
            left: -31px;
            top: 34px;
            width: 84px;
            transform: rotate(90deg);
            opacity: 0.92;
            animation: waveDrift 3.6s ease-in-out infinite;
            pointer-events: none;
          }

          .notice-icon-container {
            position: relative;
            z-index: 1;
            animation: iconPulse 2.3s ease-in-out infinite;
          }

          .notice-close {
            position: relative;
            z-index: 1;
            transition:
              transform 160ms ease,
              background-color 160ms ease,
              color 160ms ease;
          }

          .notice-close:hover {
            transform: rotate(90deg) scale(1.06);
          }

          .notice-progress-track {
            position: absolute;
            left: 10px;
            right: 10px;
            bottom: 6px;
            height: 3px;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.08);
            overflow: hidden;
          }

          .notice-progress-bar {
            height: 100%;
            transition-property: width;
            transition-timing-function: linear;
          }

          @keyframes waveDrift {
            0% {
              transform: rotate(90deg) translateY(0);
            }
            50% {
              transform: rotate(90deg) translateY(-2px);
            }
            100% {
              transform: rotate(90deg) translateY(0);
            }
          }

          @keyframes iconPulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.08);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes cardFloat {
            0% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-2px) scale(1);
            }
            100% {
              transform: translateY(0) scale(1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .topzyn-notice-card,
            .notice-visible,
            .notice-wave,
            .notice-icon-container,
            .notice-close,
            .notice-progress-bar {
              animation: none !important;
              transition-duration: 1ms !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
