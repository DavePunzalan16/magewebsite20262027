import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <Image
        src="/images/mageicon.jpg"
        alt="M.A.G.E. Guild"
        width={80}
        height={80}
        className="mb-6 rounded-full opacity-60"
      />
      <h1 className="mb-2 font-display text-[64px] text-primary">404</h1>
      <h2 className="mb-4 font-display text-[28px] text-white">Page Not Found</h2>
      <p className="mb-8 max-w-[400px] font-body text-[16px] text-offwhite">
        The spell you cast led to a void. This page doesn&apos;t exist in our realm.
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-3 font-body text-[14px] font-bold uppercase text-black transition-all hover:bg-primary/90"
      >
        Return to Guild Hall
      </Link>
    </div>
  );
}
