<template>
  <div class="chat">
    main-content
    <a-text-field
      v-model="input"
      @keydown.enter="
        () => {
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
import ATextField from '@482F-utils/vue3/src/atoms/a-text-field.vue'
import { Messenger } from '../classes/messenger'
import { ref } from 'vue'

const props = defineProps<{ messenger: Messenger }>()

const input = ref('')
const text = ref('')

const records = await props.messenger.getAllMessages()

text.value = records
  .map((record) => `${record.name}: ${record.body}`)
  .join('\n')


async function addText(sender: string, body: string) {
  const userName = sender.slice(0, 5)
  text.value += '\n' + userName + ': ' + body

  props.messenger.createMessage(body)
}
</script>

<style lang="scss" scoped></style>
