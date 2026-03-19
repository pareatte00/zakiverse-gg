"use server"

import { api, JikanPaginateResponse, JikanResponse } from "./api"
import type {
  Broadcast,
  DateRange,
  ExternalLink,
  Images,
  MALEntry,
  Person,
  Picture,
  Relation,
  Title,
  Trailer,
} from "./api.types"

export interface Anime {
  mal_id:          number
  url:             string
  images:          Images
  trailer:         Trailer
  approved:        boolean
  titles:          Title[]
  title:           string
  title_english:   string
  title_japanese:  string
  title_synonyms:  string[]
  type:            string
  source:          string
  episodes:        number | null
  status:          string
  airing:          boolean
  aired:           DateRange
  duration:        string
  rating:          string
  score:           number
  scored_by:       number
  rank:            number
  popularity:      number
  members:         number
  favorites:       number
  synopsis:        string
  background:      string
  season:          string
  year:            number | null
  broadcast:       Broadcast
  producers:       MALEntry[]
  licensors:       MALEntry[]
  studios:         MALEntry[]
  genres:          MALEntry[]
  explicit_genres: MALEntry[]
  themes:          MALEntry[]
  demographics:    MALEntry[]
}

export interface AnimeCharacter {
  character:    Character
  role:         string
  voice_actors: VoiceActor[]
}

export interface Character {
  mal_id: number
  url:    string
  images: Images
  name:   string
}

export interface VoiceActor {
  person:   Person
  language: string
}

export interface AnimeStaffMember {
  person:    Person
  positions: string[]
}

export interface AnimeEpisode {
  mal_id:         number
  url:            string
  title:          string
  title_japanese: string
  title_romanji:  string
  aired:          string
  score:          number | null
  filler:         boolean
  recap:          boolean
  forum_url:      string
}

export interface AnimeVideo {
  title:   string
  episode: string
  url:     string
  images:  Images
}

export interface AnimePromo {
  title:   string
  trailer: Trailer
}

export interface AnimeStatistics {
  watching:      number
  completed:     number
  on_hold:       number
  dropped:       number
  plan_to_watch: number
  total:         number
}

export interface AnimeThemes {
  openings: string[]
  endings:  string[]
}

export interface AnimeReview {
  mal_id:           number
  url:              string
  type:             string
  reactions:        ReviewReactions
  date:             string
  review:           string
  score:            number
  tags:             string[]
  is_spoiler:       boolean
  is_preliminary:   boolean
  episodes_watched: number
}

export interface ReviewReactions {
  overall:      number
  nice:         number
  love_it:      number
  funny:        number
  confusing:    number
  informative:  number
  well_written: number
  creative:     number
}

export interface ForumTopic {
  mal_id:          number
  url:             string
  title:           string
  date:            string
  author_username: string
  author_url:      string
  comments:        number
}

export interface NewsArticle {
  mal_id:          number
  url:             string
  title:           string
  date:            string
  author_username: string
  author_url:      string
  forum_url:       string
  images:          Images
  comments:        number
  excerpt:         string
}

export interface UserUpdate {
  user:           UserMeta
  score:          number | null
  status:         string
  episodes_seen:  number | null
  episodes_total: number | null
  date:           string
}

export interface UserMeta {
  username: string
  url:      string
  images:   Images
}

export interface Recommendation {
  entry: MALEntry
  votes: number
}

export interface AnimeVideosData {
  promo:    AnimePromo[]
  episodes: AnimeVideo[]
}

// --- Endpoints ---

export async function getAnime(id: number) {
  return await api.get<JikanResponse<Anime>>({
    url: `/anime/${id}`,
  })
}

export async function getAnimeFull(id: number) {
  return await api.get<JikanResponse<Anime>>({
    url: `/anime/${id}/full`,
  })
}

export async function getAnimeCharacters(id: number) {
  return await api.get<JikanResponse<AnimeCharacter[]>>({
    url: `/anime/${id}/characters`,
  })
}

export async function getAnimeStaff(id: number) {
  return await api.get<JikanResponse<AnimeStaffMember[]>>({
    url: `/anime/${id}/staff`,
  })
}

export async function getAnimeEpisodes(id: number, page: number) {
  return await api.get<JikanPaginateResponse<AnimeEpisode[]>>({
    url:    `/anime/${id}/episodes`,
    params: { page },
  })
}

export async function getAnimeEpisode(id: number, episode: number) {
  return await api.get<JikanResponse<AnimeEpisode>>({
    url: `/anime/${id}/episodes/${episode}`,
  })
}

export async function getAnimeNews(id: number, page: number) {
  return await api.get<JikanPaginateResponse<NewsArticle[]>>({
    url:    `/anime/${id}/news`,
    params: { page },
  })
}

export async function getAnimeForum(id: number) {
  return await api.get<JikanResponse<ForumTopic[]>>({
    url: `/anime/${id}/forum`,
  })
}

export async function getAnimeVideos(id: number) {
  return await api.get<JikanResponse<AnimeVideosData>>({
    url: `/anime/${id}/videos`,
  })
}

export async function getAnimePictures(id: number) {
  return await api.get<JikanResponse<Picture[]>>({
    url: `/anime/${id}/pictures`,
  })
}

export async function getAnimeStatistics(id: number) {
  return await api.get<JikanResponse<AnimeStatistics>>({
    url: `/anime/${id}/statistics`,
  })
}

export async function getAnimeMoreInfo(id: number) {
  return await api.get<JikanResponse<{ moreinfo: string }>>({
    url: `/anime/${id}/moreinfo`,
  })
}

export async function getAnimeRecommendations(id: number) {
  return await api.get<JikanResponse<Recommendation[]>>({
    url: `/anime/${id}/recommendations`,
  })
}

export async function getAnimeUserUpdates(id: number, page: number) {
  return await api.get<JikanPaginateResponse<UserUpdate[]>>({
    url:    `/anime/${id}/userupdates`,
    params: { page },
  })
}

export async function getAnimeReviews(id: number, page: number) {
  return await api.get<JikanPaginateResponse<AnimeReview[]>>({
    url:    `/anime/${id}/reviews`,
    params: { page },
  })
}

export async function getAnimeRelations(id: number) {
  return await api.get<JikanResponse<Relation[]>>({
    url: `/anime/${id}/relations`,
  })
}

export async function getAnimeThemes(id: number) {
  return await api.get<JikanResponse<AnimeThemes>>({
    url: `/anime/${id}/themes`,
  })
}

export async function getAnimeExternal(id: number) {
  return await api.get<JikanResponse<ExternalLink[]>>({
    url: `/anime/${id}/external`,
  })
}

export async function getAnimeStreaming(id: number) {
  return await api.get<JikanResponse<ExternalLink[]>>({
    url: `/anime/${id}/streaming`,
  })
}

export async function searchAnime(query: string, page: number) {
  return await api.get<JikanPaginateResponse<Anime[]>>({
    url:    `/anime`,
    params: { q: query, page },
  })
}
