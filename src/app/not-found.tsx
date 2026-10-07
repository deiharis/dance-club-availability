import Link from "next/link";
import { Compass } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

// Unknown address: a branded page with a way back, instead of the default 404.
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6 text-white">
      <div className="page-enter w-full max-w-md text-center">
        <div className="flex justify-center"><LogoMark size={44} /></div>
        <span className="mx-auto mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
          <Compass size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">This page does not exist</h1>
        <p className="mt-2 text-sm text-zinc-400">The link may be old or mistyped. Head back to your home page.</p>
        <Link href="/" className="press mt-6 inline-block rounded-full bg-gradient-to-b from-amber-300 to-orange-500 px-6 py-2.5 text-sm font-semibold text-black">
          Go to my home page
        </Link>
      </div>
    </div>
  );
}
