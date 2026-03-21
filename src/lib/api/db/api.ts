import { Env } from "@/lib/const/const.env"
import usexAxios from "../../hook/use-xaxios"

export const api = usexAxios(Env.apiUrl)

export interface HttpResponse<T = any> {
  timestamp: string
  payload?:  T
  error?:    ErrorDetail
  meta?:     any
  debug?:    any
  version:   string
}

export interface ErrorDetail {
  code:    string
  message: string
}
