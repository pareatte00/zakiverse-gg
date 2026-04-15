"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

// --- Types ---

export interface ShowcaseCardPayload {
  card_id: string
  name:    string
  image:   string
  rarity:  string
  level:   number
}

export interface CompletionEntry {
  owned:   number
  total:   number
  percent: number
}

export interface HighestLevelCardPayload {
  card_id: string
  name:    string
  image:   string
  rarity:  string
  level:   number
}

export interface RecentPullPayload {
  card_id:   string
  name:      string
  image:     string
  rarity:    string
  pulled_at: string
  was_new:   boolean
}

export interface ProfileStats {
  total_cards:        number
  total_pulls:        number
  completion:         Record<string, CompletionEntry>
  highest_level_card: HighestLevelCardPayload | null
  login_streak:       number
}

export interface ProfilePayload {
  account_id:     string
  display_name:   string
  bio:            string | null
  showcase_cards: ShowcaseCardPayload[]
  stats:          ProfileStats
  recent_pulls:   RecentPullPayload[]
}

export interface ProfileSearchPayload {
  account_id:   string
  display_name: string
  total_cards:  number
  login_streak: number
}

export interface UpdateProfileRequest {
  display_name:   string
  bio?:           string
  showcase_cards?: string[]
}

export interface ProfileSearchQuery {
  query: string
  page:  number
  limit: number
}

// --- Endpoints ---

export async function profileGetMe() {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<ProfilePayload>>({
    url:         "/v1/profile/me",
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function profileUpdateMe(param: UpdateProfileRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.patch<HttpResponse<ProfilePayload>>({
    url:         "/v1/profile/me",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function profileSearch(query: ProfileSearchQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<ProfileSearchPayload[]>>({
    url:         "/v1/profile/search",
    data:        query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function profileGetByIdOrName(identifier: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<ProfilePayload>>({
    url:         `/v1/profile/${identifier}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
