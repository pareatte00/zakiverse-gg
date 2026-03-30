/**
 * Emit a session-expired event when a 401 status is detected.
 * Any code can call `checkSession(status)` after an API call
 * to automatically trigger the session-expired modal.
 */
export function checkSession(status: number) {
  if (status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("zakiverse:session-expired"))
  }
}
