export default function NoSidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className={"w-full"}>
      {children}
    </main>
  )
}
