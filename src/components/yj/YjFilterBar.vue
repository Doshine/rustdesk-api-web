<template>
  <!-- 统一页面骨架 · 筛选区：主筛选一行收拢，低频筛选进「更多筛选」抽屉 -->
  <div class="yj-filter-bar">
    <el-form inline class="yj-filter-bar__form" @submit.prevent>
      <slot/>
      <el-form-item class="yj-filter-bar__actions">
        <el-button type="primary" @click="$emit('search')">{{ T('Filter') }}</el-button>
        <el-button @click="onReset">{{ T('Reset') }}</el-button>
        <el-button v-if="hasMore" text type="primary" class="yj-filter-bar__more" @click="drawerVisible = true">
          {{ T('MoreFilters') }}
          <el-icon><ArrowDown/></el-icon>
        </el-button>
      </el-form-item>
    </el-form>

    <el-drawer v-if="hasMore" v-model="drawerVisible" :title="T('MoreFilters')" size="360px" class="yj-filter-drawer">
      <el-form label-position="top" @submit.prevent>
        <slot name="more"/>
      </el-form>
      <template #footer>
        <el-button @click="onReset">{{ T('Reset') }}</el-button>
        <el-button type="primary" @click="onDrawerSearch">{{ T('Filter') }}</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
  import { computed, ref, useSlots } from 'vue'
  import { ArrowDown } from '@element-plus/icons'
  import { T } from '@/utils/i18n'

  const emit = defineEmits(['search', 'reset'])
  const slots = useSlots()

  const hasMore = computed(() => !!slots.more)
  const drawerVisible = ref(false)

  const onReset = () => {
    emit('reset')
  }
  const onDrawerSearch = () => {
    drawerVisible.value = false
    emit('search')
  }
</script>

<style scoped lang="scss">
.yj-filter-bar {
  &__form {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    overflow-x: auto;

    :deep(.el-form-item) {
      flex: none;
      margin-right: var(--yj-spacing-lg);
      margin-bottom: var(--yj-spacing-lg);
    }

    :deep(.el-input),
    :deep(.el-select) {
      width: 160px;
    }
  }

  &__actions {
    margin-left: auto;
  }

  &__more {
    margin-left: var(--yj-spacing-sm);

    .el-icon {
      margin-left: var(--yj-spacing-xxs);
    }
  }
}

.yj-filter-drawer {
  :deep(.el-drawer__footer) {
    border-top: 1px solid var(--yj-divider);
  }
}
</style>
