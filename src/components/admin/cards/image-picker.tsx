/* eslint-disable @next/next/no-img-element */
"use client"

import type { Picture } from "@/lib/api/jikan/api.types"
import { cn } from "@/lib/utils"

interface ImagePickerProps {
  defaultImage: string
  pictures:     Picture[]
  selected:     string
  onSelect:     (url: string) => void
}

export function ImagePicker({ defaultImage, pictures, selected, onSelect }: ImagePickerProps) {
  const allImages = [
    defaultImage,
    ...pictures.map((p) => p.jpg.image_url).filter((url) => url !== defaultImage),
  ]

  return (
    <div className={"grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6"}>
      {allImages.map((url, i) => (
        <button
          className={cn(
            "aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all",
            selected === url
              ? "border-amber-500 ring-1 ring-amber-500/50"
              : "border-transparent hover:border-zinc-600",
          )}
          key={i}
          type={"button"}
          onClick={() => onSelect(url)}
        >
          <img
            alt={`Option ${i + 1}`}
            className={"h-full w-full object-cover"}
            src={url}
          />
        </button>
      ))}
    </div>
  )
}
