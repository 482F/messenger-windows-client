import { getDb, EDatabase } from '../utils/sql'
import { ulid } from 'ulidx'
import { getConfig } from '../utils/config'
import { Host, makeSha256 } from '../utils/common'

const localInitializeQueries = [
  `CREATE TABLE IF NOT EXISTS hosts (
    id           INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    url          TEXT     UNIQUE NOT NULL              ,
    name         TEXT            NOT NULL              ,
    pass         TEXT            NOT NULL
  );`,
]
const getHostInitializeQueries = (hostUrl: string) => [
  // query は JSON 形式だが、tauri-plugin-sql が JSON をサポートしていないためこちらでパースする
  `CREATE TABLE IF NOT EXISTS "${hostUrl}.queries" (
    id           INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    query        TEXT            NOT NULL              ,
    time         DATETIME        NOT NULL              ,
    UNIQUE(query, time)
  );`,
  `CREATE TABLE IF NOT EXISTS "${hostUrl}.users" (
    id        TEXT     UNIQUE NOT NULL PRIMARY KEY  ,
    name      TEXT            NOT NULL              ,
    pass_hash TEXT            NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "${hostUrl}.messages" (
    id           TEXT     UNIQUE NOT NULL PRIMARY KEY  ,
    body         TEXT                                  ,
    user_id      INTEGER         NOT NULL              ,
    time         DATETIME        NOT NULL              ,
    FOREIGN KEY(user_id) REFERENCES "${hostUrl}.users"(id)          ,
    UNIQUE(body, time, user_id)
  );`,
]

const db = await getDb()
await Promise.all(localInitializeQueries.map((query) => db.execute(query)))

export class Messenger {
  db: EDatabase
  host: Host
  ws?: WebSocket
  constructor(db: EDatabase, host: Host, ws?: WebSocket) {
    this.db = db
    this.host = host
    this.ws = ws
  }
  static async login(host: Host) {
    if (!host.serverName) {
      return
    }

    // 'ws://localhost:21453/'
    const hostUrl = host.serverUrl

    const [ws, authenticated] = await (async () => {
      try {
        if (!host.serverUrl) {
          return [undefined, true]
        }
        const ws = new WebSocket(hostUrl)
        console.log('connecting...')
        const connected = await new Promise(
          (resolve: (result: boolean) => void) => {
            ws.onopen = () => resolve(true)
            setTimeout(() => resolve(false), 5000)
          }
        )
        if (!connected) {
          // toast
          console.log('サーバへの接続に失敗しました')
        }
        ws.send(`password: ${await makeSha256(host.serverPassword)}`)
        const authenticated = await new Promise(
          (resolve: (result: boolean) => void) => {
            ws.onmessage = (e) => {
              try {
                const { sender, message } = JSON.parse(e.data.toString()) as {
                  sender: string
                  message: string
                }
                resolve(sender === 'server' && message === 'authenticated')
              } catch {}
            }
            setTimeout(() => resolve(false), 5000)
          }
        )
        if (!authenticated) {
          // toast
          console.log('サーバ パスワードが違います')
        }
        return [ws, connected && authenticated]
      } catch {
        return [undefined, false]
      }
    })()
    if (!authenticated) {
      return
    }
    console.log('connected')

    await Promise.all(
      getHostInitializeQueries(hostUrl).map((query) => db.execute(query))
    )

    await Messenger.registerHost(host)

    const correctUserPasswordHash = await db
      .select<{ passHash: string }>(
        `SELECT pass_hash FROM ${Messenger.getTableName(hostUrl, 'users')}
        WHERE id = ?;`,
        [host.userId]
      )
      .then((r) => r[0]?.passHash)
    if (correctUserPasswordHash !== host.userPassword) {
      // toast
      console.log('ユーザ パスワードが違います')
      return
    }

    return new Messenger(db, host, ws)
  }
  static async getCurrentHost() {
    const config = await getConfig()
    if (config.value.currentHost.serverName) {
      return config.value.currentHost
    } else {
      return (
        (await db.select<Host>(`SELECT * FROM hosts;`).then((r) => r[0])) ??
        config.value.currentHost
      )
    }
  }
  static async registerHost(host: Host) {
    await db.execute(
      `INSERT OR IGNORE INTO hosts (url, name, pass) VALUES (?, ?, ?);`,
      [host.serverUrl, host.serverName, host.serverPassword]
    )
    await db.execute(
      `INSERT OR IGNORE INTO ${Messenger.getTableName(host.serverUrl, 'users')}
        (id, name, pass_hash) VALUES (?, ?, ?);`,
      [host.userId, host.userName, host.userPassword]
    )
  }
  static getTableName(hostUrl: string, tableName: string) {
    return `"${hostUrl}.${tableName}"`
  }
  getTableName(tableName: string) {
    return Messenger.getTableName(this.host.serverUrl, tableName)
  }
  async getAllMessages() {
    return this.db.select<{
      id: string
      body: string
      userId: number
      time: string
      name: string
    }>(`
      SELECT
        *
      FROM ${this.getTableName('messages')}
        INNER JOIN ${this.getTableName('users')}
        ON
          ${this.getTableName('messages')}.user_id
            = ${this.getTableName('users')}.id;`)
  }
  async createMessage(body: string) {
    const now = new Date()
    const messageId: string = ulid()
    this.ws?.send(body)
    await this.db.execute(
      `INSERT INTO
        ${this.getTableName('messages')}
        (id, body, user_id, time) VALUES (?, ?, ?, ?);`,
      [messageId, body, this.host.userId, now]
    )
    await this.db.execute(
      `INSERT INTO
        ${this.getTableName('queries')}
        (query, time) VALUES (?, ?);`,
      [
        JSON.stringify({
          userId: this.host.userId,
          type: 'post.create',
          payload: {
            messageId,
            body,
            // parentPostIds,
            // childPostIds,
            // tagIds,
          },
        }),
        now,
      ]
    )
  }
}
