import { getDb, EDatabase } from '../utils/sql'
import { ulid } from 'ulidx'

const initializeQueries = [
  // query は JSON 形式だが、tauri-plugin-sql が JSON をサポートしていないためこちらでパースする
  `CREATE TABLE IF NOT EXISTS queries (
    id          INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    query       TEXT            NOT NULL              ,
    time        DATETIME        NOT NULL              ,
    UNIQUE(query, time)
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    id          INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    name        TEXT     UNIQUE NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS messages (
    id          TEXT     UNIQUE NOT NULL PRIMARY KEY  ,
    body        TEXT                                  ,
    user_id     INTEGER         NOT NULL              ,
    time        DATETIME        NOT NULL              ,
    FOREIGN KEY(user_id) REFERENCES users(id)         ,
    UNIQUE(body, time, user_id)
  );`,
]

export class MessengerDb {
  db: EDatabase
  constructor(db: EDatabase) {
    this.db = db
  }
  static async load() {
    const db = await getDb()
    await Promise.all(initializeQueries.map((query) => db.execute(query)))
    return new MessengerDb(db)
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
      FROM messages
        INNER JOIN users
        ON messages.user_id = users.id;`)
  }
  async createMessage(userId: number, body: string) {
    const now = new Date()
    const messageId: string = ulid()
    await this.db.execute(
      `INSERT INTO messages (id, body, user_id, time) VALUES (?, ?, ?, ?);`,
      [messageId, body, userId, now]
    )
    await this.db.execute(`INSERT INTO queries (query, time) VALUES (?, ?);`, [
      JSON.stringify({
        userId,
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
    ])
  }
}
