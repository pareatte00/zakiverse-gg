"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"
import type { PackConfig } from "./api.pack"

export type BannerType = "standard" | "featured"

export type RotationType = "none" | "weekly" | "monthly"

export type RotationOrderMode = "auto" | "manual"

export interface PackPoolPackItem {
  id:             string
  code:           string
  name:           string
  description:    string | null
  image:          string
  name_image:     string | null
  cards_per_pull: number
  sort_order:     number
  config:         PackConfig
  pool_id:        string | null
  rotation_order: number | null
  total_cards:    number
}

export interface PackPoolPayload {
  id:                  string
  name:                string
  description:         string | null
  image:               string | null
  banner_type:         BannerType
  sort_order:          number
  is_active:           boolean
  open_at:             string | null
  close_at:            string | null
  active_count:        number
  rotation_type:       RotationType
  rotation_day:        number | null
  rotation_interval:   number
  rotation_hour:       number
  rotation_order_mode: RotationOrderMode
  next_rotation_at:    string | null
  last_rotated_at:     string | null
  preview_days:        number
  is_preview:          boolean
  has_preview:         boolean
  packs?:              PackPoolPackItem[]
  created_at:          string
  updated_at:          string
}

export interface CreatePackPoolRequest {
  name:                string
  description?:        string
  image?:              string
  banner_type:         BannerType
  sort_order?:         number
  is_active:           boolean
  open_at?:            string
  close_at?:           string
  active_count:        number
  rotation_type:       RotationType
  rotation_day?:       number
  rotation_interval?:  number
  rotation_hour?:      number
  timezone_offset?:    number
  rotation_order_mode: RotationOrderMode
  preview_days?:       number
}

export interface UpdatePackPoolRequest {
  name?:                string
  description?:         string
  image?:               string
  banner_type?:         BannerType
  sort_order?:          number
  is_active?:           boolean
  open_at?:             string
  close_at?:            string
  active_count?:        number
  rotation_type?:       RotationType
  rotation_day?:        number
  rotation_interval?:   number
  rotation_hour?:       number
  timezone_offset?:     number
  rotation_order_mode?: RotationOrderMode
  preview_days?:        number
}

export interface SortPackPoolRequest {
  banner_type: BannerType
  ids:         string[]
}

export interface SortPacksRequest {
  ids: string[]
}

export interface SortRotationRequest {
  ids: string[]
}

export interface AssignPacksRequest {
  ids: string[]
}

export interface PackPoolFindAllQuery {
  search?:      string
  banner_type?: BannerType
  active_only?: boolean
  page:         number
  limit:        number
}

// User-facing: get active banners with their current packs
export async function packPoolFindActiveBanners() {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPoolPayload[]>>({
    url:         "/v1/pack-pool/active",
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

// User-facing: get a single pool with its current packs
export async function packPoolFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPoolPayload>>({
    url:         `/v1/pack-pool/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

// User-facing: get next rotation packs for a pool
export async function packPoolFindNextPacks(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPoolPackItem[]>>({
    url:         `/v1/pack-pool/${id}/next-packs`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

// Admin: list all pools with filters
export async function packPoolFindAll(query: PackPoolFindAllQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPoolPayload[]>>({
    url:         "/v1/pack-pool",
    data:        query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolCreateOne(param: CreatePackPoolRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<PackPoolPayload>>({
    url:         "/v1/pack-pool",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolUpdateOneById(id: string, param: UpdatePackPoolRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.patch<HttpResponse<PackPoolPayload>>({
    url:         `/v1/pack-pool/${id}`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolDeleteOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/pack-pool/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolSort(param: SortPackPoolRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<void>>({
    url:         "/v1/pack-pool/sort",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolAssignPacks(id: string, param: AssignPacksRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<void>>({
    url:         `/v1/pack-pool/${id}/assign-packs`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolSortPacks(id: string, param: SortPacksRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<void>>({
    url:         `/v1/pack-pool/${id}/sort-packs`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolSortRotation(id: string, param: SortRotationRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<void>>({
    url:         `/v1/pack-pool/${id}/sort-rotation`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
