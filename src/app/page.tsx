import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <Image
          src="/cb-logo.svg"
          alt="ControlBits logo"
          width={120}
          height={120}
          priority
        />
        <h1 className="text-4xl font-semibold tracking-tight">ControlBits</h1>
        <p className="max-w-xl text-base text-zinc-600">
          A simple habit tracker to help you build good habits. More features coming soon.
        </p>
      </main>
    </div>
  );
}
