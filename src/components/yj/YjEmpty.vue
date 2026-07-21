<template>
  <!-- 空状态：插画位 + 18/26 标题 + 14/22 说明 + 主操作位 -->
  <div class="yj-empty">
    <div class="yj-empty__image">
      <slot name="image">
        <!-- 占位插画：深空星河空盒（正式插画资产到位后替换） -->
        <svg width="96" height="72" viewBox="0 0 96 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="14" y="18" width="68" height="44" rx="8" class="yj-empty__box"/>
          <path d="M14 30h68" class="yj-empty__line"/>
          <circle cx="24" cy="24" r="2" class="yj-empty__star"/>
          <circle cx="70" cy="10" r="1.5" class="yj-empty__star yj-empty__star--accent"/>
          <circle cx="80" cy="16" r="1" class="yj-empty__star"/>
          <path d="M38 46h20" class="yj-empty__line yj-empty__line--soft"/>
        </svg>
      </slot>
    </div>
    <p class="yj-empty__title">{{ title }}</p>
    <p v-if="description" class="yj-empty__desc">{{ description }}</p>
    <div v-if="$slots.action" class="yj-empty__action">
      <slot name="action"/>
    </div>
  </div>
</template>

<script setup>
  import { T } from '@/utils/i18n'

  defineProps({
    title: { type: String, default: () => T('NoData') },
    description: { type: String, default: () => T('NoDataTip') },
  })
</script>

<style scoped lang="scss">
.yj-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--yj-spacing-xxxl) var(--yj-spacing-xxl);
  text-align: center;

  &__image {
    margin-bottom: var(--yj-spacing-lg);
  }

  &__box {
    fill: var(--yj-surface-hover);
    stroke: var(--yj-border);
  }

  &__line {
    stroke: var(--yj-border);

    &--soft {
      stroke: var(--yj-divider);
      stroke-width: 2;
      stroke-linecap: round;
    }
  }

  &__star {
    fill: var(--yj-text-tertiary);

    &--accent {
      fill: var(--yj-accent);
    }
  }

  &__title {
    margin: 0;
    font-size: var(--yj-font-size-xl);   /* 18px */
    line-height: 26px;
    font-weight: var(--yj-font-weight-semibold);
    color: var(--yj-text-primary);
  }

  &__desc {
    margin: var(--yj-spacing-xs) 0 0;
    max-width: 320px;
    font-size: var(--yj-font-size-md);    /* 14px */
    line-height: 22px;
    color: var(--yj-text-tertiary);
  }

  &__action {
    margin-top: var(--yj-spacing-xl);
  }
}
</style>
