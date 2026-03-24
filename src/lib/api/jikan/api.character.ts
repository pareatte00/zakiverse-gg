"use server"

import { api, JikanPaginateResponse, JikanResponse } from "./api"
import type { Anime } from "./api.anime"
import type { Images, Person, Picture } from "./api.types"

export interface CharacterFull {
  mal_id:     number
  url:        string
  images:     Images
  name:       string
  name_kanji: string
  nicknames:  string[]
  favorites:  number
  about:      string
  anime?:     CharacterAnime[]
}

export interface CharacterAnime {
  role:  string
  anime: Anime
}

export interface CharacterManga {
  role:  string
  manga: {
    mal_id: number
    url:    string
    images: Images
    title:  string
  }
}

export interface CharacterVoiceActor {
  language: string
  person:   Person
}

// --- Endpoints ---

export async function getCharacter(id: number) {
  return await api.get<JikanResponse<CharacterFull>>({
    url: `/characters/${id}`,
  })
}

export async function getCharacterFull(id: number) {
  return await api.get<JikanResponse<CharacterFull>>({
    url: `/characters/${id}/full`,
  })
}

export async function getCharacterAnime(id: number) {
  return await api.get<JikanResponse<CharacterAnime[]>>({
    url: `/characters/${id}/anime`,
  })
}

export async function getCharacterManga(id: number) {
  return await api.get<JikanResponse<CharacterManga[]>>({
    url: `/characters/${id}/manga`,
  })
}

export async function getCharacterVoices(id: number) {
  return await api.get<JikanResponse<CharacterVoiceActor[]>>({
    url: `/characters/${id}/voices`,
  })
}

export async function getCharacterPictures(id: number) {
  return await api.get<JikanResponse<Picture[]>>({
    url: `/characters/${id}/pictures`,
  })
}

export type CharacterOrderBy = "mal_id" | "name" | "favorites"

export interface SearchCharactersParams {
  query:     string
  page:      number
  limit?:    number
  order_by?: CharacterOrderBy
  sort?:     "asc" | "desc"
}

export async function searchCharacters({ query, page, limit, order_by, sort }: SearchCharactersParams) {
  return await api.get<JikanPaginateResponse<CharacterFull[]>>({
    url:    `/characters`,
    params: { q: query, page, limit, order_by, sort },
  })
}
