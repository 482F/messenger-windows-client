<template>
  <ew-resizable-layout
    class="main-conponent"
    v-model:left-width="config.leftWidth"
  >
    <template v-slot:left>
      <side-bar class="side-bar" />
    </template>
    <template v-slot:right>
      <main-content class="main-content" />
    </template>
  </ew-resizable-layout>
</template>

<script setup lang="ts">
import EwResizableLayout from './ew-resizable-layout.vue'
import SideBar from './side-bar.vue'
import MainContent from './main-content.vue'
import { getConfig } from '../utils/config'

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
