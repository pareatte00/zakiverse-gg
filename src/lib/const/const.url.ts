export const Public = {
  Login:           "/login",
  DiscordCallback: "/auth/discord/callback",
} as const

export const Private = {
  Home:       "/",
  Collection: "/collection",
  Packs:      "/packs",
  Shop:       "/shop",
  Profile:    "/profile",
} as const

export const Route = {
  Public,
  Private,
} as const
