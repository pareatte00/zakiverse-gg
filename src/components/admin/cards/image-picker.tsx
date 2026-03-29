/* eslint-disable @next/next/no-img-element */
"use client"

import { uploadToImgbb } from "@/lib/api/imgbb/api.image"
import type { Picture } from "@/lib/api/jikan/api.types"
import { cn } from "@/lib/utils"
import { ImagePlus, Link2, Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

interface ImagePickerProps {
  defaultImage:      string
  pictures:          Picture[]
  selected:          string
  onSelect:          (url: string) => void
  customImages?:     string[]
  onCustomImageAdd?: (url: string) => void
}

export function ImagePicker({ defaultImage, pictures, selected, onSelect, customImages = [], onCustomImageAdd }: ImagePickerProps) {
  const [ urlInput, setUrlInput ] = useState("")
  const [ uploading, setUploading ] = useState(false)
  const [ validating, setValidating ] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const allImages = [
    defaultImage,
    ...pictures.map((p) => p.jpg.image_url).filter((url) => url !== defaultImage),
    ...customImages.filter((url) => url !== defaultImage),
  ]

  function addCustomImage(url: string) {
    if (!url || !onCustomImageAdd) return

    if (allImages.includes(url)) {
      onSelect(url)

      return
    }

    onCustomImageAdd(url)
    onSelect(url)
  }

  async function handleFileUpload(file: File) {
    setUploading(true)

    const formData = new FormData()
    formData.append("image", file)

    const result = await uploadToImgbb(formData)

    if (result.url) {
      addCustomImage(result.url)
    }

    setUploading(false)
  }

  async function handleUrlAdd() {
    const url = urlInput.trim()

    if (!url) return

    setValidating(true)

    const valid = await new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    })

    setValidating(false)

    if (!valid) {
      toast.error("Not a valid image")

      return
    }

    addCustomImage(url)
    setUrlInput("")
  }

  return (
    <div className={"space-y-3"}>
      {/* Image grid */}
      <div className={"grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6"}>
        {allImages.map((url, i) => (
          <button
            className={cn(
              "aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all",
              selected === url
                ? "border-amber-500 ring-1 ring-amber-500/50"
                : "border-transparent hover:border-zinc-600",
            )}
            key={url + i}
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

      {/* Import controls */}
      {onCustomImageAdd && (
        <div className={"flex items-center gap-2"}>
          {/* Upload button */}
          <input
            accept={"image/*"}
            className={"hidden"}
            ref={fileRef}
            type={"file"}
            onChange={(e) => {
              const file = e.target.files?.[0]

              if (file) void handleFileUpload(file)

              e.target.value = ""
            }}
          />

          <button
            className={"flex h-[30px] shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-2.5 text-xs text-zinc-400 transition-all duration-50 shadow-[0_3px_0_0_rgba(63,63,70,0.7)] hover:text-zinc-200 hover:shadow-[0_3px_0_0_rgba(63,63,70,0.7),0_6px_12px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none"}
            disabled={uploading}
            type={"button"}
            onClick={() => fileRef.current?.click()}
          >
            {uploading
              ? <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
              : <ImagePlus className={"h-3.5 w-3.5"} />}
            Upload
          </button>

          {/* URL input + Add */}
          <div className={"flex min-w-0 flex-1 items-center gap-1.5"}>
            <div className={"relative min-w-0 flex-1"}>
              <Link2 className={"absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600"} />

              <input
                className={"h-[33px] w-full rounded-lg border border-zinc-700/50 bg-zinc-800/40 pl-7 pr-2 mt-1 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"}
                placeholder={"Paste image URL..."}
                type={"text"}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleUrlAdd() }}
              />
            </div>

            <button
              className={"h-[30px] shrink-0 rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-2.5 text-xs text-zinc-400 transition-all duration-50 shadow-[0_3px_0_0_rgba(63,63,70,0.7)] hover:text-zinc-200 hover:shadow-[0_3px_0_0_rgba(63,63,70,0.7),0_6px_12px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none"}
              disabled={!urlInput.trim() || validating}
              type={"button"}
              onClick={() => void handleUrlAdd()}
            >
              {validating ? <Loader2 className={"h-3.5 w-3.5 animate-spin"} /> : "Add"}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
