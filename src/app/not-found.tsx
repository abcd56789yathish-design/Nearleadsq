import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-xl bg-white p-2 shadow-xs ring-1 ring-border">
        <Image
          src="/logo-square.png"
          alt="NearLeadsQ logo"
          width={256}
          height={256}
          priority
          className="size-full object-contain"
        />
      </span>
      <h1 className="mt-6 max-w-[680px] bg-gradient-to-r from-black to-[#666666] bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-white dark:to-[#9b9b9b]">
        This page is off the map
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you are looking for does not exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 py-2 text-base font-semibold text-primary-foreground shadow-xs transition-all duration-300 ease-fluid hover:bg-primary/90 active:scale-[0.98]"
      >
        <ArrowLeft />
        Back to home
      </Link>
    </div>
  );
}
