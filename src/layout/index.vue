<template>
  <el-config-provider :locale="appStore.setting.locale.value">
    <el-container class="app-shell" :class="{ 'is-mobile': isMobile }" :style="{'--sideBarWidth': sideBarWidth}">
      <button
        v-if="isMobile && !appStore.setting.sideIsCollapse"
        class="sidebar-scrim"
        type="button"
        aria-label="Close navigation"
        @click="appStore.sideCollapse()"
      ></button>
      <el-aside :width="leftWidth" class="app-left" :class="{ 'is-collapsed': appStore.setting.sideIsCollapse }">
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
  import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import Tags from '@/layout/components/tags/index.vue'
  import GAside from '@/layout/components/aside.vue'
  import GHeader from '@/layout/components/header.vue'

  const appStore = useAppStore()
  const tagStore = useTagsStore()
  const sideBarWidth = computed(() => appStore.setting.locale.sideBarWidth)
  const isMobile = ref(false)
  const leftWidth = computed(() => {
    if (isMobile.value) return 'min(82vw, 280px)'
    return appStore.setting.sideIsCollapse ? 'var(--yj-sidebar-collapsed-width)' : 'var(--sideBarWidth)'
  })

  const syncViewport = () => {
    const next = window.innerWidth <= 900
    if (next && !isMobile.value) appStore.setting.sideIsCollapse = true
    isMobile.value = next
  }

  onMounted(() => {
    syncViewport()
    window.addEventListener('resize', syncViewport, { passive: true })
  })
  onBeforeUnmount(() => window.removeEventListener('resize', syncViewport))

  const route = useRoute()
  watch(() => route.fullPath, () => {
    if (isMobile.value) appStore.setting.sideIsCollapse = true
  })

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
  min-width: 0;
  width: 100%;
}

.app-main {
  background-color: var(--yj-bg);
  padding: var(--yj-spacing-xxl);
}

.sidebar-scrim {
  display: none;
}

@media (max-width: 900px) {
  .app-shell {
    min-width: 0;
  }

  .app-left {
    position: fixed;
    inset: 0 auto 0 0;
    height: 100dvh;
    transform: translateX(0);
    transition: transform var(--yj-duration-normal) var(--yj-easing-standard);
    z-index: calc(var(--yj-z-dialog) + 1);

    &.is-collapsed {
      transform: translateX(-100%);
    }
  }

  .sidebar-scrim {
    display: block;
    position: fixed;
    inset: 0;
    padding: 0;
    border: 0;
    background: rgba(5, 9, 22, .58);
    backdrop-filter: blur(3px);
    z-index: var(--yj-z-scrim);
  }

  .app-header {
    padding: 0 var(--yj-spacing-md);
  }

  .header-tags {
    padding: 0 var(--yj-spacing-md);
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .app-main {
    min-width: 0;
    padding: var(--yj-spacing-lg);
    overflow-x: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-left {
    transition: none;
  }
}
</style>
