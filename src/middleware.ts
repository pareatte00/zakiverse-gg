import { NextRequest, NextResponse } from "next/server"
import { findCookie } from "./lib/hook/cookie"
import { Cookie } from "./lib/const/const.cookie"
import { Route } from "./lib/const/const.url"

export default async function middleware(req: NextRequest) {
  const temporaryKey = await findCookie(Cookie.temporaryKey)

  if (temporaryKey) {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = Route.Public.Login

  return NextResponse.redirect(url)
}

export const config = {
  matcher: [ "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$|login).*)" ],
}
