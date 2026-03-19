export interface ImageURLs {
  image_url:       string
  small_image_url: string
  large_image_url: string
}

export interface Images {
  jpg:  ImageURLs
  webp: ImageURLs
}

export interface MALEntry {
  mal_id: number
  type:   string
  name:   string
  url:    string
}

export interface Title {
  type:  string
  title: string
}

export interface DateRange {
  from:   string
  to:     string
  prop:   DateProp
  string: string
}

export interface DateProp {
  from: DateParts
  to:   DateParts
}

export interface DateParts {
  day:   number | null
  month: number | null
  year:  number | null
}

export interface Trailer {
  youtube_id: string
  url:        string
  embed_url:  string
  images:     TrailerImages
}

export interface TrailerImages {
  image_url:         string
  small_image_url:   string
  medium_image_url:  string
  large_image_url:   string
  maximum_image_url: string
}

export interface Broadcast {
  day:      string
  time:     string
  timezone: string
  string:   string
}

export interface Relation {
  relation: string
  entry:    MALEntry[]
}

export interface ExternalLink {
  name: string
  url:  string
}

export interface Person {
  mal_id: number
  url:    string
  images: Images
  name:   string
}

export interface Picture {
  jpg:  ImageURLs
  webp: ImageURLs
}
