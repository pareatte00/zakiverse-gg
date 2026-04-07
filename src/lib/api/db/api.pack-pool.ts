"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface PackPoolPayload {
  id:              string
  name:            string
  description:     string | null
  active_count:    number
  rotation_day:    number
  last_rotated_at: string | null
  created_at:      string
  updated_at:      string
}

export interface CreatePackPoolRequest {
  name:         string
  description?: string
  active_count: number
  rotation_day: number
}

export interface UpdatePackPoolRequest {
  name?:         string
  description?:  string
  active_count?: number
  rotation_day?: number
}

export interface PaginationQuery {
  page:  number
  limit: number
}

export async function packPoolFindAll(query: PaginationQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPoolPayload[]>>({
    url:         "/v1/pack-pool",
    params:      query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function packPoolFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<PackPoolPayload>>({
    url:         `/v1/pack-pool/${id}`,
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
