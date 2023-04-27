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
- sql でスキーマ的な感じで、db に環境名を与えておくとそれをテーブルのプレフィックスにする、みたいなことをしたい
  - テーブル作成
  - 新しいテーブル作成、新しいカラム作成、FK 制約の追加くらいは後からできるようにしたい
- join
- ローカルのすべての操作もいったんクエリにして、それから解釈する
- 同期処理の実装
  - 同期以前に、全ての処理について一旦クエリを作り、applyQuery とかで具体的な db 操作などに変換する
  - 同期時には、そのホストと前に同期した以降の全てのクエリを貰い、全てのクエリを上書きで applyQuery する
  - 実際に DB に書き込まれる値としてはクエリに含まれる操作時刻であるが、操作の順序は逆転することになる
    - これはダメ。例えばチャンネルの名前を二人のユーザが同時に変えた後で同期した場合、それぞれのユーザで互いのユーザの名前が適用され食い違うことになってしまう
    - 結局、その後にそれにかかわるクエリが存在するかどうかなどを判別する必要がある。
    - チャンネル名を変えるクエリを適用するときに、それ以後のチャンネル名変更クエリがあるかどうかで適用するかどうかが変わる
    - それ以外にも、チャンネルの削除、可視状態の切り替え等も考える
    - さらにさらに、チャンネル名をローカルで変えた後、同期したクエリによってチャンネル名変更前にチャンネルが不可視になっていた場合は既にあるクエリを撤回しなければいけない
    - 同期によって過去のクエリにまで影響を与えるのは適切な実装が思いつかない
      - やっぱり同期前の時点までロールバックして全てのクエリを再適用するか
- サーバ、ユーザのパスワードをどう持つか
  - DB には平文で保存したくはないけれど、どうしようもない気が・・・
- ws について、once みたいな一度だけ eventlistener を登録するようなメソッドを実装したクラスを作りたい
- user 登録の実装
  - 公開鍵、秘密鍵を作成して複合鍵暗号通信の実装
- 位置情報の活用
- markdown のパース
- チェックボックスによる TODO 的な
  - 内部的にはメッセージの編集
*/
import { Messenger } from '../classes/messenger'
import Chat from './chat.vue'
import HostRegisterForm from './host-register-form.vue'
import { getConfig } from '../utils/config'
import { ref, Ref } from 'vue'

const config = await getConfig()
// config.value.currentHost = await Messenger.getCurrentHost()

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
