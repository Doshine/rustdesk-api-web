<template>
  <!-- 企业控制平面统一页头：眉题 / 标题 / 说明 / 状态 / 主操作 -->
  <div class="yj-page-header">
    <div class="yj-page-header__main">
      <p v-if="eyebrow" class="yj-page-header__eyebrow">{{ eyebrow }}</p>
      <div class="yj-page-header__title-row">
        <h1 class="yj-page-header__title">{{ title }}</h1>
        <slot name="status"/>
      </div>
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
    eyebrow: { type: String, default: '' },
  })
</script>

<style scoped lang="scss">
.yj-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--yj-spacing-lg);
  min-height: 64px;
  margin-bottom: var(--yj-spacing-xl);

  &__main {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--yj-spacing-xxs);
    min-width: 0;
  }

  &__eyebrow {
    margin: 0 0 var(--yj-spacing-xxs);
    color: var(--yj-primary);
    font-family: var(--yj-font-family-mono);
    font-size: var(--yj-font-size-xs);
    font-weight: var(--yj-font-weight-semibold);
    letter-spacing: .12em;
    line-height: 16px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-md);
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: var(--yj-font-weight-semibold);
    letter-spacing: -0.025em;
    line-height: 32px;
    color: var(--yj-text-primary);
    white-space: nowrap;
  }

  &__desc {
    margin: 0;
    max-width: 720px;
    font-size: var(--yj-font-size-md);
    line-height: 22px;
    color: var(--yj-text-tertiary);
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
  .yj-page-header {
    align-items: flex-start;
    min-height: 0;
    margin-bottom: var(--yj-spacing-lg);

    &__title {
      font-size: 21px;
      line-height: 28px;
    }

    &__actions {
      align-self: flex-end;
    }
  }
}

@media (max-width: 560px) {
  .yj-page-header {
    flex-direction: column;

    &__actions {
      width: 100%;
      justify-content: flex-start;
      overflow-x: auto;
      padding-bottom: 2px;
    }
  }
}
</style>
