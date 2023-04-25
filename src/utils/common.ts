import { WebviewWindow, WindowOptions } from '@tauri-apps/api/window'
import { defineComponent } from 'vue'
import { makeSha256 as _makeSha256 } from '@482F-utils/ts/src/common'

type TauriEvent = {
  event: string
  id: number
  payload: unknown
  windowLabel: string
}
export function isTauriEvent(value: unknown): value is TauriEvent {
  if (!value || typeof value !== 'object') {
    return false
  }
  const tauriEvent = value as Record<keyof TauriEvent, unknown>
  if (
    typeof tauriEvent.event !== 'string' ||
    typeof tauriEvent.id !== 'number' ||
    !('payload' in tauriEvent) ||
    typeof tauriEvent.windowLabel !== 'string'
  ) {
    return false
  }
  return true
}
export type CommandlinePayload = {
  argv: string[]
  cwd: string
}

type Window = {
  getComponent: () => ReturnType<typeof defineComponent>
  titlebar: boolean
}
const windows = {
  Config: {
    getComponent: () => import('../components/config/config-setting.vue'),
    titlebar: true,
  },
  Default: {
    getComponent: () => import('../components/main-component.vue'),
    titlebar: true,
  },
} as const satisfies { [x: string]: Window }
type Hash = keyof typeof windows
function isHash(value: unknown): value is Hash {
  if (!Object.keys(windows).includes(value as Hash)) {
    return false
  }
  return true
}

const currentHash = location?.href?.match?.(/(?<=#).+$/)?.[0] || 'Default'
if (!isHash(currentHash)) {
  throw new Error('ハッシュ値が不正です')
}

export const currentWindow = windows[currentHash]

export function createWindow(
  label: string,
  hash: Hash,
  title?: string,
  options: WindowOptions = {}
) {
  const url = hash ? '#' + hash : ''
  const defaultOptions: WindowOptions = {
    url,
    title,
    fullscreen: false,
    height: 600,
    width: 800,
    resizable: true,
    decorations: false,
  }
  title ??= document.title
  const webview = new WebviewWindow(label, { ...defaultOptions, ...options })
  return webview
}

export type Host = {
  serverName: string
  serverUrl: string
  serverPassword: string
  userId: string
  userName: string
  userPassword: string
  autoLogin: boolean
}

export async function makeSha256(plain: string) {
  const salt = '5E43f'
  return _makeSha256(plain, salt)
}
