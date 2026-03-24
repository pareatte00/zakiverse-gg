"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface AccountMePayload {
  id:         string
  discord_id: string
  username:   string
  email:      string
  avatar:     string | null
  role:       string
}

export async function accountGetMe() {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<AccountMePayload>>({
    url:         "/v1/account/me",
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
