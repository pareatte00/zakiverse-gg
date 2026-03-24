/* eslint-disable @next/next/no-img-element */
"use client"

import { GameButton } from "@/components/game/game-button"
import type { Pagination } from "@/lib/api/jikan/api"
import type { Anime, AnimeCharacter } from "@/lib/api/jikan/api.anime"
import { getAnimeCharacters, searchAnime } from "@/lib/api/jikan/api.anime"
import { ArrowLeft, Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { SearchResultCard } from "./search-result-card"

export function AnimeSearchTab() {
  const [ query, setQuery ] = useState("")
  const [ animeResults, setAnimeResults ] = useState<Anime[]>([])
  const [ pagination, setPagination ] = useState<Pagination | null>(null)
  const [ page, setPage ] = useState(1)
  const [ loading, setLoading ] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Drill-down state
  const [ selectedAnime, setSelectedAnime ] = useState<Anime | null>(null)
  const [ characters, setCharacters ] = useState<AnimeCharacter[]>([])
  const [ loadingChars, setLoadingChars ] = useState(false)
  const doSearch = useCallback(async (q: string, p: number) => {
    if (!q.trim()) {
      setAnimeResults([])
      setPagination(null)

      return
    }

    setLoading(true)

    const { response } = await searchAnime({ query: q, page: p })

    if (response) {
      setAnimeResults(response.data)
      setPagination(response.pagination)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    setPage(1)

    debounceRef.current = setTimeout(() => {
      void doSearch(query, 1)
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [ query, doSearch ])

  async function handleSelectAnime(anime: Anime) {
    setSelectedAnime(anime)
    setLoadingChars(true)

    const { response } = await getAnimeCharacters(anime.mal_id)

    if (response) {
      setCharacters(response.data)
    }

    setLoadingChars(false)
  }

  function handleBack() {
    setSelectedAnime(null)
    setCharacters([])
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    void doSearch(query, newPage)
  }

  // --- Drill-down: show characters for selected anime ---
  if (selectedAnime) {
    return (
      <div>
        <div className={"flex items-center gap-4"}>
          <GameButton
            variant={"ghost"}
            onClick={handleBack}
          >
            <ArrowLeft className={"h-4 w-4"} />
            Back
          </GameButton>

          <div className={"flex items-center gap-3"}>
            <img
              alt={selectedAnime.title}
              className={"h-10 w-8 shrink-0 rounded-lg object-cover"}
              src={selectedAnime.images.jpg.image_url}
            />

            <div>
              <h3 className={"text-sm font-medium text-zinc-200"}>{selectedAnime.title}</h3>
              <p className={"text-xs text-zinc-500"}>{characters.length} characters</p>
            </div>
          </div>
        </div>

        {loadingChars
          ? (
            <div className={"mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className={"aspect-[3/4] animate-pulse rounded-xl bg-zinc-800"} key={i} />
              ))}
            </div>
          )
          : (
            <div className={"mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
              {characters.map((ac) => (
                <SearchResultCard
                  anime={{ mal_id: selectedAnime.mal_id, title: selectedAnime.title }}
                  favorites={ac.character.favorites}
                  imageUrl={ac.character.images.jpg.image_url}
                  key={ac.character.mal_id}
                  malId={ac.character.mal_id}
                  name={ac.character.name}
                  subtitle={ac.role}
                />
              ))}
            </div>
          )}
      </div>
    )
  }

  function renderResults() {
    if (loading) {
      return (
        <div className={"mt-6 space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className={"h-20 animate-pulse rounded-xl bg-zinc-800"} key={i} />
          ))}
        </div>
      )
    }

    if (animeResults.length > 0) {
      return (
        <>
          <div className={"mt-6 space-y-2"}>
            {animeResults.map((anime) => (
              <button
                className={"flex w-full items-center gap-3 rounded-xl bg-zinc-800 p-3 text-left transition-colors hover:bg-zinc-750"}
                key={anime.mal_id}
                type={"button"}
                onClick={() => void handleSelectAnime(anime)}
              >
                { }

                <img
                  alt={anime.title}
                  className={"h-16 w-12 shrink-0 rounded-lg object-cover"}
                  src={anime.images.jpg.image_url}
                />

                <div className={"min-w-0 flex-1"}>
                  <p className={"text-xs text-zinc-500"}>
                    #{anime.mal_id}
                  </p>

                  <p className={"truncate font-medium text-zinc-200"}>{anime.title}</p>

                  <p className={"mt-0.5 text-xs text-zinc-500"}>
                    {anime.type} · {anime.episodes ?? "?"} eps · {anime.year ?? "N/A"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {pagination && pagination.last_visible_page > 1 && (
            <div className={"mt-6 flex items-center justify-center gap-2"}>
              <button
                className={"rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40"}
                disabled={page <= 1}
                type={"button"}
                onClick={() => handlePageChange(page - 1)}
              >
                Prev
              </button>

              <span className={"text-sm text-zinc-500"}>
                {page} / {pagination.last_visible_page}
              </span>

              <button
                className={"rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40"}
                disabled={!pagination.has_next_page}
                type={"button"}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )
    }

    if (query.trim()) {
      return <p className={"mt-8 text-center text-sm text-zinc-500"}>No anime found.</p>
    }

    return <p className={"mt-8 text-center text-sm text-zinc-500"}>Search for an anime to browse its characters.</p>
  }

  // --- Anime search results ---
  return (
    <div>
      {/* Search input */}
      <div className={"relative"}>
        <Search className={"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"} />

        <input
          className={"w-full rounded-lg border border-zinc-700/50 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"}
          placeholder={"Search anime..."}
          type={"text"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {renderResults()}
    </div>
  )
}
