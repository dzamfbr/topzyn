"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { TopzynNotice } from "@/components/ui/topzyn-notice";

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

type NotificationState = {
  type: "success" | "error";
  title: string;
  message: string;
} | null;

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

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.floor(value)).toLocaleString("id-ID")}`;
}

function MaskedPassword() {
  return <span className="tracking-[0.32em]">********</span>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>(null);

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

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as ProfileResponse;

        if (disposed) {
          return;
        }

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok || data.status !== "success" || !data.profile) {
          throw new Error(data.message ?? "Gagal memuat profil.");
        }

        setProfile(data.profile);
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
    };

    void loadProfile();

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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#e8ecff_0%,#f8fafc_38%,#eef2ff_100%)] px-3 py-5 sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-[#293275]/20 bg-white/95 p-4 shadow-[0_20px_50px_rgba(41,50,117,0.14)] backdrop-blur sm:rounded-3xl sm:p-8">
        <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
          <div className="relative mb-3">
            <div className="absolute -inset-2 rounded-full bg-[#293275]/15 blur-md" />
            <Image
              src="/images/user_icon_topzyn.png"
              alt="Profile icon"
              width={92}
              height={92}
              className="relative h-[72px] w-[72px] rounded-full border-2 border-[#293275]/20 object-cover sm:h-[92px] sm:w-[92px]"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-[#1b2454] sm:text-2xl">
            Akun Saya
          </h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Sejak {joinDateLabel}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-xl bg-[#293275]/10" />
            <div className="h-16 animate-pulse rounded-xl bg-[#293275]/10" />
            <div className="h-16 animate-pulse rounded-xl bg-[#293275]/10" />
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <article className="rounded-xl border border-[#293275]/20 bg-[#293275] px-3 py-2.5 text-white sm:px-4 sm:py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100 sm:text-xs">
                    Username
                  </p>
                  <p className="mt-1 text-xs font-bold sm:text-sm">
                    {profile.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openEditUsername}
                  className="rounded-lg bg-[#ff711c] p-2 text-white transition hover:bg-[#e86417]"
                  aria-label="Edit username"
                >
                  <PencilIcon />
                </button>
              </div>
            </article>

            <article className="rounded-xl border border-[#293275]/15 bg-[#eef2ff] px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#47518a] sm:text-xs">
                    Email
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#1f2a5f] sm:text-sm">
                    {profile.email}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-[#ff711c]/30 bg-[#fff4eb] px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#bb5516] sm:text-xs">
                    Password
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#7f380f] sm:text-sm">
                    <MaskedPassword />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openEditPassword}
                  className="rounded-lg border border-[#ff711c] bg-white p-2 text-[#d86216] transition hover:bg-[#ff711c] hover:text-white"
                  aria-label="Edit password"
                >
                  <PencilIcon />
                </button>
              </div>
            </article>

            <article className="rounded-xl border border-[#293275]/20 bg-[#eaf1ff] px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#47518a] sm:text-xs">
                    Nomor HP{" "}
                    <span className="normal-case text-[#64748b]">
                      (opsional)
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#1f2a5f] sm:text-sm">
                    {profile.phoneNumber || "Belum diisi"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openEditPhone}
                  className="rounded-lg border border-[#293275]/30 bg-white p-2 text-[#2a356f] transition hover:bg-[#293275] hover:text-white"
                  aria-label="Edit nomor HP"
                >
                  <PencilIcon />
                </button>
              </div>
            </article>

            <article className="rounded-xl border border-[#293275]/20 bg-[linear-gradient(135deg,#293275,#3947a6)] px-3 py-2.5 sm:px-4 sm:py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-100 sm:text-xs">
                Total Top Up
              </p>
              <p className="mt-1 text-sm font-extrabold text-white sm:text-base">
                {formatRupiah(profile.totalTopUp)}
              </p>
            </article>

            <div className="pt-1 sm:pt-2">
              <Link
                href="/"
                className="flex w-full items-center justify-center rounded-xl bg-[#293275] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#222b66] sm:py-3 sm:text-sm"
              >
                Kembali ke Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Gagal memuat profil. Coba refresh halaman.
          </div>
        )}
      </section>

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
              <label
                htmlFor="edit-phone"
                className="text-sm font-semibold text-slate-700"
              >
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
              <label
                htmlFor="new-password"
                className="text-sm font-semibold text-slate-700"
              >
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
