"use client"

import { GameButton, GameButtonGroup } from "@/components/game/game-button"
import { Input } from "@/components/ui/input"
import type { Pagination } from "@/lib/api/jikan/api"
import type { CharacterFull, CharacterOrderBy } from "@/lib/api/jikan/api.character"
import { searchCharacters } from "@/lib/api/jikan/api.character"
import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { SearchResultCard } from "./search-result-card"

const ORDER_OPTIONS: { value: CharacterOrderBy, label: string }[] = [
  {
    value: "favorites",
    label: "Favorites",
  },
  {
    value: "name",
    label: "Name",
  },
  {
    value: "mal_id",
    label: "MAL ID",
  },
]

export function CharacterSearchTab() {
  const [ query, setQuery ] = useState("")
  const [ results, setResults ] = useState<CharacterFull[]>([])
  const [ pagination, setPagination ] = useState<Pagination | null>(null)
  const [ page, setPage ] = useState(1)
  const [ orderBy, setOrderBy ] = useState<CharacterOrderBy>("favorites")
  const [ sort, setSort ] = useState<"asc" | "desc">("desc")
  const [ loading, setLoading ] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doSearch = useCallback(async (q: string, p: number, ob: CharacterOrderBy, s: "asc" | "desc") => {
    if (!q.trim()) {
      setResults([])
      setPagination(null)

      return
    }

    setLoading(true)

    const { response } = await searchCharacters({ query: q, page: p, order_by: ob, sort: s })

    if (response) {
      const unique = response.data.filter((c, i, arr) => arr.findIndex((x) => x.mal_id === c.mal_id) === i)
      setResults(unique)
      setPagination(response.pagination)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    setPage(1)

    debounceRef.current = setTimeout(() => {
      void doSearch(query, 1, orderBy, sort)
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [ query, orderBy, sort, doSearch ])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    void doSearch(query, newPage, orderBy, sort)
  }

  function renderResults() {
    if (loading) {
      return (
        <div className={"mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div className={"aspect-[3/4] animate-pulse rounded-xl bg-zinc-800"} key={i} />
          ))}
        </div>
      )
    }

    if (results.length > 0) {
      return (
        <>
          <div className={"mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
            {results.map((char) => (
              <SearchResultCard
                anime={null}
                favorites={char.favorites}
                imageUrl={char.images.jpg.image_url}
                key={char.mal_id}
                malId={char.mal_id}
                name={char.name}
              />
            ))}
          </div>

          {pagination && pagination.last_visible_page > 1 && (
            <div className={"mt-6 flex items-center justify-center gap-2"}>
              <GameButton
                disabled={page <= 1}
                variant={"ghost"}
                onClick={() => handlePageChange(page - 1)}
              >
                Prev
              </GameButton>

              <span className={"text-sm text-zinc-500"}>
                {page} / {pagination.last_visible_page}
              </span>

              <GameButton
                disabled={!pagination.has_next_page}
                variant={"ghost"}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </GameButton>
            </div>
          )}
        </>
      )
    }

    if (query.trim()) {
      return <p className={"mt-8 text-center text-sm text-zinc-500"}>No characters found.</p>
    }

    return <p className={"mt-8 text-center text-sm text-zinc-500"}>Search for a character to get started.</p>
  }

  return (
    <div>
      {/* Search input */}
      <div className={"relative"}>
        <Search className={"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"} />

        <Input
          className={"pl-10"}
          placeholder={"Search characters..."}
          type={"text"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Order controls */}
      <div className={"mt-3 flex items-center gap-2"}>
        <GameButtonGroup
          options={ORDER_OPTIONS}
          value={orderBy}
          onChange={setOrderBy}
        />

        <GameButton
          variant={"ghost"}
          onClick={() => setSort((s) => s === "desc" ? "asc" : "desc")}
        >
          {sort === "desc" ? <ArrowDownAZ className={"h-5 w-5"} /> : <ArrowUpAZ className={"h-5 w-5"} />}
        </GameButton>
      </div>

      {renderResults()}
    </div>
  )
}
