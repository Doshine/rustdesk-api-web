<template>
  <div class="dashboard control-page">
    <YjPageHeader
      eyebrow="CONTROL PLANE"
      :title="T('DashboardTitle')"
      :description="T('DashboardDescription')"
    >
      <template #status>
        <YjStatusDot :status="dashboardState" :text="dashboardStateText"/>
      </template>
      <template #actions>
        <span v-if="lastUpdatedText" class="dashboard-updated">{{ lastUpdatedText }}</span>
        <el-button :icon="Refresh" :loading="dashboardRefreshing" @click="refreshAll">
          {{ T('DashboardRefresh') }}
        </el-button>
      </template>
    </YjPageHeader>

    <section class="session-launcher">
      <div class="session-launcher__copy">
        <span>SESSION ROUTER</span>
        <strong>{{ T('SessionLauncherTitle') }}</strong>
        <small>{{ T('SessionLauncherDescription') }}</small>
      </div>
      <div class="session-launcher__actions">
        <button type="button" @click="openAssistance('temporary')">
          <span>01</span>
          <span>
            <strong>{{ T('TemporaryAssistance') }}</strong>
            <small>{{ T('TemporaryAssistanceDescription') }}</small>
          </span>
          <el-icon><Right /></el-icon>
        </button>
        <button type="button" @click="openAssistance('fixed')">
          <span>02</span>
          <span>
            <strong>{{ T('FixedDeviceAccess') }}</strong>
            <small>{{ T('FixedDeviceAccessDescription') }}</small>
          </span>
          <el-icon><Right /></el-icon>
        </button>
      </div>
    </section>

    <!-- 首行统计：2+2 非等宽栅格（在线设备/活跃会话为主指标，用户数/告警为次指标） -->
    <div class="stat-grid">
      <ModuleError
        v-if="statsMod.status === 'error'"
        :last-updated="statsMod.lastUpdated"
        style="grid-column: 1 / -1"
        @retry="loadStats"
      />
      <template v-else>
        <el-card
          v-for="card in statCards"
          :key="card.key"
          shadow="never"
          class="stat-card"
          :class="[card.tier, `stat-card--${card.key}`]"
          :title="card.hint || ''"
        >
          <!-- 骨架屏：结构与最终一致（图标块 + 大数 + 标签） -->
          <div v-if="statsMod.status === 'loading'" class="stat-skel" aria-hidden="true">
            <div class="db-skel-block skel-icon" :class="card.tier"></div>
            <div class="skel-lines">
              <div class="db-skel-block skel-num" :class="card.tier"></div>
              <div class="db-skel-block skel-label"></div>
            </div>
          </div>
          <div v-else class="stat-body">
            <div class="icon-block" :class="card.tier">
              <el-icon :size="card.tier === 'primary' ? 24 : 20">
                <component :is="card.icon"></component>
              </el-icon>
            </div>
            <div class="stat-meta">
              <div class="num">{{ card.value }}</div>
              <div class="label">{{ card.label }}</div>
              <div v-if="card.caption" class="caption">{{ card.caption }}</div>
            </div>
          </div>
        </el-card>
      </template>
    </div>

    <!-- 趋势图 + 节点健康（同高 280px 内容区） -->
    <div class="chart-grid">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">{{ T('DashboardConnTrend') }}</div>
        </template>
        <div ref="chartWrap" class="panel-body">
          <div v-if="trendMod.status === 'loading'" class="chart-skel" aria-hidden="true">
            <div class="chart-skel-bars">
              <div
                v-for="(h, i) in [38, 62, 48, 78, 55, 70, 44]"
                :key="i"
                class="db-skel-block chart-skel-bar"
                :style="{ height: h + '%' }"
              ></div>
            </div>
            <div class="db-skel-block chart-skel-axis"></div>
          </div>
          <ModuleError
            v-else-if="trendMod.status === 'error'"
            :last-updated="trendMod.lastUpdated"
            @retry="loadTrend"
          />
          <svg
            v-else
            class="chart-anim"
            :width="chart.w"
            :height="chart.h"
            :viewBox="`0 0 ${chart.w} ${chart.h}`"
            role="img"
            :aria-label="T('DashboardConnTrend')"
          >
            <!-- 网格线：divider 色，不显示纵向粗轴线（§5.2） -->
            <line
              v-for="t in chart.ticks"
              :key="'g' + t.v"
              class="grid-line"
              :x1="PAD.l"
              :x2="chart.w - PAD.r"
              :y1="t.y"
              :y2="t.y"
            />
            <!-- Y 轴刻度：次级文字 -->
            <text
              v-for="t in chart.ticks"
              :key="'y' + t.v"
              class="axis-text"
              :x="PAD.l - 8"
              :y="t.y + 3"
              text-anchor="end"
            >{{ t.v }}</text>
            <!-- 面积填充 ≤12% -->
            <path v-if="chart.area" :d="chart.area" class="series-area" />
            <path v-if="chart.line" :d="chart.line" class="series-line" />
            <g v-for="p in chart.pts" :key="p.day">
              <circle class="series-point" :cx="p.x" :cy="p.y" r="3">
                <title>{{ p.label }} · {{ p.count }}</title>
              </circle>
            </g>
            <!-- X 轴刻度：次级文字 -->
            <text
              v-for="p in chart.pts"
              :key="'x' + p.day"
              class="axis-text"
              :x="p.x"
              :y="chart.h - 8"
              text-anchor="middle"
            >{{ p.label }}</text>
          </svg>
        </div>
      </el-card>

      <!-- 节点健康列表卡：与趋势图同高，五节点延迟/负载/雷达状态点；无 API 的字段空态展示，不伪造 -->
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">{{ T('DashboardNodeHealth') }}</div>
        </template>
        <div class="panel-body">
          <div v-if="nodesMod.status === 'loading'" class="node-skel" aria-hidden="true">
            <div v-for="i in 5" :key="i" class="node-skel-row">
              <div class="db-skel-block skel-dot"></div>
              <div class="skel-lines">
                <div class="db-skel-block skel-name"></div>
                <div class="db-skel-block skel-host"></div>
              </div>
              <div class="db-skel-block skel-metric"></div>
              <div class="db-skel-block skel-metric"></div>
            </div>
          </div>
          <ModuleError
            v-else-if="nodesMod.status === 'error'"
            :last-updated="nodesMod.lastUpdated"
            @retry="loadNodes"
          />
          <div v-else class="node-list chart-anim">
            <div class="node-head">
              <span class="node-col-main"></span>
              <span class="node-col-metric">{{ T('DashboardLatency') }}</span>
              <span class="node-col-metric">{{ T('DashboardLoad') }}</span>
            </div>
            <div v-for="n in nodes" :key="n.key" class="node-row" :class="{ 'is-empty': n.state === 'empty' }">
              <YjStatusDot
                :status="nodeStatus(n.state)"
                :label="n.name"
                icon-only
              />
              <span class="node-col-main">
                <span class="node-name">{{ n.name }}</span>
                <span class="node-host">{{ n.host || T('DashboardUnconfigured') }}</span>
              </span>
              <span class="node-col-metric node-metric">{{ n.latency }}</span>
              <span class="node-col-metric node-metric">{{ n.load }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 设备系统分布 -->
    <el-card shadow="never" class="panel-card dist-card">
      <template #header>
        <div class="panel-title">{{ T('DashboardOsDist') }}</div>
      </template>
      <div v-if="distMod.status === 'loading'" class="dist-skel" aria-hidden="true">
        <div v-for="i in 5" :key="i" class="dist-skel-row">
          <div class="db-skel-block skel-os"></div>
          <div class="db-skel-block skel-track"></div>
          <div class="db-skel-block skel-count"></div>
        </div>
      </div>
      <ModuleError
        v-else-if="distMod.status === 'error'"
        :last-updated="distMod.lastUpdated"
        @retry="loadOsDist"
      />
      <div v-else class="dist">
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
</template>

<script>
  import { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'
  import { T } from '@/utils/i18n'
  import { list as peerList } from '@/api/peer'
  import { list as userList } from '@/api/user'
  import { list as auditList } from '@/api/audit'
  import { server } from '@/api/config'
  import { Connection, Link, User, Bell, Refresh, Right } from '@element-plus/icons-vue'
  import ModuleError from '@/views/index/components/ModuleError.vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'

  // 图表内边距（常量，模板网格线也要用）
  const PAD = { l: 34, r: 10, t: 14, b: 26 }
  const CHART_H = 280

  const niceStep = (v) => {
    const pow = Math.pow(10, Math.floor(Math.log10(v)))
    for (const m of [1, 2, 5, 10]) {
      if (m * pow >= v) return m * pow
    }
    return 10 * pow
  }

  export default defineComponent({
    name: 'Home',
    components: { ModuleError, YjPageHeader, YjStatusDot },
    setup () {
      const router = useRouter()
      const openAssistance = (mode) => router.push({ name: 'MyAssist', query: { mode } })
      /* ================= 模块状态（骨架 / 就绪 / 错误，互不阻塞） ================= */
      const mkMod = () => reactive({ status: 'loading', lastUpdated: null })
      const statsMod = mkMod()
      const trendMod = mkMod()
      const nodesMod = mkMod()
      const distMod = mkMod()

      const dashboardRefreshing = computed(() =>
        [statsMod, trendMod, nodesMod, distMod].some(mod => mod.status === 'loading'))
      const dashboardState = computed(() => {
        const states = [statsMod, trendMod, nodesMod, distMod].map(mod => mod.status)
        if (states.includes('error')) return 'warning'
        if (states.includes('loading')) return 'connecting'
        return 'online'
      })
      const dashboardStateText = computed(() => {
        if (dashboardState.value === 'warning') return T('DashboardLoadFailed')
        if (dashboardState.value === 'connecting') return T('DashboardLoading')
        return T('Online')
      })
      const lastUpdatedText = computed(() => {
        const times = [statsMod, trendMod, nodesMod, distMod]
          .map(mod => mod.lastUpdated)
          .filter(Boolean)
        if (!times.length) return ''
        const time = new Date(Math.max(...times)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return T('DashboardLastUpdated', { time })
      })

      /* ================= 首行统计 ================= */
      const stats = reactive({
        online: '—', peersTotal: '—', active: '—', connsTotal: '—', users: '—',
      })

      const statCards = computed(() => [
        {
          key: 'online', tier: 'primary', icon: Connection,
          label: T('DashboardOnlinePeers'), value: stats.online,
          caption: T('DashboardPeersTotalCaption', { n: stats.peersTotal }),
        },
        {
          key: 'active', tier: 'primary', icon: Link,
          label: T('DashboardActiveSessions'), value: stats.active,
          caption: T('DashboardConnsTotalCaption', { n: stats.connsTotal }),
          hint: T('DashboardActiveHint'),
        },
        {
          key: 'users', tier: 'secondary', icon: User,
          label: T('DashboardTotalUsers'), value: stats.users,
        },
        {
          // 告警暂无数据源：空态展示，不伪造计数
          key: 'alerts', tier: 'secondary', icon: Bell,
          label: T('DashboardAlerts'), value: '—',
          caption: T('DashboardAlertsEmpty'),
        },
      ])

      const loadStats = async () => {
        statsMod.status = 'loading'
        const [online, peers, users, conns] = await Promise.all([
          peerList({ page: 1, page_size: 1, time_ago: -60 }).catch(_ => false),
          peerList({ page: 1, page_size: 1 }).catch(_ => false),
          userList({ page: 1, page_size: 1 }).catch(_ => false),
          auditList({ page: 1, page_size: 200 }).catch(_ => false),
        ])
        if (!online && !peers && !users && !conns) {
          statsMod.status = 'error'
          return
        }
        stats.online = online ? online.data.total : '—'
        stats.peersTotal = peers ? peers.data.total : '—'
        stats.users = users ? users.data.total : '—'
        stats.connsTotal = conns ? conns.data.total : '—'
        // 活跃会话：最近连接记录中 close_time 为空（未关闭）的会话数
        stats.active = conns
          ? (conns.data.list || []).filter(r => !r.close_time).length
          : '—'
        statsMod.status = 'ready'
        statsMod.lastUpdated = Date.now()
      }

      /* ================= 近 7 日连接趋势 ================= */
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
        trend.value = days
      }

      const loadTrend = async () => {
        trendMod.status = 'loading'
        const res = await auditList({ page: 1, page_size: 200 }).catch(_ => false)
        if (!res) {
          trendMod.status = 'error'
          return
        }
        buildTrend(res.data.list)
        trendMod.status = 'ready'
        trendMod.lastUpdated = Date.now()
      }

      // 趋势图几何：高度 280px，宽度跟随容器
      const chartWrap = ref(null)
      const chartW = ref(640)
      let resizeObs = null

      const chart = computed(() => {
        const w = chartW.value
        const h = CHART_H
        const days = trend.value
        const n = days.length || 1
        const max = Math.max(1, ...days.map(d => d.count))
        const step = niceStep(Math.max(1, Math.ceil(max / 4)))
        const yMax = step * 4
        const iw = w - PAD.l - PAD.r
        const ih = h - PAD.t - PAD.b
        const px = i => PAD.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1))
        const py = v => PAD.t + (1 - v / yMax) * ih
        const pts = days.map((d, i) => ({ ...d, x: px(i), y: py(d.count) }))
        const base = PAD.t + ih
        const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
        const area = pts.length
          ? `${line} L${pts[pts.length - 1].x.toFixed(1)},${base.toFixed(1)} L${pts[0].x.toFixed(1)},${base.toFixed(1)} Z`
          : ''
        const ticks = [0, 1, 2, 3, 4].map(k => ({ v: k * step, y: py(k * step) }))
        return { w, h, pts, line, area, ticks }
      })

      /* ================= 节点健康 ================= */
      const nodes = ref([])
      const nodeStatus = (state) => {
        if (state === 'online') return 'online'
        if (state === 'unknown') return 'unknown'
        return 'offline'
      }

      const loadNodes = async () => {
        nodesMod.status = 'loading'
        // API 节点延迟：实测本次请求 RTT（真实数据）；ID/中继节点无探测 API，字段空态
        const t0 = performance.now()
        const res = await server().catch(_ => false)
        const rtt = Math.max(1, Math.round(performance.now() - t0))
        if (!res) {
          nodesMod.status = 'error'
          return
        }
        const cfg = res.data || {}
        nodes.value = [
          {
            key: 'api', name: T('DashboardNodeApi'),
            host: cfg.api_server || window.location.origin,
            latency: `${rtt} ms`, load: '—', state: 'online',
          },
          {
            key: 'id', name: T('DashboardNodeId'),
            host: cfg.id_server || '',
            latency: '—', load: '—', state: cfg.id_server ? 'unknown' : 'empty',
          },
          {
            key: 'relay', name: T('DashboardNodeRelay'),
            host: cfg.relay_server || '',
            latency: '—', load: '—', state: cfg.relay_server ? 'unknown' : 'empty',
          },
          { key: 'standby-1', name: `${T('DashboardNodeStandby')} 1`, host: '', latency: '—', load: '—', state: 'empty' },
          { key: 'standby-2', name: `${T('DashboardNodeStandby')} 2`, host: '', latency: '—', load: '—', state: 'empty' },
        ]
        nodesMod.status = 'ready'
        nodesMod.lastUpdated = Date.now()
      }

      /* ================= 设备系统分布 ================= */
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

      const loadOsDist = async () => {
        distMod.status = 'loading'
        const res = await peerList({ page: 1, page_size: 200 }).catch(_ => false)
        if (!res) {
          distMod.status = 'error'
          return
        }
        buildOsDist(res.data.list)
        distMod.status = 'ready'
        distMod.lastUpdated = Date.now()
      }

      const refreshAll = () => Promise.all([
        loadStats(),
        loadTrend(),
        loadNodes(),
        loadOsDist(),
      ])

      onMounted(() => {
        // 各模块独立加载，单模块失败不阻塞其他模块
        loadStats()
        loadTrend()
        loadNodes()
        loadOsDist()
        if (window.ResizeObserver && chartWrap.value) {
          resizeObs = new ResizeObserver(entries => {
            const w = Math.floor(entries[0].contentRect.width)
            if (w > 0) chartW.value = Math.max(280, w)
          })
          resizeObs.observe(chartWrap.value)
        }
      })

      onBeforeUnmount(() => {
        if (resizeObs) resizeObs.disconnect()
      })

      return {
        T,
        PAD,
        statCards,
        statsMod,
        trendMod,
        nodesMod,
        distMod,
        chart,
        chartWrap,
        nodes,
        nodeStatus,
        osDist,
        dashboardRefreshing,
        dashboardState,
        dashboardStateText,
        lastUpdatedText,
        refreshAll,
        openAssistance,
        Refresh,
        Right,
        loadStats,
        loadTrend,
        loadNodes,
        loadOsDist,
      }
    },
  })
