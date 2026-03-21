"use server"

import { Env } from "@/lib/const/const.env"
import { api, HttpResponse } from "./api"

export interface AuthDiscordRequest {
  code: string
}

export interface AuthDiscordPayload {
  access_token: string
}

export async function authDiscord(param: AuthDiscordRequest) {
  return await api.post<HttpResponse<AuthDiscordPayload>>({
    url:        "/v1/account/auth/discord",
    data:       param,
    serviceKey: Env.systemServiceKey,
  })
}
