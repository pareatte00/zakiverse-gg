import { Env } from "@/lib/const/const.env"
import usexAxios from "../../hook/use-xaxios"

export const api = usexAxios(Env.apiUrl)

export interface PaginationMeta {
  total:       number
  page:        number
  limit:       number
  total_pages: number
}

export interface HttpResponse<T = any> {
  timestamp: string
  payload?:  T
  error?:    ErrorDetail
  meta?:     PaginationMeta
  debug?:    any
  version:   string
}

export interface ErrorDetail {
  code:    string
  message: string
}
