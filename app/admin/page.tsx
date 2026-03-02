"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type AdminMeResponse = {
  status: "success" | "error";
  user?: AdminUser;
  message?: string;
};

const ADMIN_MENU_ITEMS = [
  { key: "menu-1", label: "Menu 1", icon: "mdi:view-dashboard-outline" },
  { key: "menu-2", label: "Menu 2", icon: "mdi:clipboard-text-outline" },
  { key: "menu-3", label: "Menu 3", icon: "mdi:wallet-outline" },
  { key: "menu-4", label: "Menu 4", icon: "mdi:account-group-outline" },
  { key: "menu-5", label: "Menu 5", icon: "mdi:cog-outline" },
];

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuKey, setActiveMenuKey] = useState(ADMIN_MENU_ITEMS[0].key);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const activeMenuLabel = useMemo(
    () =>
      ADMIN_MENU_ITEMS.find((item) => item.key === activeMenuKey)?.label ??
      ADMIN_MENU_ITEMS[0].label,
    [activeMenuKey],
  );

  useEffect(() => {
    let disposed = false;

    const loadAdmin = async () => {
      try {
        const response = await fetch("/api/admin/me", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as AdminMeResponse;

        if (disposed) return;

        if (!response.ok || data.status !== "success" || !data.user) {
          window.location.href = "/login?error=admin";
          return;
        }

        setAdmin(data.user);
      } catch {
        if (!disposed) {
          window.location.href = "/login?error=admin";
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void loadAdmin();

    return () => {
      disposed = true;
    };
  }, []);

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore and continue to redirect
    } finally {
      window.location.href = "/?logout=1";
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-white to-[#f8faff] p-2 md:p-0">
        <div className="px-4 py-4 md:px-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#293275]/20" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-white to-[#f8faff] p-2 pb-20 md:p-0 md:pb-0">
      <div className="flex w-full flex-col gap-3 md:flex-row md:gap-4">
        <aside className="flex w-full flex-col rounded-3xl bg-[#293275] p-4 text-white shadow-[0_24px_50px_rgba(41,50,117,0.28)] md:sticky md:top-0 md:h-screen md:w-[240px] md:rounded-l-none md:rounded-r-3xl md:p-5 lg:w-[250px] xl:w-[260px]">
          <div className="flex min-h-12 items-center justify-between gap-2 md:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <span
                  className="iconify h-6 w-6 text-white"
                  data-icon="fa6-solid:user-tie"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold leading-tight">
                  {admin?.username ?? "Admin"}
                </p>
                <p className="truncate text-[11px] text-white/80 leading-tight">
                  {admin?.email ?? "-"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/70 bg-red-600 px-2.5 text-[11px] font-bold text-white transition hover:bg-red-700"
            >
              <span
                className="iconify h-4 w-4"
                data-icon="mdi:logout-variant"
                aria-hidden="true"
              />
              Logout
            </button>
          </div>

          <div className="mt-3 hidden h-16 w-16 items-center justify-center rounded-full bg-white/15 md:inline-flex">
            <span
              className="iconify h-9 w-9 text-white"
              data-icon="fa6-solid:user-tie"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-3 hidden text-lg font-extrabold tracking-tight md:block">
            {admin?.username ?? "Admin"}
          </h1>
          <p className="mt-0.5 hidden text-xs text-white/80 md:block">
            {admin?.email ?? "-"}
          </p>

          <nav className="mt-6 hidden flex-col gap-2 md:flex">
            {ADMIN_MENU_ITEMS.map((item) => {
              const isActive = item.key === activeMenuKey;
              return (
                <Link
                  key={item.key}
                  href={`/admin#${item.key}`}
                  onClick={() => setActiveMenuKey(item.key)}
                  className={[
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition",
                    isActive
                      ? "bg-[#ff711c] text-white shadow-[0_10px_24px_rgba(255,113,28,0.35)]"
                      : "bg-white/5 text-white/85 hover:bg-white/10",
                  ].join(" ")}
                >
                  <span
                    className="iconify h-5 w-5"
                    data-icon={item.icon}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="mt-auto hidden items-center gap-2.5 rounded-lg border border-red-500/70 bg-red-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 md:inline-flex"
          >
            <span
              className="iconify h-4 w-4"
              data-icon="mdi:logout-variant"
              aria-hidden="true"
            />
            Logout
          </button>
        </aside>

        <section className="w-full rounded-3xl border border-[#293275]/12 bg-white p-5 shadow-[0_20px_44px_rgba(15,23,42,0.08)] md:my-4 md:mr-4 md:flex-1">
          <div className="rounded-2xl border border-dashed border-[#293275]/25 bg-[#f8f9ff] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#293275]/65">
              Panel Admin
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#293275]">
              {activeMenuLabel}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Struktur sidebar admin sudah siap. Menu kamu sudah disiapkan 5
              link dan bisa kita isi fitur satu per satu di langkah berikutnya.
            </p>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-2 bottom-2 z-[1000] grid grid-cols-5 gap-1.5 rounded-2xl border border-white/30 bg-[#293275]/95 p-1.5 shadow-[0_18px_32px_rgba(17,24,39,0.28)] backdrop-blur md:hidden">
        {ADMIN_MENU_ITEMS.map((item) => {
          const isActive = item.key === activeMenuKey;
          return (
            <Link
              key={`mobile-${item.key}`}
              href={`/admin#${item.key}`}
              onClick={() => setActiveMenuKey(item.key)}
              className={[
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center transition",
                isActive
                  ? "bg-[#ff711c] text-white"
                  : "text-white/90 hover:bg-white/10",
              ].join(" ")}
            >
              <span
                className="iconify h-[18px] w-[18px]"
                data-icon={item.icon}
                aria-hidden="true"
              />
              <span className="truncate text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {showLogoutConfirm ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_32px_70px_rgba(15,23,42,0.28)]">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4e8] text-[#ff711c]">
              <span
                className="iconify h-8 w-8"
                data-icon="mdi:logout-variant"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-center text-xl font-extrabold text-slate-900">
              Yakin mau logout?
            </h3>
            <p className="mt-1.5 text-center text-sm text-slate-500">
              Sesi admin akan diakhiri dari perangkat ini.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
                className={[
                  "rounded-xl px-4 py-2.5 text-sm font-bold text-white transition",
                  isLoggingOut
                    ? "cursor-not-allowed bg-[#ff711c]/70"
                    : "bg-[#ff711c] hover:bg-[#e25f13]",
                ].join(" ")}
              >
                {isLoggingOut ? "Keluar..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
