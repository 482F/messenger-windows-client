<template>
  <div
    class="ew-resizable-layout"
    :style="{ '--left-width': myLeftWidth + 'px' }"
  >
    <div class="left">
      <slot name="left" :classes="['left']"></slot>
    </div>
    <div class="resizer" ref="resizerEl" @mousedown="onResizeStart"></div>
    <div class="right">
      <slot name="right" :classes="['right']"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue'

const resizerEl: Ref<HTMLElement | undefined> = ref()

const props = withDefaults(
  defineProps<{
    leftWidth?: number
    leftMin?: number
    leftMax?: number
  }>(),
  {
    leftWidth: 300,
    leftMin: 0,
    leftMax: Infinity,
  }
)
const $emit = defineEmits<{
  (e: 'update:left-width', newLeftWidth: number): void
}>()

const myLeftWidth = ref(props.leftWidth)

const resizeState = ref({
  initialLeftWidth: myLeftWidth.value,
  resizing: false,
  start: 0,
  end: 0,
})

function updateLeftWidth(value: number) {
  myLeftWidth.value = Math.min(Math.max(value, props.leftMin, 0), props.leftMax)
  $emit('update:left-width', myLeftWidth.value)
}

function onResizeMove(e: MouseEvent) {
  resizeState.value.end = e.clientX

  const { initialLeftWidth, start, end } = resizeState.value
  updateLeftWidth(initialLeftWidth + end - start)
}

function onResizeEnd() {
  resizeState.value.initialLeftWidth = myLeftWidth.value
  resizeState.value.resizing = false
  resizeState.value.start = 0
  resizeState.value.end = 0

  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)

  const actualLeftWidth = resizerEl.value?.getBoundingClientRect().x
  if (actualLeftWidth !== undefined) {
    updateLeftWidth(actualLeftWidth)
  }
}

function onResizeStart(e: MouseEvent) {
  resizeState.value.initialLeftWidth = myLeftWidth.value
  resizeState.value.resizing = true
  resizeState.value.start = resizeState.value.end = e.clientX

  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}
</script>

<style lang="scss" scoped>
.ew-resizable-layout {
  --left-width: 300px;
  display: grid;
  grid-template: 1fr / minmax(min-content, var(--left-width)) 0px 1fr;
  > .resizer {
    width: 8px;
    z-index: 1;
    cursor: ew-resize;
  }
}
</style>
