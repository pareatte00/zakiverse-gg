export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={"flex min-h-screen justify-center bg-stone-950"}>
      <div className={"relative flex w-full max-w-[480px] flex-col bg-stone-900 shadow-[0_0_80px_rgba(0,0,0,0.8)]"}>
        {children}
      </div>
    </div>
  )
}
