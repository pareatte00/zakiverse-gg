"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface PackConfig {
  rarity_rates: Record<string, number>
  pity?:        Record<string, number>
}

export interface PackCardAnimePayload {
  title:       string
  cover_image: string | null
}

export interface PackCardPayload {
  id:            string
  card_id:       string
  weight:        number
  is_featured:   boolean
  featured_rate: number | null
  name:          string
  image:         string
  rarity:        string
  anime:         PackCardAnimePayload
}

export interface PackPayload {
  id:             string
  code:           string
  name:           string
  description:    string | null
  image:          string
  name_image:     string | null
  type:           "standard" | "limited" | "event"
  cards_per_pull: number
  sort_order:     number
  is_active:      boolean
  open_at:        string | null
  close_at:       string | null
  config:         PackConfig
  pool_id:        string | null
  total_cards:    number
  cards?:         PackCardPayload[]
}

export interface CreatePackRequest {
  code:           string
  name:           string
  description?:   string
  image:          string
  name_image?:    string
  type:           "standard" | "limited" | "event"
  cards_per_pull: number
  sort_order?:    number
  is_active:      boolean
  open_at?:       string
  close_at?:      string
  config:         PackConfig
}

export interface UpdatePackRequest {
  code?:           string
  name?:           string
  description?:    string
  image?:          string
  name_image?:     string
  type?:           "standard" | "limited" | "event"
  cards_per_pull?: number
  sort_order?:     number
  is_active?:      boolean
  open_at?:        string
  close_at?:       string
  config?:         PackConfig
  pool_id?:        string
}

export interface PackFindAllQuery {
  active_only?: boolean
  type?:        "standard" | "limited" | "event"
  page:         number
  limit:        number
}

export interface AddPackCardsRequestItem {
  card_id:        string
  weight:         number
  is_featured:    boolean
  featured_rate?: number
}

export interface AddPackCardsRequest {
  cards: AddPackCardsRequestItem[]
}

export interface RemovePackCardsRequest {
  card_ids: string[]
}

export interface PulledCardPayload {
  card_id:     string
  rarity:      string
  is_new:      boolean
  is_pity:     boolean
  is_featured: boolean
}

export interface PullResultPayload {
  cards: PulledCardPayload[]
}

export async function packFindAll(query: PackFindAllQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPayload[]>>({
    url:         "/v1/pack",
    data:        query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPayload>>({
    url:         `/v1/pack/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packCreateOne(param: CreatePackRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<PackPayload>>({
    url:         "/v1/pack",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packUpdateOneById(id: string, param: UpdatePackRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.patch<HttpResponse<PackPayload>>({
    url:         `/v1/pack/${id}`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packDeleteOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/pack/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packAddCards(id: string, param: AddPackCardsRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<PackCardPayload[]>>({
    url:         `/v1/pack/${id}/cards`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packRemoveCards(id: string, param: RemovePackCardsRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/pack/${id}/cards`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export type PullMode = "single" | "multi"

export async function packPull(id: string, mode: PullMode) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<PullResultPayload>>({
    url:         `/v1/pack/${id}/pull`,
    data:        { mode },
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
