<template>
  <button type="button" class="ex-icon" :aria-label="T('NavigationToggle')" @click="expandOrFoldSlider">
    <el-icon>
      <el-icon-expand v-if="setting.sideIsCollapse"></el-icon-expand>
      <el-icon-fold v-else></el-icon-fold>
    </el-icon>
  </button>
  <div class="header-logo">
    <img :src="setting.logo" alt="" class="logo">
    <div class="title">{{setting.title}}</div>
  </div>
  <el-breadcrumb class="header-breadcrumb" separator="/">
    <el-breadcrumb-item v-for="r in crumbs" :key="r.name">{{ T(r.meta?.title) }}</el-breadcrumb-item>
  </el-breadcrumb>
  <Setting></Setting>
</template>

<script>
  import { defineComponent, computed } from 'vue'
  import HeaderMenu from '@/layout/components/menu/index.vue'
  import Setting from '@/layout/components/setting/index.vue'
  import { useAppStore } from '@/store/app'
  import GTags from '@/layout/components/tags/index.vue'
  import { useRoute } from 'vue-router'
  import { T } from '@/utils/i18n'

  export default defineComponent({
    name: 'LayerHeader',
    created () {
    },
    components: { HeaderMenu, Setting, GTags },
    watch: {},
    setup (props) {
      const appStore = useAppStore()
      const setting = computed(() => appStore.setting)
      const route = useRoute()
      const crumbs = computed(() => route.matched.filter(r => r.meta?.title))
      const expandOrFoldSlider = () => {
        appStore.sideCollapse()
      }
      return {
        setting,
        crumbs,
        T,
        expandOrFoldSlider,
      }
    },

  })
</script>

<style scoped lang="scss">
  .ex-icon {
    height: 32px;
    width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--yj-spacing-md);
    font-size: 16px;
    color: var(--yj-text-secondary);
    padding: 0;
    border: 0;
    background: transparent;
    border-radius: var(--yj-radius-md);
    cursor: pointer;
    transition: all var(--yj-duration-fast) var(--yj-easing-standard);

    &:hover {
      color: var(--yj-primary);
      background-color: var(--yj-surface-hover);
    }
  }

  .header-logo {
    display: flex;
    height: 100%;
    align-items: center;

    .title {
      display: block;
      margin-left: var(--yj-spacing-md);
      font-size: var(--yj-font-size-lg);
      font-weight: var(--yj-font-weight-semibold);
      color: var(--yj-text-primary);
      letter-spacing: 0.02em;
    }

    .logo {
      display: block;
      width: 32px;
      height: 32px;
      border-radius: var(--yj-radius-sm);
    }
  }

  .header-breadcrumb {
    margin-left: var(--yj-spacing-xxl);

    :deep(.el-breadcrumb__inner) {
      color: var(--yj-text-secondary);
      font-weight: var(--yj-font-weight-regular);
    }

    :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
      color: var(--yj-text-primary);
      font-weight: var(--yj-font-weight-medium);
    }
  }

  @media (max-width: 900px) {
    .ex-icon {
      flex: none;
      margin-right: var(--yj-spacing-sm);
    }

    .header-logo .title {
      display: none;
    }

    .header-breadcrumb {
      min-width: 0;
      margin-left: var(--yj-spacing-md);
      overflow: hidden;
      white-space: nowrap;
    }
  }

  @media (max-width: 560px) {
    .header-logo .logo {
      width: 28px;
      height: 28px;
    }

    .header-breadcrumb {
      display: none;
    }
  }
</style>
