"use server"

import type { Rarity } from "@/components/game/game-card"
import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"
import type { AnimePayload } from "./api.anime"

export interface CardConfig {
  background_image?: string
}

export interface CardPayload {
  id:       string
  mal_id:   number
  rarity:   Rarity
  name:     string
  image:    string
  config:   CardConfig
  tag_id:   string | null
  tag_name: string | null
  favorite: number
  anime:    AnimePayload
}

export interface CreateCardRequest {
  mal_id:             number
  rarity:             Rarity
  name:               string
  image:              string
  config:             CardConfig
  tag_id:             string
  favorite?:          number
  anime_mal_id:       number
  anime_title:        string
  anime_synopsis?:    string
  anime_cover_image?: string
}

export interface UpdateCardRequest {
  rarity?:   Rarity
  name?:     string
  image?:    string
  config?:   CardConfig
  tag_id?:   string
  favorite?: number
}

export interface PaginationQuery {
  page:  number
  limit: number
}

export type CardSortField = "name" | "rarity" | "favorite"

export type CardSortOrder = "asc" | "desc"

export interface CardFindAllQuery extends PaginationQuery {
  search?: string
  rarity?: Rarity
  tag_id?: string
  sort?:   CardSortField
  order?:  CardSortOrder
}

export async function cardFindAll(query: CardFindAllQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CardPayload[]>>({
    url:         "/v1/card",
    data:        query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardFindAllByAnimeId(animeId: string, query: PaginationQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CardPayload[]>>({
    url:         `/v1/card/anime/${animeId}`,
    data:        query,
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

  return await api.patch<HttpResponse<CardPayload>>({
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
