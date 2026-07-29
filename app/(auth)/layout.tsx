export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)]"
      />
      <div className="absolute top-8 left-8">
        <span className="font-serif text-lg tracking-tight italic">CM OS</span>
      </div>
      <div className="w-full max-w-[380px]">{children}</div>
    </div>
  );
}
