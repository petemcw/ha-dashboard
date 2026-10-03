import { getUser, type Connection } from 'home-assistant-js-websocket'

export type CurrentUser = { id: string; isAdmin: boolean }

export async function fetchCurrentUser(conn: Connection): Promise<CurrentUser> {
  const user = await getUser(conn)
  return { id: user.id, isAdmin: user.is_admin }
}
