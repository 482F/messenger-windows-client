import { getDb } from '../utils/sql'

const initializeQueries = [
  `CREATE TABLE IF NOT EXISTS queries (
    id          INTEGER  UNIQUE NOT NULL PRIMARY KEY  ,
    query       JSON            NOT NULL              ,
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

export async function getMessengerDb() {
  const db = await getDb()
  await Promise.all(initializeQueries.map((query) => db.execute(query)))
  return db
}
