"use client";

import Link from "next/link";
import {signOut, useSession} from "next-auth/react";
import {useEffect} from "react";
import BrandLogo from "@/components/BrandLogo";

export type AppView =
  | {type: "dashboard"}
  | {type: "guide"}
  | {type: "history"}
  | {type: "add"};

type SidebarProps = {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  historyCount: number;
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({
  activeView,
  onChangeView,
  historyCount,
  open,
  onClose,
}: SidebarProps) {
  const {data: session, status} = useSession();
  const isSignedIn = status === "authenticated";

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("menu-open");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("menu-open");
    };
  }, [open, onClose]);

  const selectView = (view: AppView) => {
    onChangeView(view);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Zamknij menu"
        className={`sidebar-backdrop ${open ? "is-open" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="relative overflow-hidden border-b border-white/10 px-5 py-5 sm:px-6 sm:py-7">
          <div className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-accent-strong/20 blur-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <BrandLogo size={44} showWordmark inverted />
              <p className="mt-1 text-sm text-white/55">
                Twój portfel w jednym rytmie
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="sidebar-close lg:hidden"
              aria-label="Zamknij menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-3 py-6">
          <div>
            <p className="section-label mb-2 px-3 text-white/40">Menu</p>
            <button
              type="button"
              onClick={() => selectView({type: "dashboard"})}
              className={`nav-item ${
                activeView.type === "dashboard"
                  ? "nav-item-active"
                  : "text-white/70"
              }`}
            >
              Pulpit
            </button>
            <button
              type="button"
              onClick={() => selectView({type: "history"})}
              className={`nav-item mt-1 ${
                activeView.type === "history"
                  ? "nav-item-active"
                  : "text-white/70"
              }`}
            >
              <span>Historia</span>
              <span className="mono-figure text-xs text-white/40">
                {historyCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => selectView({type: "guide"})}
              className={`nav-item mt-1 ${
                activeView.type === "guide"
                  ? "nav-item-active"
                  : "text-white/70"
              }`}
            >
              Instrukcja zakupu
            </button>
          </div>

          <div className="mt-auto space-y-4">
            <div>
              <p className="section-label mb-2 px-3 text-white/40">Akcje</p>
              <button
                type="button"
                onClick={() => selectView({type: "add"})}
                className={`nav-item ${
                  activeView.type === "add"
                    ? "bg-accent-strong text-white shadow-none"
                    : "border border-white/10 text-white/80 hover:bg-white/5"
                }`}
              >
                Dodaj transakcję
              </button>
            </div>

            <div className="border-t border-white/10 px-3 pt-4">
              <p className="section-label mb-3 text-white/40">Konto</p>
              {isSignedIn ? (
                <div className="space-y-3">
                  <div>
                    <p className="truncate text-sm font-medium text-white">
                      {session?.user?.name ?? "Użytkownik"}
                    </p>
                    <p className="truncate text-xs text-white/45">
                      {session?.user?.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void signOut({callbackUrl: "/", redirect: true});
                    }}
                    className="nav-item border border-white/10 text-white/80 hover:bg-white/5"
                  >
                    Wyloguj się
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sign-in"
                    className="nav-item border border-white/10 text-white/80 hover:bg-white/5"
                    onClick={onClose}
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href="/sign-up"
                    className="nav-item bg-accent-strong text-white shadow-none"
                    onClick={onClose}
                  >
                    Załóż konto
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
