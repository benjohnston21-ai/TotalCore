export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-2xl font-bold tracking-tight">
          Total<span className="text-orange-600">Core</span>
        </p>
        <div className="card">{children}</div>
      </div>
    </main>
  );
}
