"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Check,
  CreditCard,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Users,
  MessageSquareText,
  LogOut,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth-actions";
import {
  createWorkspace,
  switchWorkspace,
} from "@/app/actions/workspace-actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "New search", icon: Search },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/templates", label: "Templates", icon: MessageSquareText },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null };
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string;
  followUpsDue?: number;
}

export function AppSidebar(props: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <SidebarBody {...props} />
    </aside>
  );
}

function SidebarBody({
  user,
  workspaces,
  activeWorkspaceId,
  followUpsDue,
  onNavigate,
  onClose,
}: SidebarProps & { onNavigate?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const ITEM_STRIDE = 40; // h-9 item + gap-1

  function select(id: string) {
    if (id === activeWorkspaceId || id === "__new") return;
    startTransition(() => void switchWorkspace(id));
  }

  function submitNew() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(() => {
      void createWorkspace(trimmed).then((result) => {
        if (result?.error) {
          setAddError(result.error);
          return;
        }
        setName("");
        setAdding(false);
        setAddError(null);
      });
    });
  }

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex flex-1 items-center gap-2"
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
          <span className="text-base font-bold tracking-tight">NearLeadsQ</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-1 flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X />
          </button>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-1.5 border-b border-border px-3 py-3",
          pending && "opacity-60"
        )}
      >
        <label className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Client workspace
        </label>
        <select
          value={activeWorkspaceId}
          onChange={(e) => select(e.target.value)}
          disabled={pending}
          aria-label="Active client workspace"
          className="h-9 w-full cursor-pointer appearance-none rounded-md border border-input bg-card px-2 text-sm font-medium shadow-xs transition-colors duration-300 ease-fluid focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-wait"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
          <option value="__new" hidden>
            + New workspace…
          </option>
        </select>
        {adding ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNew();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Client name…"
              className="h-9 text-sm"
            />
            <Button size="icon" className="size-9 shrink-0" onClick={submitNew} aria-label="Create workspace">
              <Check />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-fit items-center gap-1 rounded px-1 py-1 text-xs text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Plus className="size-3.5" />
            New workspace
          </button>
        )}
        {addError && <p className="px-1 text-xs text-destructive">{addError}</p>}
      </div>

      <nav
        className="relative flex flex-col gap-1 p-3"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {(() => {
          const hovered = hoverIdx !== null ? nav[hoverIdx] : null;
          const hoveredActive =
            hovered &&
            (pathname === hovered.href || pathname.startsWith(hovered.href + "/"));
          return (
            hoverIdx !== null &&
            !hoveredActive && (
              <span
                aria-hidden
                className="absolute inset-x-3 top-3 h-9 rounded-md bg-secondary transition-transform duration-300 ease-fluid"
                style={{ transform: `translateY(${hoverIdx * ITEM_STRIDE}px)` }}
              />
            )
          );
        })()}
        {nav.map((item, i) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              onMouseEnter={() => setHoverIdx(i)}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
              className={cn(
                "relative z-10 flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-300 ease-fluid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-secondary-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {item.href === "/leads" && (followUpsDue ?? 0) > 0 ? (
                <span
                  className="ml-auto rounded-full bg-warning/15 px-1.5 py-px font-mono text-[10px] font-medium leading-4 tabular-nums text-warning"
                  title={`${followUpsDue} follow-up${followUpsDue === 1 ? "" : "s"} due`}
                >
                  {followUpsDue}
                </span>
              ) : (
                active && (
                  <span className="ml-auto size-1.5 rounded-full bg-accent-foreground" aria-hidden />
                )
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border p-4">
        <div className="mb-3 truncate text-sm">
          <span className="block font-medium">{user.name ?? "User"}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </div>
        <form action={signOutAction}>
          <Button variant="outline" size="sm" type="submit" className="w-full">
            <LogOut />
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}

export function MobileNav(props: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (!Object.is(prevPathname, pathname)) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card px-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="size-10"
        >
          <Menu />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 items-center rounded-md bg-white p-0.5 shadow-xs ring-1 ring-border">
            <Image
              src="/logo.png"
              alt=""
              width={1408}
              height={768}
              priority
              className="h-[18px] w-auto object-contain"
            />
          </span>
          <span className="text-base font-bold tracking-tight">NearLeadsQ</span>
        </Link>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="slide-in-left absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-card shadow-xl">
            <SidebarBody {...props} onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
