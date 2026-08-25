import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 transition-opacity duration-300 ease-fluid hover:opacity-80">
        <span className="flex h-9 items-center rounded-md bg-white p-1 shadow-xs ring-1 ring-border">
          <Image
            src="/logo.png"
            alt=""
            width={1408}
            height={768}
            priority
            className="h-[26px] w-auto object-contain"
          />
        </span>
        <span className="text-xl font-bold tracking-tight">NearLeadsQ</span>
      </Link>
      {children}
    </div>
  );
}
