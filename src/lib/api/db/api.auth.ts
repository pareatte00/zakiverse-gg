"use server"

import { api, HttpResponse } from "./api"

export interface AuthDiscordRequest {
  code: string
}

export interface AuthDiscordPayload {
  access_token: string
}

export async function authDiscord(param: AuthDiscordRequest) {
  return await api.post<HttpResponse<AuthDiscordPayload>>({
    url:  "/auth/discord",
    data: param,
  })
}
