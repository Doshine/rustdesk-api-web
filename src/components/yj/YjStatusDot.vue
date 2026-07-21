<template>
  <!-- 状态点：语义色点 + 文字（规范 §2.3-C：状态列用文字加状态点，不用彩色标签） -->
  <span class="yj-status-dot" :class="`yj-status-dot--${status}`">
    <span class="yj-status-dot__dot"></span>
    <span class="yj-status-dot__text"><slot>{{ text }}</slot></span>
  </span>
</template>

<script setup>
  defineProps({
    // online 在线 / offline 离线 / warning 警告 / danger 危险
    status: {
      type: String,
      default: 'offline',
      validator: (v) => ['online', 'offline', 'warning', 'danger'].includes(v),
    },
    text: { type: String, default: '' },
  })
</script>

<style scoped lang="scss">
/* 语义色值取自规范 v2.1 §1.1（在线 #167C59 / 警告 #A86608 / 危险 #C53B4C），待 WS0 并入 tokens.css 后切换 */
.yj-status-dot {
  --yj-status-online: #167C59;
  --yj-status-warning: #A86608;
  --yj-status-danger: #C53B4C;

  display: inline-flex;
  align-items: center;
  gap: var(--yj-spacing-sm);
  font-size: var(--yj-font-size-base);
  line-height: var(--yj-line-height-base);
  color: var(--yj-text-primary);
  white-space: nowrap;

  &__dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: var(--yj-radius-full);
    background-color: var(--yj-offline);
    box-shadow: 0 0 0 3px var(--yj-offline-subtle);
  }

  &--online &__dot {
    background-color: var(--yj-status-online);
    box-shadow: 0 0 0 3px rgba(22, 124, 89, 0.14);
  }

  &--warning &__dot {
    background-color: var(--yj-status-warning);
    box-shadow: 0 0 0 3px rgba(168, 102, 8, 0.14);
  }

  &--danger &__dot {
    background-color: var(--yj-status-danger);
    box-shadow: 0 0 0 3px rgba(197, 59, 76, 0.14);
  }
}
</style>
