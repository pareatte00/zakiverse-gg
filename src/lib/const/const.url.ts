export const Website = {
  main:                 process.env.MAIN_URL,
  api:                  process.env.API_URL,
  apiFacebookAdScraper: process.env.API_FACEBOOK_AD_SCRAPER_URL,
}

export const Public = {
  Login: "/login",
} as const

export const Private = {

} as const

export const Route = {
  Website,
  Public,
  Private,
} as const
