"use server"

import { MainConst } from "../../const/const.extensions"
import { findCookie } from "../../hook/cookie"
import { formatUri } from "../../utils"
import { api, BasePaginateResponse, BaseResponse, ChainOpRequest, DeleteCascade, DoManyRequest, RelationRequest, SearchRequest, SortRequest, UpdateAssociation, WithOptionalId } from "./api"
import type { DomainRegistration } from "./api.domain_registration"
import type { Pbn } from "./api.pbn"
import type { PbnLegacyKeyword } from "./api.pbn_legacy_keyword"
import type { Serp } from "./api.serp"
import type { Server } from "./api.server"
import type { Voluum } from "./api.voluum"

const route = MainConst.Api.Route.Domain

export interface Domain {
  id:                   string
  domain:               string
  name_en:              string
  name_th:              string
  server_id?:           string | null
  server?:              Server
  domain_registration?: DomainRegistration[]
  voluum?:              Voluum[]
  serp?:                Serp[]
  pbn?:                 Pbn[]
  pbn_legacy_keyword?:  PbnLegacyKeyword[]
  created_at:           string
  updated_at:           string
}

export interface DomainCreateRequest {
  domain?: string
  name_en: string
  name_th: string
}

export interface DomainUpdateRequest {
  domain_id?: string
  name_en?:   string
  name_th?:   string
  server_id?: string | null
}

export async function domainCreate(param: DomainCreateRequest) {
  const bearerToken = await findCookie(MainConst.Cookie.temporaryKey)

  return await api.post<BaseResponse<Domain>>({
    url:  route.base,
    data: param,
    bearerToken,
  })
}

export async function domainCreateMany(param: DoManyRequest<DomainCreateRequest>) {
  const bearerToken = await findCookie(MainConst.Cookie.temporaryKey)

  return await api.patch<BaseResponse<Domain[]>>({
    url:  route.many,
    data: param,
    bearerToken,
  })
}

export async function domainUpsertMany<T extends DomainCreateRequest & WithOptionalId>(param: DoManyRequest<T>) {
  const bearerToken = await findCookie(MainConst.Cookie.temporaryKey)

  return await api.post<BaseResponse<string[]>>({
    url:  route.upsert.many,
    data: param,
    bearerToken,
  })
}

export interface DomainField {
  field: "id" | "domain" | "name_en" | "name_th" | "server_id" | "created_at" | "updated_at"
}

export interface DomainChainRequest extends Omit<ChainOpRequest, "field">, DomainField {}

export interface DomainSortRequest extends Omit<SortRequest, "field">, DomainField {}

export interface DomainRelationRequest extends Omit<RelationRequest, "load"> {
  load: "Server" | "Server.ServerAccount"
}

export interface DomainAssociationRequest {
  server_id?: string | null
}

export async function domainFind(param?: SearchRequest<DomainChainRequest, DomainSortRequest, DomainRelationRequest>) {
  return await api.get<BasePaginateResponse<Domain[]>>({
    url:         route.base,
    data:        param,
    bearerToken: await findCookie(MainConst.Cookie.temporaryKey),
  })
}

export async function domainUpdate(id: string, param: DomainUpdateRequest) {
  return await api.patch<BaseResponse<Domain>>({
    url:         formatUri(route.byId, { id }),
    data:        param,
    bearerToken: await findCookie(MainConst.Cookie.temporaryKey),
  })
}

export async function domainDelete(id: string, param?: DeleteCascade) {
  return await api.delete<BaseResponse<null>>({
    url:         formatUri(route.byId, { id }),
    params:      param,
    bearerToken: await findCookie(MainConst.Cookie.temporaryKey),
  })
}

export interface domainUpdateAssociationParam extends UpdateAssociation {
  association: "DomainRegistration" | "Voluum" | "Serp" | "Pbn" | "PbnLegacyKeyword"
}

export async function domainUpdateAssociation(id: string, param: domainUpdateAssociationParam) {
  return await api.patch<BaseResponse<Domain>>({
    url:         formatUri(route.association, { id }),
    data:        param,
    bearerToken: await findCookie(MainConst.Cookie.temporaryKey),
  })
}
