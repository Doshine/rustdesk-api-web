<template>
  <div class="dashboard">
    <!-- 统计卡片：数字 28pt/600 + 图标 accent 底衬圆角块 + hover 上浮 -->
    <div class="stat-grid">
      <el-card v-for="card in statCards" :key="card.key" shadow="never" class="stat-card">
        <div class="stat-body">
          <div class="icon-block">
            <el-icon :size="22">
              <component :is="card.icon"></component>
            </el-icon>
          </div>
          <div class="stat-meta">
            <div class="num">{{ card.value }}</div>
            <div class="label">{{ card.label }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区：统一卡片化（radius 12 + tokens 阴影 sm，来自全局页面样式） -->
    <div class="chart-grid">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="chart-title">{{ T('DashboardConnTrend') }}</div>
        </template>
        <div class="bars">
          <div v-for="d in trend" :key="d.day" class="bar-col">
            <div class="bar-num">{{ d.count || '' }}</div>
            <div class="bar-track">
              <div class="bar" :style="{ height: d.pct + '%' }"></div>
            </div>
            <div class="bar-label">{{ d.label }}</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="chart-title">{{ T('DashboardOsDist') }}</div>
        </template>
        <div class="dist">
          <div v-for="o in osDist" :key="o.name" class="dist-row">
            <span class="dist-name">{{ o.name }}</span>
            <div class="dist-track">
              <div class="dist-bar" :style="{ width: o.pct + '%' }"></div>
            </div>
            <span class="dist-num">{{ o.count }}</span>
          </div>
          <el-empty v-if="!osDist.length" :image-size="80"></el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
  import { defineComponent, ref, computed, onMounted } from 'vue'
  import { T } from '@/utils/i18n'
  import { list as peerList } from '@/api/peer'
  import { list as userList } from '@/api/user'
  import { list as auditList } from '@/api/audit'
  import { Monitor, Connection, User, Tickets } from '@element-plus/icons'

  export default defineComponent({
    name: 'Home',
    setup () {
      const stats = ref({ peers: null, online: null, users: null, conns: null })

      const statCards = computed(() => [
        { key: 'peers', icon: Monitor, label: T('DashboardTotalPeers'), value: stats.value.peers ?? '-' },
        { key: 'online', icon: Connection, label: T('DashboardOnlinePeers'), value: stats.value.online ?? '-' },
        { key: 'users', icon: User, label: T('DashboardTotalUsers'), value: stats.value.users ?? '-' },
        { key: 'conns', icon: Tickets, label: T('DashboardConnTotal'), value: stats.value.conns ?? '-' },
      ])

      // 近 7 日连接趋势（客户端聚合最近 200 条审计记录）
      const trend = ref([])
      const buildTrend = (list) => {
        const days = []
        const now = new Date()
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
          days.push({
            day: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            count: 0,
          })
        }
        const map = Object.fromEntries(days.map(d => [d.day, d]))
        ;(list || []).forEach(row => {
          const t = new Date(row.created_at)
          if (isNaN(t)) return
          const key = `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`
          if (map[key]) map[key].count++
        })
        const max = Math.max(1, ...days.map(d => d.count))
        days.forEach(d => {
          d.pct = d.count ? Math.max(6, Math.round(d.count / max * 100)) : 0
        })
        trend.value = days
      }

      // 设备系统分布
      const osDist = ref([])
      const buildOsDist = (list) => {
        const normalize = (os) => {
          const s = (os || '').toLowerCase()
          if (s.includes('win')) return 'Windows'
          if (s.includes('mac') || s.includes('darwin')) return 'macOS'
          if (s.includes('android')) return 'Android'
          if (s.includes('ios')) return 'iOS'
          if (s.includes('linux') || s.includes('ubuntu') || s.includes('debian') || s.includes('centos') || s.includes('fedora')) return 'Linux'
          return os ? (os.split(' ')[0] || os) : 'Unknown'
        }
        const counts = {}
        ;(list || []).forEach(row => {
          const k = normalize(row.os)
          counts[k] = (counts[k] || 0) + 1
        })
        const arr = Object.entries(counts).map(([name, count]) => ({ name, count }))
        arr.sort((a, b) => b.count - a.count)
        const max = Math.max(1, ...arr.map(o => o.count))
        arr.forEach(o => {
          o.pct = Math.round(o.count / max * 100)
        })
        osDist.value = arr.slice(0, 6)
      }

      const load = async () => {
        const [peers, online, users, conns, connsRecent, peersAll] = await Promise.all([
          peerList({ page: 1, page_size: 1 }).catch(_ => false),
          peerList({ page: 1, page_size: 1, time_ago: -60 }).catch(_ => false),
          userList({ page: 1, page_size: 1 }).catch(_ => false),
          auditList({ page: 1, page_size: 1 }).catch(_ => false),
          auditList({ page: 1, page_size: 200 }).catch(_ => false),
          peerList({ page: 1, page_size: 200 }).catch(_ => false),
        ])
        stats.value = {
          peers: peers ? peers.data.total : '-',
          online: online ? online.data.total : '-',
          users: users ? users.data.total : '-',
          conns: conns ? conns.data.total : '-',
        }
        buildTrend(connsRecent ? connsRecent.data.list : [])
        buildOsDist(peersAll ? peersAll.data.list : [])
      }

      onMounted(load)

      return {
        T,
        statCards,
        trend,
        osDist,
      }
    },
  })
