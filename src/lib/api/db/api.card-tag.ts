"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

export interface CardTagPayload {
  id:         string
  name:       string
  created_at: string
  updated_at: string
}

export interface CreateCardTagRequest {
  name: string
}

export interface UpdateCardTagRequest {
  name?: string
}

export interface PaginationQuery {
  page:  number
  limit: number
}

export interface CardTagFindAllQuery extends PaginationQuery {
  search?: string
}

export async function cardTagFindAll(query: CardTagFindAllQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CardTagPayload[]>>({
    url:         "/v1/card-tag",
    params:      query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardTagFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CardTagPayload>>({
    url:         `/v1/card-tag/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardTagCreateOne(param: CreateCardTagRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<CardTagPayload>>({
    url:         "/v1/card-tag",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardTagUpdateOneById(id: string, param: UpdateCardTagRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.patch<HttpResponse<CardTagPayload>>({
    url:         `/v1/card-tag/${id}`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function cardTagDeleteOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/card-tag/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
