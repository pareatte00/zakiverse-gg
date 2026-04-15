"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface BalancePayload {
  coin: number
}

export async function accountBalanceGet() {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<BalancePayload>>({
    url:         "/v1/account/balance",
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
