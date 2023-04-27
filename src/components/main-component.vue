<template>
  <resizable-layout
    style="height: 100%; width: 100%"
    class="main-conponent"
    :grid-template-areas="`
      'left center right'
    `"
    :area-defs="{
      left: {
        resizable: { right: true },
        size: { width: { value: config.leftWidth, min: 100 } },
      },
      center: {
        resizable: { right: true },
        size: { width: { value: config.centerWidth, min: 100 } },
      },
      right: {},
    }"
    @update:left-width="config.leftWidth = $event"
    @update:center-width="config.centerWidth = $event"
  >
    <template v-slot:left>
      <side-bar class="side-bar" />
    </template>
    <template v-slot:center>
      <main-content class="main-content" />
    </template>
    <template v-slot:right> right </template>
  </resizable-layout>
  <!-- <ew-resizable-layout
    class="main-conponent"
    v-model:left-width="config.leftWidth"
  >
    <template v-slot:left>
      <side-bar class="side-bar" />
    </template>
    <template v-slot:right>
      <main-content class="main-content" />
    </template>
  </ew-resizable-layout> -->
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EwResizableLayout from './ew-resizable-layout.vue'
import SideBar from './side-bar.vue'
import MainContent from './main-content.vue'
// import ResizableLayout from '~/lib/@482F-utils/vue3/src/molecules/resizable-layout.vue'
import ResizableLayout from '@482F-utils/vue3/src/molecules/resizable-layout.vue'

import { getConfig } from '../utils/config'

const sizes = ref({
  abH: 300,
  aW: 300,
})

const config = await getConfig()

defineProps<{ titles: { left: string; right: string } }>()
defineEmits<{
  (e: 'update:titles', newTitles: { left: string; right: string }): void
}>()
</script>

<style lang="scss" scoped>
.main-component {
  user-select: none;
  height: 100%;
  .side-bar,
  .main-content {
    height: 100%;
  }
  .side-bar {
    overflow-y: scroll;
  }
}
</style>
