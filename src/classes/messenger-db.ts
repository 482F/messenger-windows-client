import { getDb, EDatabase } from '../utils/sql'

const initializeQueries = [
  // query は JSON 形式だが、tauri-plugin-sql が JSON をサポートしていないためこちらでパースする
  `CREATE TABLE IF NOT EXISTS queries (
    id          INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    query       TEXT            NOT NULL              ,
    time        DATETIME        NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    id          INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    name        TEXT     UNIQUE NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    body        TEXT                                  ,
    user_id     INTEGER         NOT NULL              ,
    time        DATETIME        NOT NULL              ,
    FOREIGN KEY(user_id) REFERENCES users(id)
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
      id: number
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
    const { lastInsertId: postId } = await this.db.execute(
      `INSERT INTO messages (body, user_id, time) VALUES (?, ?, ?);`,
      [body, userId, now]
    )
    await this.db.execute(`INSERT INTO queries (query, time) VALUES (?, ?);`, [
      JSON.stringify({
        userId,
        type: 'post.create',
        payload: {
          postId,
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
