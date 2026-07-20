<template>
  <el-config-provider :locale="appStore.setting.locale.value">
    <el-container :style="{'--sideBarWidth': sideBarWidth}">
      <el-aside :width="leftWidth" class="app-left">
        <g-aside></g-aside>
      </el-aside>
      <el-container class="app-container ">
        <el-header class="app-header">
          <g-header></g-header>
        </el-header>
        <div class="header-tags">
          <tags></tags>
        </div>

        <el-main class="app-main">
          <router-view v-slot="{ Component }">
            <transition mode="out-in" name="el-fade-in-linear">
              <keep-alive :include="cachedTags">
                <component :is="Component"/>
              </keep-alive>
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<script setup>
  import { useAppStore } from '@/store/app'
  import { useTagsStore } from '@/store/tags'
  import { ref, computed } from 'vue'
  import Tags from '@/layout/components/tags/index.vue'
  import GAside from '@/layout/components/aside.vue'
  import GHeader from '@/layout/components/header.vue'

  const appStore = useAppStore()
  const tagStore = useTagsStore()
  const sideBarWidth = computed(() => appStore.setting.locale.sideBarWidth)
  const leftWidth = computed(() => appStore.setting.sideIsCollapse ? 'var(--yj-sidebar-collapsed-width)' : 'var(--sideBarWidth)')

  const cachedTags = ref([])

  cachedTags.value = tagStore.cached
</script>

<style lang="scss" scoped>
.app-header {
  background-color: var(--yj-surface);
  color: var(--yj-text-primary);
  display: flex;
  align-items: center;
  height: var(--yj-header-height);
  padding: 0 var(--yj-spacing-xl) 0 var(--yj-spacing-lg);
  box-shadow: var(--yj-shadow-sm);
  position: relative;
  z-index: var(--yj-z-sticky);
}

.header-tags {
  height: var(--yj-tags-height);
  background-color: var(--yj-surface);
  border-bottom: 1px solid var(--yj-divider);
  display: flex;
  align-items: center;
  gap: var(--yj-spacing-sm);
  padding: 0 var(--yj-spacing-xl);
}

.app-left {
  transition: width var(--yj-duration-normal) var(--yj-easing-standard);
  box-shadow: var(--yj-shadow-sm);
  z-index: calc(var(--yj-z-sticky) + 1);
}

.app-container {
  min-height: 100vh;
}

.app-main {
  background-color: var(--yj-bg);
  padding: var(--yj-spacing-xxl);
}
</style>


