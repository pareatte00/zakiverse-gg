export async function findCookie(name: string): Promise<string | undefined> {
  if (typeof window !== "undefined") {
    const Cookies = await import("js-cookie")

    return Cookies.default.get(name)
  }
  else {
    const { cookies } = await import("next/headers")

    return (await cookies()).get(name)?.value
  }
}

export async function setCookie(name: string, value: string): Promise<void> {
  if (typeof window !== "undefined") {
    const Cookies = await import("js-cookie")

    Cookies.default.set(name, value, {
      expires:  365, // 1 year
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
    })
  }
}

export async function deleteCookie(name: string): Promise<void> {
  if (typeof window !== "undefined") {
    const Cookies = await import("js-cookie")
    Cookies.default.remove(name, {
      path:     "/",
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
    })
  }
}
