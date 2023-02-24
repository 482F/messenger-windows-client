import { invoke } from '@tauri-apps/api'
import { CommandlinePayload } from './common'
import Database from 'tauri-plugin-sql-api'

let dbPromise: Promise<Database> | undefined = undefined

export class EDatabase extends Database {
  select<T extends object[]>(
    query: string,
    bindValues?: unknown[] | undefined
  ): Promise<T>

  select<T extends object>(
    query: string,
    bindValues?: unknown[] | undefined
  ): Promise<T[]>

  async select<T extends object[] | object>(
    query: string,
    bindValues?: unknown[] | undefined
  ) {
    const selectFunc = Database.prototype.select<
      (T extends (infer U)[] ? U : T)[]
    >

    return await selectFunc.call(this, query, bindValues).then((rawRecords) => {
      const keyMap = new Map()
      return rawRecords.map((rawRecord) =>
        Object.fromEntries(
          Object.entries(rawRecord).map(([key, value]) => {
            const camelKey =
              keyMap.get(key) ??
              (() => {
                if (typeof key !== 'string') return key

                const splittedKeys = key.split('_')
                const newKey =
                  (splittedKeys[0] ?? '') +
                  splittedKeys
                    .slice(1)
                    .map(
                      (splittedKey) =>
                        (splittedKey[0] ?? '').toUpperCase() +
                        (splittedKey.slice(1) ?? '')
                    )
                    .join('')
                keyMap.set(key, newKey)
                return newKey
              })()
            return [camelKey, value]
          })
        )
      )
    })
  }
  static async load(path: string) {
    await Database.load(path) // rust 側で DB の読み込み準備を行っている
    return new EDatabase(path)
  }
}

export async function getDb(): Promise<EDatabase> {
  dbPromise ??= (async () => {
    const payload = await invoke('get_commandline').then((payload: unknown) => {
      const isCommandlinePayload = (
        data: unknown
      ): data is CommandlinePayload => {
        const payload = data as CommandlinePayload
        return Array.isArray(payload?.argv) && typeof payload?.cwd === 'string'
      }
      if (!isCommandlinePayload(payload)) {
        return
      }
      return payload
    })

    if (!payload) throw new Error('実行ファイルのパスが取得できませんでした')
    const exeDir = payload.argv[0]?.replace(/\\?[^\\]+$/, '')

    return EDatabase.load(`sqlite:${exeDir}\\info.sq3`)
  })()
  return await dbPromise
}
