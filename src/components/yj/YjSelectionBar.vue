<template>
  <Transition name="yj-selection">
    <div v-if="count > 0" class="yj-selection-bar" role="status" aria-live="polite">
      <div class="yj-selection-bar__summary">
        <span class="yj-selection-bar__count">{{ summary }}</span>
        <span v-if="detail" class="yj-selection-bar__detail">{{ detail }}</span>
      </div>
      <div class="yj-selection-bar__actions">
        <slot />
        <el-button text class="yj-selection-bar__clear" @click="$emit('clear')">
          {{ clearText }}
        </el-button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
  defineProps({
    count: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      default: '',
    },
    clearText: {
      type: String,
      required: true,
    },
  })

  defineEmits(['clear'])
</script>

<style scoped lang="scss">
.yj-selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--yj-spacing-lg);
  min-height: 52px;
  padding: var(--yj-spacing-sm) var(--yj-spacing-lg) var(--yj-spacing-sm) var(--yj-spacing-xl);
  border-bottom: 1px solid var(--yj-border-strong);
  background: color-mix(in srgb, var(--yj-primary-subtle) 70%, var(--yj-surface));

  &__summary,
  &__actions {
    display: flex;
    align-items: center;
  }

  &__summary {
    flex: none;
    gap: var(--yj-spacing-md);
  }

  &__actions {
    justify-content: flex-end;
    gap: var(--yj-spacing-sm);
  }

  &__count {
    color: var(--yj-text-primary);
    font-size: var(--yj-font-size-base);
    font-weight: var(--yj-font-weight-semibold);
    font-variant-numeric: tabular-nums;
  }

  &__detail {
    padding-left: var(--yj-spacing-md);
    border-left: 1px solid var(--yj-border-strong);
    color: var(--yj-text-secondary);
    font-size: var(--yj-font-size-sm);
  }

  &__clear {
    color: var(--yj-text-secondary);
  }
}

.yj-selection-enter-active,
.yj-selection-leave-active {
  transition: opacity var(--yj-duration-fast) var(--yj-easing-standard),
    transform var(--yj-duration-fast) var(--yj-easing-standard);
}

.yj-selection-enter-from,
.yj-selection-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .yj-selection-bar {
    align-items: flex-start;
    flex-direction: column;
    padding: var(--yj-spacing-md) var(--yj-spacing-lg);

    &__actions {
      justify-content: flex-start;
      width: 100%;
      overflow-x: auto;
      padding-bottom: var(--yj-spacing-xs);

      :deep(.el-button) {
        flex: none;
        min-height: 40px;
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .yj-selection-enter-active,
  .yj-selection-leave-active {
    transition: none;
  }
}
</style>
