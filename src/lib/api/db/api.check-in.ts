"use server"

import { Cookie } from "@/lib/const/const.cookie"
import { Env } from "@/lib/const/const.env"
import { findCookie } from "@/lib/hook/cookie"
import { api, HttpResponse } from "./api"

// --- Types ---

export type CheckInType = "recurring" | "streak" | "calendar"

export type CheckInResetPolicy = "rolling" | "daily_reset" | "weekly_reset" | "monthly_reset"

export interface CheckInStatus {
  can_claim:    boolean
  next_claim_at: string | null
  streak:       number
  claim_count:  number
}

export interface CheckInReward {
  claim?:  string
  day?:    number
  type:    string
  amount:  number
}

export interface CheckInPlanPayload {
  id:           string
  code:         string
  name:         string
  description:  string | null
  type:         CheckInType
  interval:     number
  max_claims:   number
  rewards:      CheckInReward[]
  reset_policy: CheckInResetPolicy
  is_active:    boolean
  starts_at:    string | null
  ends_at:      string | null
  sort_order:   number
  status?:      CheckInStatus
}

export interface ClaimResultPayload {
  reward:  CheckInReward
  status:  CheckInStatus
  balance: { coin: number }
}

// --- Admin types ---

export interface CreateCheckInPlanRequest {
  code:         string
  name:         string
  description?: string
  type:         CheckInType
  interval:     number
  max_claims?:  number
  rewards:      string
  reset_policy: CheckInResetPolicy
  is_active?:   boolean
  starts_at?:   string
  ends_at?:     string
  sort_order?:  number
}

export interface UpdateCheckInPlanRequest {
  code?:         string
  name?:         string
  description?:  string
  type?:         CheckInType
  interval?:     number
  max_claims?:   number
  rewards?:      string
  reset_policy?: CheckInResetPolicy
  is_active?:    boolean
  starts_at?:    string
  ends_at?:      string
  sort_order?:   number
}

export interface PaginationQuery {
  page:  number
  limit: number
}

// --- Player endpoints ---

export async function checkInGetPlans() {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CheckInPlanPayload[]>>({
    url:         "/v1/check-in",
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function checkInClaim(planId: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<ClaimResultPayload>>({
    url:         `/v1/check-in/${planId}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

// --- Admin endpoints ---

export async function checkInPlanFindAll(query: PaginationQuery) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CheckInPlanPayload[]>>({
    url:         "/v1/check-in-plan",
    data:        query,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function checkInPlanFindOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.get<HttpResponse<CheckInPlanPayload>>({
    url:         `/v1/check-in-plan/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function checkInPlanCreateOne(param: CreateCheckInPlanRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.post<HttpResponse<CheckInPlanPayload>>({
    url:         "/v1/check-in-plan",
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function checkInPlanUpdateOneById(id: string, param: UpdateCheckInPlanRequest) {
  const token = await findCookie(Cookie.accessToken)

  return await api.patch<HttpResponse<CheckInPlanPayload>>({
    url:         `/v1/check-in-plan/${id}`,
    data:        param,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}

export async function checkInPlanDeleteOneById(id: string) {
  const token = await findCookie(Cookie.accessToken)

  return await api.delete<HttpResponse<void>>({
    url:         `/v1/check-in-plan/${id}`,
    bearerToken: token,
    serviceKey:  Env.systemServiceKey,
  })
}
