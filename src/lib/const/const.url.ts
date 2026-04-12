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
    List:    "/admin/cards",
    Create:  "/admin/cards/create",
    Builder: "/admin/cards/create/builder",
    Edit:    (id: string) => `/admin/cards/${id}/edit` as const,
  },
  Tags: {
    List:   "/admin/tags",
    Detail: (id: string) => `/admin/tags/${id}` as const,
  },
  Packs: {
    List:   "/admin/packs",
    Create: "/admin/packs/create",
    Edit:   (id: string) => `/admin/packs/${id}/edit` as const,
  },
  Pools: {
    List:   "/admin/pools",
    Create: "/admin/pools/create",
    Edit:   (id: string) => `/admin/pools/${id}/edit` as const,
  },
} as const

export const Route = {
  Public,
  Private,
  Admin,
} as const
