"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/availability", label: "Availability" },
  { href: "/reservations", label: "Reservations" },
  { href: "/resources", label: "Resources" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="sticky top-0 z-10 border-b border-indigo-100 bg-white/80 backdrop-blur">
      <nav
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-8 sm:py-3"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButtonRef.current?.focus();
          }
        }}
      >
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm text-white">
            R
          </span>
          Reserve
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-100 text-slate-700 hover:bg-indigo-50 lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span aria-hidden="true" className="flex w-5 flex-col gap-1">
            <span className={`h-0.5 w-full rounded bg-current transition-transform ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`h-0.5 w-full rounded bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-full rounded bg-current transition-transform ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </span>
        </button>
        <div
          id="primary-navigation"
          className={`${menuOpen ? "flex" : "hidden"} w-full flex-col gap-1 border-t border-indigo-100 pt-2 lg:flex lg:w-auto lg:flex-row lg:items-center lg:gap-2 lg:border-0 lg:pt-0`}
        >
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`w-full rounded-xl px-3 py-3 text-sm font-semibold transition lg:w-auto lg:rounded-full lg:py-1.5 ${
                  active
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}