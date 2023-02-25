<template>
  <div class="host-register-form">
    <a-text-field
      v-for="{ key, label, allowEmpty } of keyAndLabels"
      :label="label"
      v-model="myCurrentHost[key]"
      @blur="isBlured[key] = true"
      @keydown.enter="login"
      :error="isBlured[key] && !allowEmpty && myCurrentHost[key] === ''"
      :disabled="loading"
    />
    <a-checkbox
      class="auto-login-check half"
      label="自動ログイン"
      :disabled="loading"
      v-model="myCurrentHost.autoLogin"
    />
    <a-button
      class="submit-button half"
      variant="flat"
      @click="login"
      :disabled="!(loginable && !loading)"
      :color="loginable && !loading ? undefined : 'lightgray'"
      :loading="loading"
    >
      ログイン
    </a-button>
  </div>
</template>

<script setup lang="ts">
import ATextField from './atoms/a-text-field.vue'
import ACheckbox from './atoms/a-checkbox.vue'
import AButton from './atoms/a-button.vue'
import { Host } from '../utils/common'
import { ref, Ref, computed } from 'vue'
import { getConfig } from '../utils/config'
import { Messenger } from '../classes/messenger'

const config = await getConfig()

const props = defineProps<{ currentHost: Host; messenger?: Messenger }>()
const emits = defineEmits<{
  (e: 'update:current-host', newCurrentHost: Host): void
  (e: 'update:messenger', newMessenger: Messenger): void
}>()

const keyAndLabels = [
  { key: 'serverName', label: 'サーバ表示名', allowEmpty: false },
  { key: 'serverUrl', label: 'url', allowEmpty: true },
  { key: 'serverPassword', label: 'サーバ パスワード', allowEmpty: true },
  { key: 'userId', label: 'ユーザ ID', allowEmpty: false },
  { key: 'userName', label: 'ユーザ表示名', allowEmpty: false },
  { key: 'userPassword', label: 'ユーザ パスワード', allowEmpty: true },
] as const

const isBlured: Ref<Record<string, boolean>> = ref({})

const myCurrentHost = ref({ ...props.currentHost })

const loginable = computed(() =>
  keyAndLabels.every(
    ({ key, allowEmpty }) => allowEmpty || myCurrentHost.value[key] !== ''
  )
)
const loading = ref(false)

async function login() {
  loading.value = true
  try {
    emits('update:current-host', myCurrentHost.value)
    const messenger = await Messenger.login(config.value.currentHost)
    if (messenger) {
      emits('update:messenger', messenger)
      emits('update:current-host', myCurrentHost.value)
    } else {
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.host-register-form {
  height: 100%;

  display: grid;
  align-content: center;
  justify-content: center;
  grid-template: auto / 200px 200px;
  gap: 12px;
  > * {
    grid-area: span 1 / span 2;
  }
  > .half {
    grid-area: span 1 / span 1;
  }

  > :is(.submit-button, .auto-login-check) {
    justify-self: center;
  }

  > .submit-button {
    width: 128px;
  }
}
</style>
