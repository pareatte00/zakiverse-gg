import { Env } from "@/lib/const/const.env"
import usexAxios from "../../hook/use-xaxios"

export const api = usexAxios(Env.jikanApiUrl)

export interface JikanResponse<T> {
  data: T
}

export interface JikanPaginateResponse<T> {
  data:       T
  pagination: Pagination
}

export interface Pagination {
  last_visible_page: number
  has_next_page:     boolean
  current_page:      number
  items: {
    count:    number
    total:    number
    per_page: number
  }
}
