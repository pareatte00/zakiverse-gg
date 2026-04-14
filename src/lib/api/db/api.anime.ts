"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface AnimePayload {
  id:          string
  mal_id:      number
  title:       string
  synopsis:    string | null
  cover_image: string | null
}

export interface CreateAnimeRequest {
  mal_id:       number
  title:        string
  synopsis?:    string
  cover_image?: string
}

export interface UpdateAnimeRequest {
  title:        string
  synopsis?:    string
  cover_image?: string
}

export interface PaginationQuery {
  search?: string
  page:    number
  limit:   number
}

export async function animeFindAll(query: PaginationQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<AnimePayload[]>>({
    url:         "/v1/anime",
    data:        query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

// deprecated.
export async function animeFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<AnimePayload>>({
    url:         `/v1/anime/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function animeCreateOne(param: CreateAnimeRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<AnimePayload>>({
    url:         "/v1/anime",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function animeUpdateOneById(id: string, param: UpdateAnimeRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.put<HttpResponse<AnimePayload>>({
    url:         `/v1/anime/${id}`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function animeDeleteOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/anime/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
