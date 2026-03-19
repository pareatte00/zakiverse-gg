import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return []
  },
  images: {
    remotePatterns: [],
  },
  devIndicators: false,
}
const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
