"use server"

import { Env } from "@/lib/const/const.env"
import { Cookie } from "@/lib/const/const.cookie"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface CardPayload {
  id:         string
  mal_id:     number
  anime_id:   string
  rarity_id:  string
  name:       string
  image:      string
  config:     Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateCardRequest {
  mal_id:    number
  anime_id:  string
  rarity_id: string
  name:      string
  image:     string
  config:    string
}

export interface UpdateCardRequest {
  rarity_id: string
  name:      string
  image:     string
  config:    string
}

export interface PaginationQuery {
  page:  number
  limit: number
}

export async function cardFindAllByAnimeId(animeId: string, query: PaginationQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CardPayload[]>>({
    url:         `/v1/card/anime/${animeId}`,
    params:      query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CardPayload>>({
    url:         `/v1/card/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardCreateOne(param: CreateCardRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<CardPayload>>({
    url:         "/v1/card",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardUpdateOneById(id: string, param: UpdateCardRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.put<HttpResponse<CardPayload>>({
    url:         `/v1/card/${id}`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardDeleteOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/card/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
