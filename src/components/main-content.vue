<template>
  <div class="main-content">
    main-content
    <a-text-field
      v-model="input"
      @keydown.enter="
        () => {
          connection.send(input)
          addText('me', input)
          input = ''
        }
      "
    />
    <div class="text">
      <div v-for="line of text.split('\n')">{{ line }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
/*
TODO:
- user 登録の実装
  - 公開鍵、秘密鍵を作成して複合鍵暗号通信の実装
- INSERT 等はクラスのメソッドに隠す
- db に同時刻同メッセージの投稿を許容しないようにする
  - 同一 PC で動いている時に同じ内容が書き込まれてしまうため
- 同期処理の実装
*/
import ATextField from './atoms/a-text-field.vue'
import { ref } from 'vue'
import { getMessengerDb } from '../classes/messenger-db'

const db = await getMessengerDb()
console.log(db)

const input = ref('')
const text = ref('')

const records = await db.select<{
  id: number
  body: string
  userId: number
  time: Date
}>(`SELECT * FROM messages;`)

text.value = records
  .map((record) => `${record.userId}: ${record.body}`)
  .join('\n')

console.log({ records })

const connection = ref(new WebSocket('ws://localhost:21453/'))
console.log('connecting...')
await new Promise((resolve) => (connection.value.onopen = resolve))
console.log('connected')
async function addText(sender: string, body: string) {
  const userName = sender.slice(0, 5)
  text.value += '\n' + userName + ': ' + body

  const now = new Date()
  await db.execute(`INSERT OR IGNORE INTO users (name) VALUES (?);`, [userName])
  const userId: string =
    (await db
      .select<{ id: string }>(`SELECT id FROM users WHERE name = ?;`, [
        userName,
      ])
      .then((r) => r[0]?.id)) ?? ''
  const { lastInsertId: postId } = await db.execute(
    `INSERT INTO messages (body, user_id, time) VALUES (?, ?, ?);`,
    [body, userId, now]
  )
  await db.execute(`INSERT INTO queries (query, time) VALUES (?, ?);`, [
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
connection.value.onmessage = function (event) {
  console.log({ event })
  const data = JSON.parse(event.data)
  addText(data.sender, data.message)
}
</script>
