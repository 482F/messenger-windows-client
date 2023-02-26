<template>
  <div class="main-content">
    main-content
    <v-text-field
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
import { ref } from 'vue'

const input = ref('')
const text = ref('')

const connection = ref(new WebSocket('ws://localhost:21453/'))
console.log('connecting...')
await new Promise((resolve) => (connection.value.onopen = resolve))
console.log('connected')
function addText(sender: string, addition: string) {
  text.value += '\n' + sender.slice(0, 5) + ': ' + addition
}
connection.value.onmessage = function (event) {
  console.log({ event })
  const data = JSON.parse(event.data)
  addText(data.sender, data.message)
}
</script>
