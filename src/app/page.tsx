import Link from "next/link";

// Temporary start page until we build Home in step 7.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">
        Fit<span className="text-accent">Shift</span>
      </h1>
      <Link href="/styleguide" className="text-sm text-muted underline">
        Open styleguide
      </Link>
    </main>
  );
}
