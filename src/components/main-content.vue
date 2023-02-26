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
- 投稿の id は uuid v4 にする
- db に同時刻同メッセージの投稿を許容しないようにする
  - 同一 PC で動いている時に同じ内容が書き込まれてしまうため
- 同期処理の実装
*/
import ATextField from './atoms/a-text-field.vue'
import { ref } from 'vue'
import { MessengerDb } from '../classes/messenger-db'

const db = await MessengerDb.load()
console.log(db)

const input = ref('')
const text = ref('')

const records = await db.getAllMessages()

text.value = records
  .map((record) => `${record.name}: ${record.body}`)
  .join('\n')

console.log({ records })

const connection = ref(new WebSocket('ws://localhost:21453/'))
console.log('connecting...')
await new Promise((resolve) => (connection.value.onopen = resolve))
console.log('connected')
async function addText(sender: string, body: string) {
  const userName = sender.slice(0, 5)
  text.value += '\n' + userName + ': ' + body

  const userId = 1
  db.createMessage(userId, body)
  // await db.execute(`INSERT OR IGNORE INTO users (name) VALUES (?);`, [userName])
  // const userId: string =
  //   (await db
  //     .select<{ id: string }>(`SELECT id FROM users WHERE name = ?;`, [
  //       userName,
  //     ])
  //     .then((r) => r[0]?.id)) ?? ''
}
connection.value.onmessage = function (event) {
  console.log({ event })
  const data = JSON.parse(event.data)
  addText(data.sender, data.message)
}
</script>
