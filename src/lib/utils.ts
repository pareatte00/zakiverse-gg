import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ExtractParams<T extends string> = T extends `${string}{${infer Param}}${infer Rest}` ? Param | ExtractParams<Rest> : never

export function formatUri<T extends string>(
  template: T,
  params: { [K in ExtractParams<T>]: string | number },
): string {
  return template.replace(/{(\w+)}/g, (_, key: string) => {
    return encodeURIComponent(String(params[key as ExtractParams<T>]))
  })
}

export function formatIso(isoString: string | Date, twelveHour: boolean = false): string | null {
  const date = new Date(isoString)

  if (isNaN(date.getTime())) {
    return null
  }

  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, "0")

  let formattedTime: string

  if (twelveHour) {
    const formattedHours = String((hours % 12) || 12).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    formattedTime = `${formattedHours}:${minutes}} ${ampm}`
  }
  else {
    const formattedHours = String(hours).padStart(2, "0")
    formattedTime = `${formattedHours}:${minutes}`
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} | ${formattedTime}`
}

export const title = (string: string) => string.replace(/(^\w{1})|(\s+\w{1})/g, (c) => c.toUpperCase())

export const capitalize = (string: string) => string.replace(/^\w/, (c) => c.toUpperCase())

export const uppercase = (string: string) => string.toUpperCase()

export const lowercase = (string: string) => string.toLowerCase()

export const clone = <T>(data: T): T => {
  return structuredClone(data)
}

export const formatApiDate = (d: Date) => {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`
}

export const capitalizedSnakeCase = (string: string) => {
  return string.split("_").map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()).join(" ")
}
