"use server"

import { Env } from "@/lib/const/const.env"
import usexAxios from "@/lib/hook/use-xaxios"

const imgbb = usexAxios(Env.imgbbApiUrl)

interface ImgbbResponse {
  success: boolean
  data?:   { url: string }
  error?:  { message: string }
}

interface ImgbbUploadResult {
  url?:   string
  error?: string
}

export async function uploadToImgbb(formData: FormData): Promise<ImgbbUploadResult> {
  const file = formData.get("image")

  if (!file) return { error: "No file provided" }

  const body = new FormData()
  body.append("key", Env.imgbbApiKey)
  body.append("image", file)

  const { response, status } = await imgbb.post<ImgbbResponse>({
    url:  "/1/upload",
    data: body,
  })

  if (response?.success && response.data?.url) {
    return { url: response.data.url }
  }

  return { error: response?.error?.message ?? `Upload failed (${status})` }
}
