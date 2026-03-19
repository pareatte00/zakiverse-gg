"use server"

import { api, JikanPaginateResponse, JikanResponse } from "./api"
import type { Images, Person, Picture } from "./api.types"
import type { Anime } from "./api.anime"

export interface CharacterFull {
  mal_id:     number
  url:        string
  images:     Images
  name:       string
  name_kanji: string
  nicknames:  string[]
  favorites:  number
  about:      string
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

export async function searchCharacters(query: string, page: number) {
  return await api.get<JikanPaginateResponse<CharacterFull[]>>({
    url:    `/characters`,
    params: { q: query, page },
  })
}
