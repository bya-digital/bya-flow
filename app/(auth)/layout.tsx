import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex flex-col items-center gap-2">
          <Image
            src="/logo-mark.png"
            alt=""
            width={56}
            height={56}
            unoptimized
            className="rounded-xl"
          />
          <span className="text-xl font-bold text-brand-600">BYA Flow</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
