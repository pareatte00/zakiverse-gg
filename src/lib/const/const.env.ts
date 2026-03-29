export const Env = {
  mainUrl:          process.env.MAIN_URL!,
  apiUrl:           process.env.API_URL!,
  jikanApiUrl:      process.env.JIKAN_API_URL!,
  systemServiceKey: process.env.SYSTEM_SERVICE_KEY!,
  imgbbApiUrl:      process.env.IMGBB_API_URL!,
  imgbbApiKey:      process.env.IMGBB_API_KEY!,
  public:           {
    api:     process.env.NEXT_PUBLIC_API_URL!,
    discord: {
      clientId:    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
      redirectUri: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!,
    },
  },
} as const
