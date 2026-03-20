"use server"

import { Website } from "../../const/const.url"
import usexAxios from "../../hook/use-xaxios"

export const api = usexAxios(Website.api)

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
