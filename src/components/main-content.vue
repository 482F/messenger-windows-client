<template>
  <div class="main-content">
    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate />
    </div>
    <chat v-else-if="messenger" class="chat" :messenger="messenger" />
    <host-register-form
      v-else
      v-model:current-host="config.currentHost"
      v-model:messenger="messenger"
    />
  </div>
</template>

<script setup lang="ts">
/*
TODO:
- 同期処理の実装
- サーバ、ユーザのパスワードをどう持つか
  - DB には平文で保存したくはないけれど、どうしようもない気が・・・
- ws について、once みたいな一度だけ eventlistener を登録するようなメソッドを実装したクラスを作りたい
- user 登録の実装
  - 公開鍵、秘密鍵を作成して複合鍵暗号通信の実装
*/
import { Messenger } from '../classes/messenger'
import Chat from './chat.vue'
import HostRegisterForm from './host-register-form.vue'
import { getConfig } from '../utils/config'
import { ref, Ref } from 'vue'

const config = await getConfig()
config.value.currentHost = await Messenger.getCurrentHost()

const messenger: Ref<Messenger | undefined> = ref(undefined)
const loading = ref(false)
if (config.value.currentHost.autoLogin) {
  loading.value = true
  Messenger.login(config.value.currentHost)
    .then((r) => (messenger.value = r))
    .finally(() => (loading.value = false))
}
</script>

<style lang="scss" scoped>
.main-content {
  > * {
    height: 100%;
  }
  > .loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
