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
  Admin:      "/admin",
} as const

export const Admin = {
  Dashboard: "/admin",
  Cards:     {
    Create:  "/admin/cards/create",
    Draft:   "/admin/cards/create/draft",
    Builder: "/admin/cards/create/builder",
  },
} as const

export const Route = {
  Public,
  Private,
  Admin,
} as const
