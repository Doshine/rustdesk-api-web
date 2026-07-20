<template>
  <el-menu
          class="menus"
          :collapse="isCollapse"
          :default-active="activeIndex"
          router
  >
    <menu-item v-for="(route,index) in routes" :key="route.name" :route="route"></menu-item>
  </el-menu>
</template>

<script>
  import { defineComponent, ref, onMounted, watch, computed } from 'vue'
  import { useRouteStore } from '@/store/router'
  import MenuItem from '@/layout/components/menu/item.vue'
  import { useRoute } from 'vue-router'
  import { useAppStore } from '@/store/app'

  export default defineComponent({
    name: 'Menu',
    created () {
    },
    components: { MenuItem },
    setup () {
      const routes = ref([])
      const route = useRoute()
      const app = useAppStore()
      const isCollapse = computed(() => app.setting.sideIsCollapse)
      const activeIndex = computed(() => route.name)

      routes.value = useRouteStore().routes
      return {
        routes,
        activeIndex,
        isCollapse,
      }
    },

  })
</script>

<style lang="scss" scoped>
  .menus {
    min-height: 100vh;
    border-right: none;
    &:not(.el-menu--collapse) {
      width: var(--sideBarWidth);
    }

  }
</style>
<style lang="scss">
  /* W5 侧边栏菜单主题（深空蓝底 + accent 左竖条选中态）
     需全局选择器覆盖 EP 菜单内部结构，色值全部走 tokens */
  .menus.el-menu {
    --el-menu-bg-color: var(--yj-sidebar-bg);
    --el-menu-text-color: var(--yj-sidebar-text);
    --el-menu-active-color: var(--yj-sidebar-text-active);
    --el-menu-hover-bg-color: var(--yj-sidebar-hover-bg);
    --el-menu-item-height: 46px;
    --el-menu-sub-item-height: 40px;
    --el-menu-item-font-size: var(--yj-font-size-md);
    --el-menu-base-level-padding: var(--yj-spacing-xl);
    padding: var(--yj-spacing-sm) var(--yj-spacing-sm);
    box-sizing: border-box;

    .el-menu-item,
    .el-sub-menu__title {
      position: relative;
      margin: var(--yj-spacing-xxs) 0;
      border-radius: var(--yj-radius-md);
      transition: background-color var(--yj-duration-fast) var(--yj-easing-standard),
        color var(--yj-duration-fast) var(--yj-easing-standard);

      .el-icon {
        color: inherit;
      }
    }

    /* 分组（sub-menu）间距 */
    .el-sub-menu {
      margin-bottom: var(--yj-spacing-xs);
    }

    /* 选中态：主色底 + accent 左竖条 */
    .el-menu-item.is-active {
      background-color: var(--yj-sidebar-active-bg);
      color: var(--yj-sidebar-text-active);
      font-weight: var(--yj-font-weight-medium);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 18px;
        border-radius: var(--yj-radius-full);
        background-color: var(--yj-accent);
      }
    }

    /* 子菜单展开时的标题态 */
    .el-sub-menu.is-active > .el-sub-menu__title {
      color: var(--yj-sidebar-text-active);
    }

    /* 折叠态居中 */
    &.el-menu--collapse {
      .el-menu-item.is-active::before {
        left: 2px;
      }
    }
  }
</style>
