"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/data-sources", label: "Data sources" },
];

export function IslandNav({ authed }: { authed: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
        <nav
          aria-label="Main"
          className="pointer-events-auto flex w-full max-w-max items-center justify-between gap-8 rounded-full border border-border bg-card/70 py-2 pl-4 pr-2 shadow-xs backdrop-blur-xl transition-all duration-700 ease-fluid"
        >
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-8 items-center rounded-md bg-white p-0.5 shadow-xs ring-1 ring-border">
              <Image
                src="/logo.png"
                alt=""
                width={1408}
                height={768}
                priority
                className="h-[22px] w-auto object-contain"
              />
            </span>
            <span className="text-base font-semibold tracking-tight">NearLeadsQ</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors duration-300 ease-fluid hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 text-sm md:flex">
            {authed ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition-all duration-300 ease-fluid hover:bg-primary/90 active:scale-[0.98]"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-xs transition-all duration-300 ease-fluid hover:bg-primary/90 active:scale-[0.98]"
                >
                  Start free
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="relative mr-2 flex size-9 items-center justify-center rounded-full transition-colors duration-300 ease-fluid hover:bg-secondary active:scale-[0.98] md:hidden"
          >
            <span className="relative block size-5">
              <span
                className={`absolute left-0 block h-[1.5px] w-5 bg-current transition-all duration-500 ease-fluid ${
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[4px]"
                }`}
              />
              <span
                className={`absolute left-0 block h-[1.5px] w-5 bg-current transition-all duration-500 ease-fluid ${
                  open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[13px]"
                }`}
              />
            </span>
          </button>
        </nav>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background/80 backdrop-blur-3xl md:hidden">
          <div className="flex flex-col items-center gap-7 text-lg">
            {LINKS.map((link, i) => (
              <span
                key={link.href}
                className={`transition-all duration-700 ease-fluid ${
                  open
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0"
                } ${i === 0 ? "delay-100" : i === 1 ? "delay-150" : i === 2 ? "delay-200" : "delay-300"}`}
              >
                <Link href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
          <div
            className={`flex flex-col items-center gap-4 transition-all duration-700 ease-fluid delay-300 ${
              open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
          >
            <Link
              href={authed ? "/dashboard" : "/signup"}
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground active:scale-[0.98]"
            >
              {authed ? "Open dashboard" : "Start free"}
            </Link>
            {!authed && (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
