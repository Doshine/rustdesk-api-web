<template>
  <!-- 统一页面骨架 · 标题区 48px：左侧标题（可带描述），右侧主操作位 -->
  <div class="yj-page-header">
    <div class="yj-page-header__main">
      <h1 class="yj-page-header__title">{{ title }}</h1>
      <p v-if="description" class="yj-page-header__desc">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="yj-page-header__actions">
      <slot name="actions"/>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    title: { type: String, required: true },
    description: { type: String, default: '' },
  })
</script>

<style scoped lang="scss">
.yj-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--yj-spacing-lg);
  height: 48px;
  margin-bottom: var(--yj-spacing-lg);

  &__main {
    display: flex;
    align-items: baseline;
    gap: var(--yj-spacing-md);
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--yj-font-size-xl);
    font-weight: var(--yj-font-weight-semibold);
    letter-spacing: -0.01em;
    line-height: 28px;
    color: var(--yj-text-primary);
    white-space: nowrap;
  }

  &__desc {
    margin: 0;
    font-size: var(--yj-font-size-base);
    color: var(--yj-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-sm);
    flex: none;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
}

@media (max-width: 768px) {
  .yj-page-header__desc {
    display: none;
  }
}
</style>
