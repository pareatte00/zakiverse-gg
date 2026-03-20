import { NextRequest } from "next/server"

export default function middleware(req: NextRequest) {
  // const accessToken = req.cookies.get(Cookie.accessToken)?.value

  // if (accessToken) {
  //   return NextResponse.next()
  // }

  // const url = req.nextUrl.clone()
  // url.pathname = Route.Public.Login

  // return NextResponse.redirect(url)
}

export const config = {
  matcher: [ "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$|login).*)" ],
}
