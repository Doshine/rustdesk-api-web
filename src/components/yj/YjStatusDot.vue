<template>
  <!-- 雷达状态节点：环 + 中心点，状态由结构与语义色共同表达 -->
  <span
    class="yj-status-dot"
    :class="[`yj-status-dot--${status}`, `yj-status-dot--${size}`, { 'is-icon-only': iconOnly }]"
    role="status"
    :aria-label="label || text || status"
  >
    <span class="yj-status-dot__node" aria-hidden="true"></span>
    <span v-if="!iconOnly" class="yj-status-dot__text"><slot>{{ text }}</slot></span>
  </span>
</template>

<script setup>
  defineProps({
    // online 在线 / connecting 连接中 / offline 离线 / unknown 未知 / warning 警告 / danger 危险
    status: {
      type: String,
      default: 'offline',
      validator: (v) => ['online', 'connecting', 'offline', 'unknown', 'warning', 'danger'].includes(v),
    },
    text: { type: String, default: '' },
    label: { type: String, default: '' },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md'].includes(v),
    },
    iconOnly: { type: Boolean, default: false },
  })
</script>

<style scoped lang="scss">
.yj-status-dot {
  --yj-status-color: var(--yj-offline);

  display: inline-flex;
  align-items: center;
  gap: var(--yj-spacing-sm);
  font-size: var(--yj-font-size-base);
  line-height: var(--yj-line-height-base);
  color: var(--yj-text-primary);
  white-space: nowrap;

  &__node {
    position: relative;
    flex: none;
    width: 12px;
    height: 12px;

    &::before,
    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
    }

    &::before {
      inset: 0;
      border: 1.5px solid var(--yj-status-color);
    }

    &::after {
      left: 50%;
      top: 50%;
      width: 4px;
      height: 4px;
      transform: translate(-50%, -50%);
      background: var(--yj-status-color);
    }
  }

  &--sm &__node {
    width: 8px;
    height: 8px;

    &::before {
      border-width: 1px;
    }

    &::after {
      width: 3px;
      height: 3px;
    }
  }

  &--online {
    --yj-status-color: var(--yj-online);

    .yj-status-dot__node::before {
      animation: yj-radar-pulse var(--yj-motion-ambient) ease-in-out infinite;
    }
  }

  &--connecting {
    --yj-status-color: var(--yj-primary);

    .yj-status-dot__node::before {
      border-right-color: transparent;
      animation: yj-radar-spin var(--yj-motion-ambient) linear infinite;
    }

    .yj-status-dot__node::after {
      display: none;
    }
  }

  &--warning {
    --yj-status-color: var(--yj-warning);
  }

  &--danger {
    --yj-status-color: var(--yj-danger);
  }

  &--unknown .yj-status-dot__node::before {
    border-style: dashed;
  }

  &--offline .yj-status-dot__node::after,
  &--unknown .yj-status-dot__node::after {
    display: none;
  }

  &.is-icon-only {
    gap: 0;
  }
}

@keyframes yj-radar-pulse {
  50% {
    opacity: .52;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--yj-status-color) 12%, transparent);
  }
}

@keyframes yj-radar-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .yj-status-dot__node::before {
    animation: none !important;
  }
}
</style>
