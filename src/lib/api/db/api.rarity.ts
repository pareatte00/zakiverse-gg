"use server"

import { Env } from "@/lib/const/const.env"
import { Cookie } from "@/lib/const/const.cookie"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface RarityPayload {
  id:         string
  name:       string
  config:     Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateRarityRequest {
  name:   string
  config: string
}

export interface UpdateRarityRequest {
  name:   string
  config: string
}

export async function rarityFindAll() {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<RarityPayload[]>>({
    url:         "/v1/rarity",
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function rarityFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<RarityPayload>>({
    url:         `/v1/rarity/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function rarityCreateOne(param: CreateRarityRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<RarityPayload>>({
    url:         "/v1/rarity",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function rarityUpdateOneById(id: string, param: UpdateRarityRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.put<HttpResponse<RarityPayload>>({
    url:         `/v1/rarity/${id}`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function rarityDeleteOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/rarity/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
