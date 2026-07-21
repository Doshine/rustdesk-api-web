<template>
  <!-- 模块级错误卡：3px severity 左边条（规范 §2.3-B / §3.11），重试入口 + 最近成功更新时间 -->
  <div class="module-error" role="alert">
    <div class="me-text">
      <div class="me-title">{{ T('DashboardLoadFailed') }}</div>
      <div class="me-updated">{{ updatedText }}</div>
    </div>
    <el-button size="small" :icon="RefreshRight" :loading="loading" @click="$emit('retry')">
      {{ T('DashboardRetry') }}
    </el-button>
  </div>
</template>

<script>
  import { defineComponent, computed } from 'vue'
  import { T } from '@/utils/i18n'
  import { RefreshRight } from '@element-plus/icons'

  export default defineComponent({
    name: 'DashboardModuleError',
    emits: ['retry'],
    props: {
      lastUpdated: { type: Number, default: null },
      loading: { type: Boolean, default: false },
    },
    setup (props) {
      const fmtClock = (ts) => {
        const d = new Date(ts)
        const p = n => String(n).padStart(2, '0')
        return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
      }
      const updatedText = computed(() =>
        props.lastUpdated ? T('DashboardLastUpdated', { time: fmtClock(props.lastUpdated) }) : '—'
      )
      return { T, RefreshRight, updatedText }
    },
  })
</script>

<style scoped lang="scss">
  .module-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--yj-spacing-lg);
    width: 100%;
    height: 100%;
    min-height: 72px;
    padding: var(--yj-spacing-lg) var(--yj-spacing-xl);
    background-color: var(--yj-surface);
    border: 1px solid var(--yj-border);
    border-left: 3px solid var(--yj-danger);
    border-radius: var(--yj-radius-lg);
  }

  .me-text {
    min-width: 0;
  }

  .me-title {
    font-size: var(--yj-font-size-md);
    font-weight: var(--yj-font-weight-medium);
    color: var(--yj-text-primary);
  }

  .me-updated {
    margin-top: var(--yj-spacing-xs);
    font-size: var(--yj-font-size-sm);
    color: var(--yj-text-tertiary);
    font-variant-numeric: tabular-nums;
  }
</style>
