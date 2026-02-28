"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { TopzynNotice } from "@/components/ui/topzyn-notice";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "History", href: "/riwayat" },
  { label: "Kalkulator", href: "/kalkulator" },
] as const;

type ProfileData = {
  id: number;
  username: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  totalTopUp: number;
  createdAt: string;
};

type ProfileResponse = {
  status: "success" | "error";
  message?: string;
  profile?: ProfileData;
};

type PasswordResponse = {
  status: "success" | "error";
  message?: string;
};

type ProfileTransaction = {
  orderNumber: string;
  itemName: string;
  itemImageUrl: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  target: string;
  paymentMethod: string | null;
};

type TransactionResponse = {
  status: "success" | "error";
  message?: string;
  transactions?: ProfileTransaction[];
};

type NotificationState = {
  type: "success" | "error";
  title: string;
  message: string;
} | null;

const HISTORY_PAGE_SIZE = 5;

function redirectToLoginWithNotice() {
  const params = new URLSearchParams({
    type: "error",
    title: "Akses Ditolak",
    message: "Silakan login dulu untuk membuka halaman akun.",
  });
  window.location.href = `/login?${params.toString()}`;
}

function redirectToLoginAfterLogout() {
  const params = new URLSearchParams({
    type: "success",
    title: "Logout Berhasil",
    message: "Kamu sudah keluar dari akun.",
  });
  window.location.href = `/login?${params.toString()}`;
}

function FallbackImage({
  src,
  alt,
  className,
  fallback = "/images/1000x1000.jpg",
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallback) {
          setCurrentSrc(fallback);
        }
      }}
    />
  );
}

function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </Icon>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 20h16" />
      <path d="M7 17V9" />
      <path d="M12 17V5" />
      <path d="M17 17v-4" />
    </Icon>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v6l4 2" />
    </Icon>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8 7.5h8" />
      <path d="M8 11.5h.01" />
      <path d="M12 11.5h.01" />
      <path d="M16 11.5h.01" />
      <path d="M8 15.5h.01" />
      <path d="M12 15.5h.01" />
      <path d="M16 15.5h.01" />
    </Icon>
  );
}

function NavUserIcon({ className }: { className?: string }) {
  return (
    <span
      className={["iconify inline-block", className ?? ""].join(" ").trim()}
      data-icon="mdi:account-circle-outline"
      aria-hidden="true"
    />
  );
}

function formatJoinDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }
  return parsedDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }
  return parsedDate.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

function maskWithFiveStars(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const atIndex = trimmed.indexOf("@");
  if (atIndex > 0) {
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex);

    if (local.length <= 2) {
      return `${local}*****${domain}`;
    }

    if (local.length === 3) {
      return `${local.slice(0, 1)}*****${local.slice(-1)}${domain}`;
    }

    return `${local.slice(0, 2)}*****${local.slice(-2)}${domain}`;
  }

  if (trimmed.length <= 4) {
    return `${trimmed.slice(0, 1)}*****${trimmed.slice(-1)}`;
  }

  return `${trimmed.slice(0, 2)}*****${trimmed.slice(-2)}`;
}

function buildPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function resolveStatus(statusValue: string): {
  label: string;
  className: string;
} {
  const normalized = statusValue.toLowerCase();
  if (
    normalized.includes("completed") ||
    normalized.includes("success") ||
    normalized.includes("paid") ||
    normalized.includes("done") ||
    normalized.includes("lunas")
  ) {
    return {
      label: "COMPLETED",
      className:
        "border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]",
    };
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("batal") ||
    normalized.includes("expired") ||
    normalized.includes("hangus") ||
    normalized.includes("failed")
  ) {
    return {
      label: "CANCELED",
      className:
        "border border-rose-300 bg-rose-50 text-rose-700 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.08)]",
    };
  }

  return {
    label: "PENDING",
    className:
      "border border-amber-300 bg-amber-50 text-amber-700 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.08)]",
  };
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M16.86 3.49a2.1 2.1 0 0 1 2.97 2.97l-1.1 1.1-2.97-2.97 1.1-1.1Zm-2.51 2.5 2.97 2.97-8.62 8.62-3.6.62.62-3.6 8.63-8.61Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeIcon({ isVisible }: { isVisible: boolean }) {
  if (isVisible) {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path
          d="M2.2 12c1.4-4.2 5.3-7 9.8-7s8.4 2.8 9.8 7c-1.4 4.2-5.3 7-9.8 7s-8.4-2.8-9.8-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M3.4 3.4 20.6 20.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.2A10.5 10.5 0 0 1 12 5c4.5 0 8.4 2.8 9.8 7a10.7 10.7 0 0 1-2.5 3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 7.3A10.6 10.6 0 0 0 2.2 12c1.4 4.2 5.3 7 9.8 7 1.6 0 3.1-.4 4.4-1.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <span
      className="iconify inline-block h-10 w-10"
      data-icon="mdi:account-circle"
      aria-hidden="true"
    />
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <ellipse cx="12" cy="7" rx="7.5" ry="3.5" fill="currentColor" />
      <path
        d="M4.5 7v5c0 1.93 3.36 3.5 7.5 3.5s7.5-1.57 7.5-3.5V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4.5 12v5c0 1.93 3.36 3.5 7.5 3.5s7.5-1.57 7.5-3.5v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M10 4H5v16h5v-2H7V6h3V4Zm4.3 3.3-1.4 1.4 2.3 2.3H9v2h6.2l-2.3 2.3 1.4 1.4 4.7-4.7-4.7-4.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

type EditModalProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function EditModal({ title, children, onClose }: EditModalProps) {
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#111827]/55 px-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#293275]/20 bg-white p-5 shadow-2xl sm:p-6">
        <h2 className="text-lg font-bold text-[#293275]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [transactions, setTransactions] = useState<ProfileTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [isEmailVisible, setIsEmailVisible] = useState(false);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const [isEditUsernameOpen, setIsEditUsernameOpen] = useState(false);
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false);
  const [isEditPasswordOpen, setIsEditPasswordOpen] = useState(false);

  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [draftUsername, setDraftUsername] = useState("");
  const [draftPhoneNumber, setDraftPhoneNumber] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let disposed = false;

    const loadProfileAndHistory = async () => {
      try {
        const profileResponse = await fetch("/api/auth/profile", {
          method: "GET",
          cache: "no-store",
        });

        const profileData = (await profileResponse.json()) as ProfileResponse;

        if (disposed) {
          return;
        }

        if (profileResponse.status === 401) {
          redirectToLoginWithNotice();
          return;
        }

        if (
          !profileResponse.ok ||
          profileData.status !== "success" ||
          !profileData.profile
        ) {
          throw new Error(profileData.message ?? "Gagal memuat profil.");
        }

        setProfile(profileData.profile);
      } catch (error) {
        if (!disposed) {
          setNotification({
            type: "error",
            title: "Gagal Memuat",
            message:
              error instanceof Error ? error.message : "Terjadi kesalahan.",
          });
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }

      try {
        const transactionResponse = await fetch("/api/auth/profile/transactions", {
          method: "GET",
          cache: "no-store",
        });

        const transactionData =
          (await transactionResponse.json()) as TransactionResponse;

        if (disposed) {
          return;
        }

        if (transactionResponse.status === 401) {
          redirectToLoginWithNotice();
          return;
        }

        if (
          !transactionResponse.ok ||
          transactionData.status !== "success" ||
          !transactionData.transactions
        ) {
          throw new Error(
            transactionData.message ?? "Gagal memuat history transaksi.",
          );
        }

        setTransactions(transactionData.transactions);
      } catch (error) {
        if (!disposed) {
          setTransactions([]);
          setNotification({
            type: "error",
            title: "History Gagal Dimuat",
            message:
              error instanceof Error
                ? error.message
                : "Terjadi kesalahan saat memuat history.",
          });
        }
      } finally {
        if (!disposed) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadProfileAndHistory();

    return () => {
      disposed = true;
    };
  }, []);

  const joinDateLabel = useMemo(() => {
    if (!profile) {
      return "-";
    }
    return formatJoinDate(profile.createdAt);
  }, [profile]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(transactions.length / HISTORY_PAGE_SIZE));
  }, [transactions.length]);

  const visiblePageNumbers = useMemo(() => {
    return buildPageNumbers(currentHistoryPage, totalPages);
  }, [currentHistoryPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
    return transactions.slice(start, start + HISTORY_PAGE_SIZE);
  }, [currentHistoryPage, transactions]);

  useEffect(() => {
    if (currentHistoryPage > totalPages) {
      setCurrentHistoryPage(totalPages);
    }
  }, [currentHistoryPage, totalPages]);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", showLogoutConfirmModal);
    return () => document.body.classList.remove("overflow-hidden");
  }, [showLogoutConfirmModal]);

  useEffect(() => {
    if (!showLogoutConfirmModal) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoggingOut) {
        setShowLogoutConfirmModal(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showLogoutConfirmModal, isLoggingOut]);

  const openEditUsername = () => {
    if (!profile) {
      return;
    }
    setDraftUsername(profile.username);
    setIsEditUsernameOpen(true);
  };

  const openEditPhone = () => {
    if (!profile) {
      return;
    }
    setDraftPhoneNumber(profile.phoneNumber ?? "");
    setIsEditPhoneOpen(true);
  };

  const openEditPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsEditPasswordOpen(true);
  };

  const handleUsernameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || isSubmittingUsername) {
      return;
    }

    setIsSubmittingUsername(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: draftUsername,
        }),
      });

      const data = (await response.json()) as ProfileResponse;
      if (!response.ok || data.status !== "success" || !data.profile) {
        throw new Error(data.message ?? "Gagal menyimpan username.");
      }

      setProfile(data.profile);
      setIsEditUsernameOpen(false);
      setNotification({
        type: "success",
        title: "Berhasil",
        message: "Username sudah diperbarui.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        title: "Gagal Simpan",
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan username.",
      });
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const handlePhoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || isSubmittingPhone) {
      return;
    }

    setIsSubmittingPhone(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: draftPhoneNumber,
        }),
      });

      const data = (await response.json()) as ProfileResponse;
      if (!response.ok || data.status !== "success" || !data.profile) {
        throw new Error(data.message ?? "Gagal menyimpan nomor HP.");
      }

      setProfile(data.profile);
      setIsEditPhoneOpen(false);
      setNotification({
        type: "success",
        title: "Berhasil",
        message: "Nomor HP sudah diperbarui.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        title: "Gagal Simpan",
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan nomor HP.",
      });
    } finally {
      setIsSubmittingPhone(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({
        type: "error",
        title: "Validasi Gagal",
        message: "Konfirmasi password baru tidak cocok.",
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const response = await fetch("/api/auth/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = (await response.json()) as PasswordResponse;
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message ?? "Gagal memperbarui password.");
      }

      setIsEditPasswordOpen(false);
      setNotification({
        type: "success",
        title: "Berhasil",
        message: data.message ?? "Password berhasil diperbarui.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        title: "Gagal",
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat update password.",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }
    setShowLogoutConfirmModal(true);
  };

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) {
      return;
    }

    setShowLogoutConfirmModal(false);
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Gagal logout. Coba lagi.");
      }

      redirectToLoginAfterLogout();
    } catch (error) {
      setNotification({
        type: "error",
        title: "Logout Gagal",
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat logout.",
      });
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dfe5ff_0%,#f5f7ff_38%,#eef2ff_100%)] pb-[86px] text-[#101828] md:pb-0">
      <nav className="sticky top-0 z-[999] bg-[#293275] shadow-[0_8px_18px_rgba(14,16,22,0.08)]">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-4 px-4 md:h-[90px] md:px-6">
          <Link href="/" className="inline-flex items-center">
            <FallbackImage
              src="/images/title_logo_topzyn.png"
              alt="TopZyn"
              className="h-10 w-auto md:h-12"
            />
          </Link>

          <ul className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-base font-semibold text-white transition hover:text-[#ff711c] lg:text-lg"
                >
                  {item.label === "Home" ? (
                    <HomeIcon className="h-4 w-4" />
                  ) : item.label === "Leaderboard" ? (
                    <ChartIcon className="h-4 w-4" />
                  ) : item.label === "History" ? (
                    <HistoryIcon className="h-4 w-4" />
                  ) : (
                    <CalculatorIcon className="h-4 w-4" />
                  )}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white md:inline-flex"
          >
            <NavUserIcon className="h-4 w-4" />
            <span className="max-w-[140px] truncate">
              {profile?.username ?? "Profile"}
            </span>
          </Link>
        </div>

        <div className="flex h-[34px] items-center overflow-hidden border-t border-white/40 bg-[#293275] md:h-10">
          <div className="inline-block whitespace-nowrap pl-[100%] [animation:runningText_15s_linear_infinite]">
            <span className="inline-block px-5 text-sm font-bold text-white md:px-7 md:text-base">
              Kelola profil akun kamu dan cek history transaksi terbaru di
              TopZyn.
            </span>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
            <div className="h-[360px] animate-pulse rounded-2xl border border-[#293275]/20 bg-white/80" />
            <div className="h-[360px] animate-pulse rounded-2xl border border-[#293275]/20 bg-white/80" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
            <aside className="h-fit rounded-2xl border border-[#293275]/25 bg-[#243161] px-4 py-5 text-white sm:px-5">
              <div className="flex flex-col items-center text-center">
                  <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-white/10 text-blue-50">
                    <UserIcon />
                  </div>
                <div className="mt-3 flex items-center gap-2">
                  <h1 className="text-xl font-bold leading-none sm:text-2xl">
                    {profile.username}
                  </h1>
                  <button
                    type="button"
                    onClick={openEditUsername}
                    className="rounded-md border border-white/35 bg-white/10 p-1.5 text-white transition hover:bg-white/20"
                    aria-label="Edit username"
                  >
                    <PencilIcon />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                  <span className="max-w-[220px] truncate">
                    {isEmailVisible
                      ? profile.email
                      : maskWithFiveStars(profile.email)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEmailVisible((value) => !value)}
                    className="rounded-md p-1 text-blue-100 transition hover:bg-white/15 hover:text-white"
                    aria-label={
                      isEmailVisible ? "Sembunyikan email" : "Tampilkan email"
                    }
                  >
                    <EyeIcon isVisible={isEmailVisible} />
                  </button>
                </div>
                <p className="mt-2 text-xs text-blue-200">
                  Terdaftar sejak {joinDateLabel}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <article className="rounded-xl border border-white/20 bg-white/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                    Nomor HP{" "}
                    <span className="normal-case text-blue-200">(opsional)</span>
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-white">
                      {profile.phoneNumber || "Belum diisi"}
                    </p>
                    <button
                      type="button"
                      onClick={openEditPhone}
                      className="rounded-md border border-white/35 bg-white/10 p-1.5 text-white transition hover:bg-white/20"
                      aria-label="Edit nomor HP"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                </article>

                <article className="rounded-xl border border-[#ff711c]/55 bg-[#ff711c]/15 p-3">
                  <div className="flex items-center gap-2 text-orange-100">
                    <CoinIcon />
                    <p className="text-[11px] font-semibold uppercase tracking-wide">
                      Total Top Up
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-extrabold text-white">
                    {formatRupiah(profile.totalTopUp)}
                  </p>
                </article>

                <button
                  type="button"
                  onClick={openEditPassword}
                  className="flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  Ubah Password
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={[
                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                    isLoggingOut
                      ? "cursor-not-allowed bg-rose-200 text-rose-700"
                      : "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
                  ].join(" ")}
                >
                  <LogoutIcon />
                  {isLoggingOut ? "Processing..." : "Logout"}
                </button>
              </div>
            </aside>

            <section className="rounded-2xl border border-[#293275]/20 bg-white/95 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5e7ff] pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#1f285f] sm:text-xl">
                    History Transaksi
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Menampilkan history top up akun kamu.
                  </p>
                </div>
                {transactions.length > 0 ? (
                  <span className="rounded-full border border-[#cfd8ff] bg-[#edf1ff] px-3 py-1 text-xs font-semibold text-[#33407a]">
                    Halaman {currentHistoryPage}/{totalPages}
                  </span>
                ) : null}
              </div>

              {isHistoryLoading ? (
                <div className="mt-4 space-y-3">
                  <div className="h-24 animate-pulse rounded-xl bg-[#293275]/10" />
                  <div className="h-24 animate-pulse rounded-xl bg-[#293275]/10" />
                  <div className="h-24 animate-pulse rounded-xl bg-[#293275]/10" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-[#cfd8ff] bg-[#f7f9ff] p-4 text-center text-sm text-slate-600">
                  Belum ada transaksi untuk akun ini.
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {paginatedTransactions.map((transaction) => {
                      const statusView = resolveStatus(transaction.status);
                      return (
                        <article
                          key={transaction.orderNumber}
                          className="rounded-xl border border-[#dbe3ff] bg-[#f8faff] p-3"
                        >
                          <div className="flex gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#d1d9ff] bg-white">
                              <img
                                src={
                                  transaction.itemImageUrl ||
                                  "/images/mobile_legend_logo.png"
                                }
                                alt={transaction.itemName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#1f285f] sm:text-base">
                                    {transaction.itemName}
                                  </p>
                                  <p className="truncate text-xs font-semibold text-[#4a5ea7]">
                                    {transaction.orderNumber}
                                  </p>
                                </div>
                                <span
                                  className={[
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide sm:text-[11px]",
                                    statusView.className,
                                  ].join(" ")}
                                >
                                  {statusView.label}
                                </span>
                              </div>

                              <p className="mt-1 text-[11px] text-slate-600 sm:text-xs">
                                Tujuan: {transaction.target}
                              </p>
                              {transaction.paymentMethod ? (
                                <p className="text-[11px] text-slate-500 sm:text-xs">
                                  Metode: {transaction.paymentMethod}
                                </p>
                              ) : null}

                              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-extrabold text-[#1f285f] sm:text-base">
                                    {formatRupiah(transaction.totalAmount)}
                                  </p>
                                  <p className="text-[11px] text-slate-500 sm:text-xs">
                                    {formatDateTime(transaction.createdAt)}
                                  </p>
                                </div>
                                <Link
                                  href={`/invoice/${encodeURIComponent(transaction.orderNumber)}`}
                                  className="rounded-lg border border-[#ff711c] px-3 py-1.5 text-xs font-bold text-[#ff711c] transition hover:bg-[#ff711c] hover:text-white"
                                >
                                  Lihat Detail
                                </Link>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {transactions.length > HISTORY_PAGE_SIZE ? (
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentHistoryPage((page) => Math.max(1, page - 1))
                        }
                        disabled={currentHistoryPage === 1}
                        className={[
                          "h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition sm:h-9 sm:min-w-9 sm:text-sm",
                          currentHistoryPage === 1
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-[#d5ddff] bg-white text-[#33407a] hover:bg-[#edf1ff]",
                        ].join(" ")}
                        aria-label="Halaman sebelumnya"
                      >
                        {"<"}
                      </button>

                      {visiblePageNumbers.map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setCurrentHistoryPage(pageNumber)}
                          className={[
                            "h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition sm:h-9 sm:min-w-9 sm:text-sm",
                            pageNumber === currentHistoryPage
                              ? "border-[#293275] bg-[#293275] text-white"
                              : "border-[#d5ddff] bg-white text-[#33407a] hover:bg-[#edf1ff]",
                          ].join(" ")}
                        >
                          {pageNumber}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentHistoryPage((page) =>
                            Math.min(totalPages, page + 1),
                          )
                        }
                        disabled={currentHistoryPage === totalPages}
                        className={[
                          "h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition sm:h-9 sm:min-w-9 sm:text-sm",
                          currentHistoryPage === totalPages
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-[#d5ddff] bg-white text-[#33407a] hover:bg-[#edf1ff]",
                        ].join(" ")}
                        aria-label="Halaman berikutnya"
                      >
                        {">"}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Gagal memuat profil. Coba refresh halaman.
          </div>
        )}

      </section>

      <div className="fixed inset-x-0 bottom-0 z-[998] flex h-[76px] items-center justify-around bg-white px-2 shadow-[0_-8px_18px_rgba(14,16,22,0.08)] md:hidden">
        <Link
          href="/"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <HomeIcon className="h-[22px] w-[22px]" />
          <span>Home</span>
        </Link>
        <Link
          href="/leaderboard"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <ChartIcon className="h-[22px] w-[22px]" />
          <span>Leaderboard</span>
        </Link>
        <Link
          href="/riwayat"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <HistoryIcon className="h-[22px] w-[22px]" />
          <span>History</span>
        </Link>
        <Link
          href="/kalkulator"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-slate-500"
        >
          <CalculatorIcon className="h-[22px] w-[22px]" />
          <span>Kalkulator</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-1 flex-col items-center gap-1.5 text-xs font-bold text-[#293275]"
        >
          <NavUserIcon className="h-[22px] w-[22px]" />
          <span>Profile</span>
        </Link>
      </div>

      <footer className="mt-10 bg-white text-white md:mt-16">
        <div className="w-full overflow-hidden">
          <FallbackImage
            src="/images/footer_banner_topzyn.png"
            alt="Footer Visual"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="-mt-1 bg-[#293275] px-4 pb-10 pt-14 md:pt-16">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-white/80 md:mb-12 md:text-xl">
              TopZyn adalah sahabat para gamers dan platform top up game
              terpercaya di Indonesia.
            </p>

            <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-2 md:text-left lg:grid-cols-4">
              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Peta Situs
                </h4>
                <Link
                  href="/"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Beranda
                </Link>
                <Link
                  href="/login"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Daftar
                </Link>
                <Link
                  href="/riwayat"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Cek Transaksi
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Dukungan
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  WhatsApp
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Email
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Instagram
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Legalitas
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Syarat & Ketentuan
                </Link>
              </div>

              <div>
                <h4 className="mb-3 text-xl font-bold text-[#ff711c]">
                  Sosial Media
                </h4>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  TikTok
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Instagram
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  Discord
                </Link>
                <Link
                  href="#"
                  className="mb-2 block text-base text-white transition hover:translate-x-1"
                >
                  YouTube
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showLogoutConfirmModal ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#111827]/55 px-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isLoggingOut) {
              setShowLogoutConfirmModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logoutConfirmTitle"
            className="w-full max-w-[420px] rounded-2xl border border-[#293275]/20 bg-white px-6 py-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-[78px] w-[78px] items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10">
                <path
                  d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 13h-1v-2h2v2h-1zm1-4h-2V7h2v4z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3
              id="logoutConfirmTitle"
              className="text-xl font-bold text-[#1f285f] sm:text-2xl"
            >
              Yakin mau logout?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Kamu bisa login lagi kapan saja.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Gajadi
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Memproses..." : "Tetap logout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditUsernameOpen ? (
        <EditModal
          title="Edit Username"
          onClose={() => setIsEditUsernameOpen(false)}
        >
          <form className="mt-4 space-y-3" onSubmit={handleUsernameSubmit}>
            <div>
              <label
                htmlFor="edit-username"
                className="text-sm font-semibold text-slate-700"
              >
                Username
              </label>
              <input
                id="edit-username"
                type="text"
                value={draftUsername}
                onChange={(event) => setDraftUsername(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                required
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditUsernameOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingUsername}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
                  isSubmittingUsername
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-[#293275] hover:bg-[#202960]",
                ].join(" ")}
              >
                {isSubmittingUsername ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </EditModal>
      ) : null}

      {isEditPhoneOpen ? (
        <EditModal
          title="Edit Nomor HP"
          onClose={() => setIsEditPhoneOpen(false)}
        >
          <form className="mt-4 space-y-3" onSubmit={handlePhoneSubmit}>
            <div>
              <label htmlFor="edit-phone" className="text-sm font-semibold text-slate-700">
                Nomor HP <span className="text-slate-400">(opsional)</span>
              </label>
              <input
                id="edit-phone"
                type="text"
                inputMode="numeric"
                value={draftPhoneNumber}
                onChange={(event) => setDraftPhoneNumber(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                placeholder="08xxxx"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditPhoneOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPhone}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
                  isSubmittingPhone
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-[#293275] hover:bg-[#202960]",
                ].join(" ")}
              >
                {isSubmittingPhone ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </EditModal>
      ) : null}

      {isEditPasswordOpen ? (
        <EditModal
          title="Edit Password"
          onClose={() => setIsEditPasswordOpen(false)}
        >
          <form className="mt-4 space-y-3" onSubmit={handlePasswordSubmit}>
            <div>
              <label
                htmlFor="current-password"
                className="text-sm font-semibold text-slate-700"
              >
                Password Lama
              </label>
              <div className="relative mt-1">
                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  aria-label={
                    showCurrentPassword
                      ? "Sembunyikan password lama"
                      : "Lihat password lama"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#293275]"
                >
                  <EyeIcon isVisible={showCurrentPassword} />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="text-sm font-semibold text-slate-700">
                Password Baru
              </label>
              <div className="relative mt-1">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  aria-label={
                    showNewPassword
                      ? "Sembunyikan password baru"
                      : "Lihat password baru"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#293275]"
                >
                  <EyeIcon isVisible={showNewPassword} />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="text-sm font-semibold text-slate-700"
              >
                Konfirmasi Password Baru
              </label>
              <div className="relative mt-1">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm outline-none transition focus:border-[#293275] focus:ring-2 focus:ring-[#293275]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan konfirmasi password"
                      : "Lihat konfirmasi password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#293275]"
                >
                  <EyeIcon isVisible={showConfirmPassword} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditPasswordOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
                  isSubmittingPassword
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-[#293275] hover:bg-[#202960]",
                ].join(" ")}
              >
                {isSubmittingPassword ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </EditModal>
      ) : null}

      <TopzynNotice
        open={Boolean(notification)}
        tone={notification?.type === "success" ? "success" : "error"}
        title={notification?.title ?? ""}
        message={notification?.message ?? ""}
        autoHideMs={5000}
        onClose={() => setNotification(null)}
      />
    </main>
  );
}

