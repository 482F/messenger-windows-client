import {
  getConfig as _getConfig,
  suppressSymbol,
  deepSet,
} from '@482f-utils/vue3/src/config'
import { ref, Ref } from 'vue'
import { getDb, EDatabase } from './sql'
import { isTauriEvent, Host } from './common'
import {
  Json,
  isJson,
  JsonNonPrimitive,
  isJsonPrimitive,
  Key,
} from '@482F-utils/ts/src/common'
import throttle from 'lodash/throttle'
import { emit } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'

export type ColorConfig = {
  label: string
  value: string
}
const defaultConfig = {
  leftWidth: 300,
  centerWidth: 300,
  currentHost: {
    serverUrl: '',
    serverName: '',
    serverPassword: '',
    userId: '',
    userName: '',
    userPassword: '',
    autoLogin: true,
  } satisfies Host as Host,
  colors: {
    'titlebar': { label: 'タイトルバー', value: 'lightgray' },
    'background': { label: '背景', value: 'white' },
    'accent-color': { label: 'アクセントカラー', value: 'lightblue' },
  } satisfies { [x: string]: ColorConfig },
}

const refConfigPromise = (async () => {
  const db = await getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS configs (
      key   TEXT NOT NULL PRIMARY KEY,
      value TEXT NOT NULL
    );`)
  const dbUpdaters: Record<
    string,
    ReturnType<typeof throttle<(value: unknown) => void>>
  > = {}
  return _getConfig(defaultConfig, {
    read: (key) => {
      const result = db
        .select<{ key: string; value: string }>(
          `SELECT value FROM configs WHERE key = $1`,
          [key]
        )
        .then((record) => record[0]?.value)
      return result
    },
    write: (key, value) => {
      const dbUpdater = (dbUpdaters[key] ??= throttle((value) => {
        db.execute(
          `INSERT INTO configs (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
          [key, value]
        )
      }, 1000))
      dbUpdater(value)
      emit('update-config', { key, value })
    },
  })
})()

export async function getConfig() {
  return await refConfigPromise
}

// let dbPromise: undefined | Promise<EDatabase>

// async function getInitialConfig(db: EDatabase): Promise<Config> {
//   const records: Record<string, string> = Object.fromEntries(
//     await db
//       .select<{ key: string; value: string }>(`SELECT * FROM configs`)
//       .then((rawRecords) => {
//         const records: [string, string][] = rawRecords.map((rawRecord) => [
//           rawRecord.key,
//           rawRecord.value,
//         ])
//         return records.sort((a, b) => {
//           const ak = a[0]
//           const bk = b[0]
//           if (ak < bk) return -1
//           else if (ak > bk) return 1
//           else return 0
//         })
//       })
//   )

//   const initialConfig = {}
//   const keys = (function func(val: Json, prefix: string): string[] {
//     if (isJsonPrimitive(val)) return [prefix]
//     else
//       return Object.entries(val).flatMap(([key, child]) => {
//         const nextKey = String(prefix ? prefix + '.' + key : key)
//         return func(child, nextKey)
//       })
//   })(defaultConfig, '')

//   keys.map((key) => {
//     const defaultValue = deepGet(defaultConfig, key)
//     const rawValue =
//       records[key] ??
//       (() => {
//         db.execute(`INSERT INTO configs VALUES($1, $2)`, [key, defaultValue])
//         return defaultValue
//       })()
//     const value = (() => {
//       if (typeof defaultValue === 'number') {
//         return Number(rawValue)
//       } else if (typeof defaultValue === 'boolean') {
//         return rawValue === 'true' ? true : false
//       } else {
//         return rawValue
//       }
//     })()
//     if (!isJsonPrimitive(value)) throw new Error()
//     deepSet(initialConfig, key, value, defaultConfig)
//   })
//   return initialConfig as Config
// }

// type HasKey<T> = T & { [keySymbol]: string }

// type Consumer = (value: unknown) => void
// const dbUpdaters: Record<string, ReturnType<typeof throttle<Consumer>>> = {}
// const emitters: Record<string, ReturnType<typeof throttle<Consumer>>> = {}

// const proxyHandler = {
//   set<T extends HasKey<JsonNonPrimitive>>(
//     obj: T,
//     prop: Key,
//     value: unknown
//   ): boolean {
//     const anyProp = prop as any
//     if (!(prop in obj))
//       throw new Error(`オブジェクトは '${String(prop)}' メンバを持てません`)
//     if (typeof obj[anyProp] !== typeof value)
//       throw new Error(
//         `'${String(prop)}' メンバの値の型は ${typeof obj[
//           anyProp
//         ]} である必要があります`
//       )

//     if (isJsonPrimitive(obj[anyProp])) {
//       obj[anyProp] = value as any
//     } else {
//       Object.assign(obj[anyProp] ?? {}, value as any)
//     }

//     if (!refConfig || refConfig[emittedSymbol]) {
//       return true
//     }

//     const key = obj[keySymbol]
//       ? obj[keySymbol] + '.' + String(prop)
//       : String(prop)
//     const dbUpdater = (dbUpdaters[key] ??= throttle((value) => {
//       dbPromise ??= getDb()
//       dbPromise.then((db) =>
//         db.execute(`UPDATE configs SET value = $2 WHERE key = $1;`, [
//           key,
//           String(value),
//         ])
//       )
//     }, 1000))
//     dbUpdater(value)
//     const emitter = (emitters[key] ??= throttle((value) => {
//       emit('update-config', { key, value })
//     }, 100))
//     emitter(value)

//     return true
//   },
// }

// export async function __getConfig(): Promise<RefConfig> {
//   refConfigPromise ??= (async () => {
//     dbPromise ??= getDb()
//     const db = await dbPromise
//     await db.execute(`
//       CREATE TABLE IF NOT EXISTS configs (
//         key   TEXT NOT NULL PRIMARY KEY,
//         value TEXT NOT NULL
//       );`)
//     const initialConfig = await getInitialConfig(db)

//     const configProxy = (function func<T extends JsonNonPrimitive>(
//       target: T,
//       key: string
//     ): HasKey<T> {
//       const ifunc = (value: Json, childKey: string | number): Json => {
//         if (isJsonPrimitive(value)) return value
//         else
//           return func(
//             value,
//             key ? key + '.' + String(childKey) : String(childKey)
//           )
//       }
//       const processedTarget: JsonNonPrimitive & { [keySymbol]?: string } =
//         (() => {
//           if (Array.isArray(target)) {
//             return target.map(ifunc)
//           } else {
//             return Object.fromEntries(
//               Object.entries(target).map(([key, value]) => [
//                 key,
//                 ifunc(value, key),
//               ])
//             )
//           }
//         })()
//       processedTarget[keySymbol] = key

//       return new Proxy(processedTarget, proxyHandler) as HasKey<T>
//     })(initialConfig, '')

//     return ref(configProxy)
//   })()

//   refConfig ??= await refConfigPromise
//   return refConfig
// }

listen('update-config', async (e: unknown) => {
  if (
    !refConfigPromise ||
    !isTauriEvent(e) ||
    e.windowLabel === appWindow.label ||
    !(e.payload instanceof Object) ||
    !('key' in e.payload) ||
    !('value' in e.payload) ||
    typeof e.payload.key !== 'string' ||
    !isJson(e.payload.value)
  ) {
    return
  }

  const refConfig = await refConfigPromise
  const { key, value } = e.payload
  refConfig[suppressSymbol] = true
  try {
    deepSet(refConfig.value, key, value, defaultConfig)
  } catch (e) {}
  refConfig[suppressSymbol] = false
})