</script>

<style scoped lang="scss">
  .dashboard {
    .session-launcher {
      display: grid;
      grid-template-columns: minmax(220px, .72fr) minmax(0, 1.28fr);
      overflow: hidden;
      margin-bottom: var(--yj-spacing-xl);
      border: 1px solid var(--yj-border);
      border-radius: var(--yj-radius-lg);
      background: var(--yj-deep-navy);
      color: var(--yj-text-inverse);
    }

    .session-launcher__copy {
      display: grid;
      align-content: center;
      gap: var(--yj-spacing-xs);
      padding: var(--yj-spacing-xl) var(--yj-spacing-xxl);
      border-right: 1px solid rgba(255, 255, 255, .12);

      > span {
        color: var(--yj-accent);
        font-family: var(--yj-font-family-mono);
        font-size: var(--yj-font-size-xs);
        font-weight: var(--yj-font-weight-semibold);
        letter-spacing: var(--yj-letter-spacing-section-label);
      }

      > strong {
        font-size: var(--yj-font-size-title-m);
      }

      > small {
        color: rgba(255, 255, 255, .64);
        font-size: var(--yj-font-size-sm);
        line-height: var(--yj-line-height-base);
      }
    }

    .session-launcher__actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));

      button {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--yj-spacing-md);
        min-height: 112px;
        padding: var(--yj-spacing-xl);
        border: 0;
        border-right: 1px solid rgba(255, 255, 255, .1);
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: background-color var(--yj-duration-fast) var(--yj-easing-standard);

        &:last-child {
          border-right: 0;
        }

        &:hover,
        &:focus-visible {
          background: rgba(255, 255, 255, .07);
        }

        &:focus-visible {
          outline: 2px solid var(--yj-accent);
          outline-offset: -2px;
        }

        > span:first-child {
          align-self: start;
          color: var(--yj-accent);
          font-family: var(--yj-font-family-mono);
          font-size: var(--yj-font-size-xs);
        }

        > span:nth-child(2) {
          display: grid;
          gap: var(--yj-spacing-xs);
        }

        strong {
          font-size: var(--yj-font-size-base);
        }

        small {
          color: rgba(255, 255, 255, .62);
          font-size: var(--yj-font-size-sm);
          line-height: var(--yj-line-height-base);
        }

        .el-icon {
          color: var(--yj-accent);
        }
      }
    }

    .dashboard-updated {
      color: var(--yj-text-tertiary);
      font-family: var(--yj-font-family-mono);
      font-size: var(--yj-font-size-xs);
      white-space: nowrap;
    }

    /* ---------- 首行统计：2+2 非等宽栅格 ---------- */
    .stat-grid {
      display: grid;
      grid-template-columns: 1.7fr 1.7fr 1fr 1fr;
      gap: var(--yj-spacing-lg);
      margin-bottom: var(--yj-spacing-lg);

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      position: relative;
      overflow: hidden;
      transition: border-color var(--yj-duration-fast) var(--yj-easing-standard),
        background-color var(--yj-duration-fast) var(--yj-easing-standard);

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        height: 2px;
        background: var(--yj-divider);
      }

      &.primary::after {
        background: linear-gradient(90deg, var(--yj-primary), var(--yj-accent), transparent 82%);
      }

      &:hover {
        border-color: var(--yj-border-strong);
        background-color: color-mix(in srgb, var(--yj-surface-hover) 38%, var(--yj-surface));
      }

      .stat-body {
        display: flex;
        align-items: center;
        justify-content: space-between;
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
        order: 2;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);

        &.secondary {
          width: 40px;
          height: 40px;
        }
      }

      .stat-meta {
        order: 1;
        min-width: 0;

        .num {
          font-size: var(--yj-font-size-xxl);
          font-weight: var(--yj-font-weight-semibold);
          line-height: 28px;
          color: var(--yj-text-primary);
          font-variant-numeric: tabular-nums;
        }

        .label {
          margin-top: var(--yj-spacing-xs);
          font-size: var(--yj-font-size-sm);
          color: var(--yj-text-tertiary);
        }

        .caption {
          margin-top: var(--yj-spacing-xxs);
          font-size: var(--yj-font-size-xs);
          color: var(--yj-text-tertiary);
          font-variant-numeric: tabular-nums;
        }
      }

      /* 主指标大数 28/36 */
      &.primary .stat-meta .num {
        font-size: var(--yj-font-size-display);
        line-height: 36px;
      }
    }

    /* ---------- 面板卡（趋势图 / 节点健康同高 280px 内容区） ---------- */
    .chart-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: var(--yj-spacing-lg);
      margin-bottom: var(--yj-spacing-lg);

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    .panel-card {
      .panel-title {
        font-size: var(--yj-font-size-md);
        font-weight: var(--yj-font-weight-semibold);
        color: var(--yj-text-primary);
      }

      .panel-body {
        height: 280px;
      }
    }

    /* ---------- 趋势图（SVG，无新依赖） ---------- */
    .grid-line {
      stroke: var(--yj-divider);
      stroke-opacity: 0.6;
      stroke-width: 1;
    }

    .axis-text {
      fill: var(--yj-text-tertiary);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }

    .series-area {
      fill: var(--yj-primary);
      fill-opacity: 0.1;
    }

    .series-line {
      fill: none;
      stroke: var(--yj-primary);
      stroke-width: 2;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    .series-point {
      fill: var(--yj-surface);
      stroke: var(--yj-accent);
      stroke-width: 2;
    }

    .chart-anim {
      animation: db-fade-up var(--yj-duration-slow) var(--yj-easing-standard) both;
    }

    @keyframes db-fade-up {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
    }

    /* ---------- 节点健康列表 ---------- */
    .node-list {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .node-head {
      display: flex;
      align-items: center;
      gap: var(--yj-spacing-md);
      padding: 0 var(--yj-spacing-xs) var(--yj-spacing-sm);
      font-size: var(--yj-font-size-xs);
      color: var(--yj-text-tertiary);
      border-bottom: 1px solid var(--yj-divider);
    }

    .node-row {
      display: flex;
      align-items: center;
      gap: var(--yj-spacing-md);
      flex: 1;
      min-height: 44px;
      padding: 0 var(--yj-spacing-xs);
      border-bottom: 1px solid var(--yj-divider);

      &:last-child {
        border-bottom: none;
      }

      &.is-empty {

        .node-name,
        .node-host,
        .node-metric {
          color: var(--yj-text-tertiary);
        }
      }
    }

    .node-col-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .node-name {
      font-size: var(--yj-font-size-base);
      font-weight: var(--yj-font-weight-medium);
      color: var(--yj-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-host {
      font-size: var(--yj-font-size-xs);
      color: var(--yj-text-tertiary);
      font-family: var(--yj-font-family-mono);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-col-metric {
      width: 64px;
      flex: none;
      text-align: right;
    }

    .node-metric {
      font-size: var(--yj-font-size-sm);
      color: var(--yj-text-secondary);
      font-variant-numeric: tabular-nums;
    }

    /* ---------- 设备系统分布 ---------- */
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

    /* ---------- 骨架屏（结构与最终一致，自包含，不依赖全局组件） ---------- */
    .db-skel-block {
      border-radius: var(--yj-radius-sm);
      background: linear-gradient(90deg,
          var(--yj-surface-hover) 25%,
          var(--yj-divider) 50%,
          var(--yj-surface-hover) 75%);
      background-size: 200% 100%;
      animation: db-skel-shimmer 1.5s linear infinite;
    }

    @keyframes db-skel-shimmer {
      from {
        background-position: 200% 0;
      }

      to {
        background-position: -200% 0;
      }
    }

    .stat-skel {
      display: flex;
      align-items: center;
      gap: var(--yj-spacing-lg);

      .skel-icon {
        width: 48px;
        height: 48px;
        flex: none;
        border-radius: var(--yj-radius-md);

        &.secondary {
          width: 40px;
          height: 40px;
        }
      }

      .skel-lines {
        display: flex;
        flex-direction: column;
        gap: var(--yj-spacing-sm);
      }

      .skel-num {
        width: 72px;
        height: 28px;

        &.primary {
          width: 96px;
          height: 36px;
        }
      }

      .skel-label {
        width: 56px;
        height: 12px;
      }
    }

    .chart-skel {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 14px 10px 0 34px;

      .chart-skel-bars {
        flex: 1;
        display: flex;
        align-items: flex-end;
        gap: var(--yj-spacing-lg);
      }

      .chart-skel-bar {
        flex: 1;
        max-width: 36px;
        border-radius: var(--yj-radius-sm) var(--yj-radius-sm) 0 0;
      }

      .chart-skel-axis {
        height: 11px;
        margin: var(--yj-spacing-sm) 0 8px;
      }
    }

    .node-skel {
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
      padding: var(--yj-spacing-xs) 0;

      .node-skel-row {
        display: flex;
        align-items: center;
        gap: var(--yj-spacing-md);
        min-height: 44px;
      }

      .skel-dot {
        width: 12px;
        height: 12px;
        flex: none;
        border-radius: 50%;
      }

      .skel-lines {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--yj-spacing-xs);
      }

      .skel-name {
        width: 40%;
        height: 13px;
      }

      .skel-host {
        width: 62%;
        height: 11px;
      }

      .skel-metric {
        width: 48px;
        height: 12px;
        flex: none;
      }
    }

    .dist-skel {
      display: flex;
      flex-direction: column;
      gap: var(--yj-spacing-lg);
      padding: var(--yj-spacing-sm) 0;

      .dist-skel-row {
        display: flex;
        align-items: center;
        gap: var(--yj-spacing-md);
      }

      .skel-os {
        width: 72px;
        height: 12px;
        flex: none;
      }

      .skel-track {
        flex: 1;
        height: 8px;
        border-radius: var(--yj-radius-full);
      }

      .skel-count {
        width: 36px;
        height: 12px;
        flex: none;
      }
    }

    /* ---------- reduced-motion 降级 ---------- */
    @media (prefers-reduced-motion: reduce) {
      .stat-card,
      .dist-bar {
        transition: none;
      }

      .db-skel-block,
      .chart-anim,
      :deep(.yj-status-dot__node::before) {
        animation: none;
      }
    }

    @media (max-width: 560px) {
      .dashboard-updated {
        display: none;
      }

      .session-launcher,
      .session-launcher__actions {
        grid-template-columns: 1fr;
      }

      .session-launcher__copy {
        border-right: 0;
        border-bottom: 1px solid rgba(255, 255, 255, .12);
      }

      .session-launcher__actions button {
        min-height: 88px;
        border-right: 0;
        border-bottom: 1px solid rgba(255, 255, 255, .1);

        &:last-child {
          border-bottom: 0;
        }
      }
    }
  }
</style>
