"use server"

import { Env } from "@/lib/const/const.env"
import { Cookie } from "@/lib/const/const.cookie"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface AccountCardPayload {
  id:          string
  account_id:  string
  card_id:     string
  level:       number
  obtained_at: string
}

export interface AddCardRequest {
  account_id: string
  card_id:    string
}

export interface RemoveCardRequest {
  account_id: string
  card_id:    string
}

export interface PaginationQuery {
  page:  number
  limit: number
}

export async function accountCardFindMyCards(query: PaginationQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<AccountCardPayload[]>>({
    url:         "/v1/account-card/me",
    data:        query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function accountCardAddCard(param: AddCardRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<AccountCardPayload>>({
    url:         "/v1/account-card",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function accountCardRemoveCard(param: RemoveCardRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         "/v1/account-card",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
