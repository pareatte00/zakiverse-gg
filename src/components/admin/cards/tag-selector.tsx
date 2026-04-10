"use client"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CardTagPayload } from "@/lib/api/db/api.card-tag"
import { cardTagCreateOne, cardTagFindAll } from "@/lib/api/db/api.card-tag"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, Plus, Tag, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface TagSelectorProps {
  value:    string
  onChange: (tagId: string, tagName: string) => void
}

export function TagSelector({ value, onChange }: TagSelectorProps) {
  const [ open, setOpen ] = useState(false)
  const [ tags, setTags ] = useState<CardTagPayload[]>([])
  const [ loading, setLoading ] = useState(false)
  const [ creating, setCreating ] = useState(false)
  const [ search, setSearch ] = useState("")
  const fetched = useRef(false)
  const fetchTags = useCallback(async () => {
    if (fetched.current) return

    fetched.current = true
    setLoading(true)

    const { response } = await cardTagFindAll({ page: 1, limit: 100 })

    setTags(response?.payload ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchTags()
  }, [ fetchTags ])

  const selectedTag = tags.find((t) => t.id === value)
  const trimmedSearch = search.trim()
  const exactMatch = tags.some((t) => t.name.toLowerCase() === trimmedSearch.toLowerCase())

  async function handleCreateTag() {
    if (!trimmedSearch || exactMatch || creating) return

    setCreating(true)

    const { response, status } = await cardTagCreateOne({ name: trimmedSearch })
    const created = status < 400 ? response?.payload : null

    if (created) {
      setTags((prev) => [ ...prev, created ])
      onChange(created.id, created.name)
      setSearch("")
      setOpen(false)
    }

    setCreating(false)
  }

  return (
    <div className={"flex items-center gap-2"}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              value
                ? "border-zinc-700/60 bg-zinc-800/40 text-zinc-100"
                : "border-zinc-700/40 bg-zinc-800/20 text-zinc-500",
            )}
            type={"button"}
          >
            <span className={"flex items-center gap-2"}>
              <Tag className={"h-3.5 w-3.5 shrink-0 text-zinc-500"} />
              {selectedTag?.name ?? "No tag"}
            </span>

            <div className={"ml-auto flex items-center gap-1.5"}>
              <ChevronsUpDown className={"h-3.5 w-3.5 shrink-0 text-zinc-500"} />

              {value && (
                <button
                  className={"text-zinc-400 transition-colors hover:text-zinc-200"}
                  type={"button"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange("", "")
                  }}
                >
                  <X className={"h-3.5 w-3.5"} />
                </button>
              )}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align={"start"}
          className={"p-0"}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command>
            <CommandInput
              placeholder={"Search or create tag..."}
              value={search}
              onValueChange={setSearch}
            />

            <CommandList>
              {loading
                ? (
                  <div className={"flex items-center justify-center py-4"}>
                    <Loader2 className={"h-4 w-4 animate-spin text-zinc-500"} />
                  </div>
                )
                : (
                  <>
                    <CommandEmpty>
                      {trimmedSearch
                        ? (
                          <button
                            className={"flex w-full items-center gap-2 px-2 py-1.5 text-sm text-amber-400 hover:text-amber-300"}
                            disabled={creating}
                            type={"button"}
                            onClick={() => void handleCreateTag()}
                          >
                            {creating
                              ? <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
                              : <Plus className={"h-3.5 w-3.5"} />}

                            Create &quot;{trimmedSearch}&quot;
                          </button>
                        )
                        : "No tags found."}
                    </CommandEmpty>

                    <CommandGroup>
                      {tags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => {
                            onChange(tag.id === value ? "" : tag.id, tag.id === value ? "" : tag.name)
                            setSearch("")
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              value === tag.id ? "opacity-100" : "opacity-0",
                            )}
                          />

                          {tag.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>

                    {/* Inline create option when search has no exact match */}
                    {trimmedSearch && !exactMatch && tags.length > 0 && (
                      <CommandGroup>
                        <CommandItem
                          disabled={creating}
                          value={`__create__${trimmedSearch}`}
                          onSelect={() => void handleCreateTag()}
                        >
                          {creating
                            ? <Loader2 className={"mr-2 h-3.5 w-3.5 animate-spin"} />
                            : <Plus className={"mr-2 h-3.5 w-3.5 text-amber-400"} />}

                          <span className={"text-amber-400"}>Create &quot;{trimmedSearch}&quot;</span>
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

    </div>
  )
}
