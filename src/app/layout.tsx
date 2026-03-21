import { ThemeProvider } from "@/components/provider/ThemeProvider"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"
import { Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets:  [ "latin" ],
})

export const metadata: Metadata = {
  title:       "Marketing Performance Dashboard",
  description: "Comprehensive dashboard for SEO, Ads, Conversion and HR KPIs",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html suppressHydrationWarning lang={locale}>
      <body
        className={`${outfit.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale}>
          <ThemeProvider
            disableTransitionOnChange
            enableSystem
            attribute={"class"}
            defaultTheme={"dark"}
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