</script>

<style scoped lang="scss">
  .dashboard {
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--yj-spacing-lg);
      margin-bottom: var(--yj-spacing-lg);

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-card {
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--yj-shadow-md);
      }

      .stat-body {
        display: flex;
        align-items: center;
        gap: var(--yj-spacing-lg);
      }

      .icon-block {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        flex: none;
        border-radius: var(--yj-radius-md);
        background-color: var(--yj-primary-subtle);
        color: var(--yj-primary);
      }

      .stat-meta {
        min-width: 0;

        .num {
          font-size: var(--yj-font-size-display);
          font-weight: var(--yj-font-weight-semibold);
          line-height: var(--yj-line-height-tight);
          color: var(--yj-text-primary);
          font-variant-numeric: tabular-nums;
        }

        .label {
          margin-top: var(--yj-spacing-xs);
          font-size: var(--yj-font-size-sm);
          color: var(--yj-text-tertiary);
        }
      }
    }

    .chart-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: var(--yj-spacing-lg);

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      .chart-title {
        font-size: var(--yj-font-size-md);
        font-weight: var(--yj-font-weight-semibold);
        color: var(--yj-text-primary);
      }
    }

    /* 柱状图（纯 CSS，无新依赖） */
    .bars {
      display: flex;
      align-items: flex-end;
      gap: var(--yj-spacing-lg);
      height: 220px;
      padding: var(--yj-spacing-sm) var(--yj-spacing-md) 0;

      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
      }

      .bar-num {
        font-size: var(--yj-font-size-xs);
        color: var(--yj-text-tertiary);
        font-variant-numeric: tabular-nums;
        min-height: 14px;
      }

      .bar-track {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .bar {
        width: 60%;
        max-width: 36px;
        min-height: 0;
        border-radius: var(--yj-radius-sm) var(--yj-radius-sm) 0 0;
        background: var(--yj-gradient);
        transition: height var(--yj-duration-slow) var(--yj-easing-standard);
      }

      .bar-col:hover .bar {
        filter: brightness(1.1);
      }

      .bar-label {
        margin-top: var(--yj-spacing-sm);
        font-size: var(--yj-font-size-xs);
        color: var(--yj-text-tertiary);
        font-variant-numeric: tabular-nums;
      }
    }

    /* 分布条 */
    .dist {
      display: flex;
      flex-direction: column;
      gap: var(--yj-spacing-lg);
      padding: var(--yj-spacing-sm) 0;

      .dist-row {
        display: flex;
        align-items: center;
        gap: var(--yj-spacing-md);
      }

      .dist-name {
        width: 72px;
        flex: none;
        font-size: var(--yj-font-size-sm);
        color: var(--yj-text-secondary);
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dist-track {
        flex: 1;
        height: 8px;
        border-radius: var(--yj-radius-full);
        background-color: var(--yj-surface-hover);
        overflow: hidden;
      }

      .dist-bar {
        height: 100%;
        border-radius: var(--yj-radius-full);
        background: var(--yj-gradient);
        transition: width var(--yj-duration-slow) var(--yj-easing-standard);
      }

      .dist-num {
        width: 36px;
        flex: none;
        font-size: var(--yj-font-size-sm);
        color: var(--yj-text-secondary);
        font-variant-numeric: tabular-nums;
      }
    }
  }
</style>
