import usexAxios from "../../hook/use-xaxios"

const JIKAN_BASE_URL = "https://api.jikan.moe/v4"

export const api = usexAxios(JIKAN_BASE_URL)

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
