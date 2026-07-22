<template>
  <div class="yj-settings-panel relay-nodes">
    <!-- 标题区：标题 + 一句话操作路径 -->
    <header class="yj-settings-panel__header">
      <h2 class="yj-settings-panel__title">{{ T('RelayNodes') }} <span class="yj-settings-panel__code">RELAY_NODES</span></h2>
      <p class="yj-settings-panel__desc">{{ T('RelayNodesTip') }}</p>
    </header>

    <!-- 当前生效配置：紧凑摘要行（状态点 + 服务器侧节点数 + 同步状态 + 查看/导入/重读） -->
    <div class="yj-settings-group relay-nodes__summary" v-loading="serverCfg.loading">
      <div class="relay-nodes__summary-row">
        <YjStatusDot :status="!serverLoaded ? 'offline' : mismatch ? 'warning' : 'online'"/>
        <span class="relay-nodes__summary-text">{{ T('ServerSideNodes', { n: serverHosts.length }) }}</span>
        <template v-if="serverLoaded">
          <span class="relay-nodes__summary-status" :class="mismatch ? 'is-pending' : 'is-synced'">
            {{ mismatch ? T('PendingSync') : T('InSync') }}
          </span>
        </template>
        <el-button text size="small" :disabled="!serverHosts.length" @click="expandCfg = !expandCfg">
          {{ expandCfg ? T('Collapse') : T('View') }}
        </el-button>
        <div class="relay-nodes__summary-actions">
          <el-button size="small" :disabled="!serverHosts.length" @click="openImport">{{ T('ImportFromServer') }}</el-button>
          <el-tooltip :content="T('CopyAuditTip')" placement="top">
            <el-button size="small" text :icon="CopyIcon" :disabled="!serverCfg.raw" @click="copyConfig"></el-button>
          </el-tooltip>
          <el-tooltip :content="T('ReRead')" placement="top">
            <el-button size="small" text :icon="RefreshIcon" :loading="serverCfg.loading" @click="getServerConfig"></el-button>
          </el-tooltip>
        </div>
      </div>
      <div v-show="expandCfg" class="relay-nodes__chips">
        <el-tag v-for="h in serverHosts" :key="h" size="small" disable-transitions class="yj-mono">{{ h }}</el-tag>
      </div>
    </div>

    <!-- 工具行：筛选 + 全部操作（应用到服务器为唯一主操作，带差异 badge） -->
    <div class="relay-nodes__toolbar">
      <template v-if="!isEmpty">
        <el-input v-model="listQuery.name" class="relay-nodes__search" :placeholder="T('Name')" clearable
                  @keyup.enter="handlerQuery" @clear="handlerQuery"></el-input>
        <el-button @click="handlerQuery">{{ T('Filter') }}</el-button>
      </template>
      <div class="relay-nodes__toolbar-right">
        <el-button :loading="testingAll" :disabled="!listRes.list.length" @click="testAll">{{ T('TestAll') }}</el-button>
        <el-button :disabled="!serverHosts.length" @click="openImport">{{ T('ImportFromServer') }}</el-button>
        <el-button type="primary" @click="toAdd">{{ T('AddNode') }}</el-button>
        <el-badge :is-dot="mismatch" class="relay-nodes__apply-badge">
          <el-button :type="mismatch ? 'primary' : 'default'" :loading="applying"
                     :disabled="!enabledNodes.length" @click="applyToServer()">
            {{ T('ApplyToServer') }}
          </el-button>
        </el-badge>
      </div>
    </div>

    <!-- 空态：插画 + 一句 + 主操作 -->
    <YjEmpty v-if="isEmpty" :description="T('RelayNodesTip')">
      <template #action>
        <el-button type="primary" @click="toAdd">{{ T('AddFirstNode') }}</el-button>
      </template>
    </YjEmpty>

    <template v-else>
      <!-- 初次加载行骨架 -->
      <el-skeleton v-if="!inited && listRes.loading" class="relay-nodes__skeleton" :rows="6" animated/>

      <el-table v-else :data="listRes.list" v-loading="listRes.loading" border size="small">
        <el-table-column prop="name" :label="T('Name')" min-width="120" show-overflow-tooltip></el-table-column>
        <el-table-column label="host:port" min-width="170" show-overflow-tooltip class-name="yj-mono">
          <template #default="{row}">{{ row.host }}:{{ row.port }}</template>
        </el-table-column>
        <el-table-column prop="region" :label="T('Region')" width="90" show-overflow-tooltip>
          <template #default="{row}">{{ row.region || '—' }}</template>
        </el-table-column>
        <el-table-column prop="isp" :label="T('ISP')" width="100" show-overflow-tooltip>
          <template #default="{row}">{{ row.isp || '—' }}</template>
        </el-table-column>
        <el-table-column prop="priority" :label="T('Priority')" width="80" align="center" class-name="relay-nodes__tnum">
          <template #default="{row}">{{ row.priority ?? '—' }}</template>
        </el-table-column>
        <el-table-column :label="T('Status')" width="92">
          <template #default="{row}">
            <YjStatusDot v-if="row.status === 1" status="online" :text="T('Online')"/>
            <YjStatusDot v-else-if="row.status === 2" status="danger" :text="T('Offline')"/>
            <YjStatusDot v-else status="offline" :text="T('Unknown')"/>
          </template>
        </el-table-column>
        <el-table-column :label="T('Latency')" width="90" align="right" class-name="relay-nodes__tnum yj-mono">
          <template #default="{row}">
            <span :class="latencyClass(row.last_latency_ms)">
              {{ row.last_latency_ms != null ? `${row.last_latency_ms}ms` : '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="T('LastCheckedAt')" width="110">
          <template #default="{row}">{{ relTime(row.last_checked_at) }}</template>
        </el-table-column>
        <el-table-column :label="T('Enabled')" width="70" align="center">
          <template #default="{row}">
            <el-switch :model-value="!!row.enabled" :loading="enablingMap[row.row_id]"
                       @change="v => toggleEnabled(row, v)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" width="120" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" :loading="!!testingMap[row.row_id]" :disabled="testingAll"
                       @click="testRow(row)">{{ T('Test') }}</el-button>
            <el-button link type="primary" @click="toUpdate(row)">{{ T('Edit') }}</el-button>
            <el-dropdown trigger="click" @command="cmd => onRowCommand(cmd, row)">
              <el-button link type="primary">{{ T('More') }}</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete"><span class="relay-nodes__danger">{{ T('Delete') }}</span></el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <template #empty>
          <YjEmpty/>
        </template>
      </el-table>

      <div v-if="listRes.total > listQuery.page_size" class="relay-nodes__pager">
        <el-pagination background layout="prev, pager, next"
                       v-model:page-size="listQuery.page_size"
                       v-model:current-page="listQuery.page"
                       :total="listRes.total">
        </el-pagination>
      </div>
    </template>

    <!-- 从服务器导入对话框 -->
    <el-dialog v-model="importDlg.visible" :title="T('ImportDialogTitle')" width="640px">
      <el-alert v-if="importDlg.unparsed" type="warning" :title="T('ImportUnparsed', { n: importDlg.unparsed })"
                :closable="false" show-icon class="relay-nodes__import-tip"/>
      <el-table ref="importTableRef" :data="importDlg.rows" size="small" border max-height="360"
                @selection-change="rows => importDlg.selected = rows">
        <el-table-column type="selection" width="40" :selectable="row => !row.exists"></el-table-column>
        <el-table-column label="host:port" min-width="150" class-name="yj-mono">
          <template #default="{row}">
            {{ row.host }}:{{ row.port }}
            <el-tag v-if="row.exists" size="small" type="info" disable-transitions class="relay-nodes__exists-tag">
              {{ T('AlreadyExists') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('Name')" min-width="140">
          <template #default="{row}">
            <el-input v-model="row.name" size="small" maxlength="64" :disabled="row.exists"></el-input>
          </template>
        </el-table-column>
        <el-table-column :label="T('Region')" width="110">
          <template #default="{row}">
            <el-input v-model="row.region" size="small" maxlength="32" :disabled="row.exists"></el-input>
          </template>
        </el-table-column>
        <el-table-column :label="T('Priority')" width="110">
          <template #default="{row}">
            <el-input-number v-model="row.priority" size="small" :min="0" :max="99999" :precision="0"
                             controls-position="right" :disabled="row.exists"></el-input-number>
          </template>
        </el-table-column>
        <template #empty>
          <YjEmpty/>
        </template>
      </el-table>
      <template #footer>
        <el-button @click="importDlg.visible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" :loading="importDlg.importing" :disabled="!importDlg.selected.length" @click="doImport">
          {{ T('ImportSelected') }}（{{ importDlg.selected.length }}）
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增 / 编辑对话框 -->
    <el-dialog v-model="formVisible" :title="formData.row_id ? T('EditNode') : T('AddNode')" width="520px" @closed="resetPreTest">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="96px">
        <el-form-item :label="T('Name')" prop="name">
          <el-input v-model="formData.name" maxlength="64"></el-input>
        </el-form-item>
        <el-form-item :label="T('Host')" prop="host">
          <el-input v-model="formData.host" placeholder="relay1.example.com"></el-input>
        </el-form-item>
        <el-form-item :label="T('Port')" prop="port">
          <el-input-number v-model="formData.port" :min="1" :max="65535" :precision="0" controls-position="right"></el-input-number>
        </el-form-item>
        <el-form-item :label="T('PublicKey')" prop="public_key">
          <el-input v-model="formData.public_key"></el-input>
        </el-form-item>
        <el-form-item :label="T('Region')" prop="region">
          <el-input v-model="formData.region" maxlength="32"></el-input>
        </el-form-item>
        <el-form-item :label="T('ISP')" prop="isp">
          <el-input v-model="formData.isp" maxlength="32"></el-input>
        </el-form-item>
        <el-form-item :label="T('Priority')" prop="priority">
          <el-input-number v-model="formData.priority" :min="0" :max="99999" :precision="0" controls-position="right"></el-input-number>
        </el-form-item>
        <el-form-item :label="T('Enabled')" prop="enabled">
          <el-switch v-model="formData.enabled"></el-switch>
        </el-form-item>
        <el-form-item :label="T('Remark')" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" maxlength="200"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="relay-nodes__dialog-footer">
          <div class="relay-nodes__pretest">
            <el-button
                :type="preTest.state === 'success' ? 'success' : preTest.state === 'failed' ? 'danger' : 'default'"
                :loading="preTest.state === 'testing'"
                :disabled="!formData.host || !formData.port"
                @click="preCheck">
              <template v-if="preTest.state === 'success'">{{ T('TestPassed') }} {{ preTest.latency }}ms</template>
              <template v-else-if="preTest.state === 'failed'">{{ T('TestFailed') }}</template>
              <template v-else>{{ T('TestConnection') }}</template>
            </el-button>
            <span v-if="preTest.state === 'failed' && preTest.error" class="relay-nodes__pretest-err">{{ preTest.error }}</span>
          </div>
          <div>
            <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
            <el-button type="primary" :loading="submitting" @click="submit">{{ T('Submit') }}</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { T } from '@/utils/i18n'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { CopyDocument as CopyIcon, Refresh as RefreshIcon } from '@element-plus/icons-vue'
  import { timeAgo } from '@/utils/time'
  import { sendCmd } from '@/api/rustdesk'
  import { confirmRisk, ID_TARGET } from '@/views/rustdesk/options'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'
  import YjEmpty from '@/components/yj/YjEmpty.vue'
  import {
    createRelayNode,
    deleteRelayNodes,
    listRelayNodes,
    testRelayNode,
    updateRelayNode,
  } from '@/api/relayNodes'

  const props = defineProps({
    canSend: Boolean,
  })

  /* ================= 列表（分页表格） ================= */
  const listRes = reactive({ list: [], total: 0, loading: false })
  const listQuery = reactive({ page: 1, page_size: 10, name: '' })
  const inited = ref(false)

  const getList = async () => {
    listRes.loading = true
    const res = await listRelayNodes(listQuery).catch(_ => false)
    listRes.loading = false
    inited.value = true
    if (res) {
      listRes.list = res.data.list || []
      listRes.total = res.data.total || 0
    }
  }
  const handlerQuery = () => {
    if (listQuery.page === 1) {
      getList()
    } else {
      listQuery.page = 1
    }
  }
  watch(() => listQuery.page, getList)

  // 纯空态（无数据且无筛选词）：隐藏筛选输入，展示精简空态
  const isEmpty = computed(() => inited.value && !listRes.loading && !listRes.list.length && !listQuery.name)

  /* ================= 全量节点（同步比对 / 导入去重的单一事实源） ================= */
  const allNodes = ref([])
  const getAllNodes = async () => {
    const res = await listRelayNodes({ page: 1, page_size: 500 }).catch(_ => false)
    if (res) {
      allNodes.value = res.data.list || []
    }
  }
  onMounted(() => {
    getList()
    getAllNodes()
  })

  // 最近探测相对时间（兼容秒/毫秒时间戳与 ISO 字符串）
  const relTime = (v) => {
    if (!v) {
      return '—'
    }
    let t = v
    if (typeof t === 'number') {
      t = t < 1e12 ? t * 1000 : t
    }
    return timeAgo(t)
  }

  // 延迟色阶：<50 绿 / <120 黄 / >=120 红（对齐会话质量标准）
  const latencyClass = (v) => {
    if (v == null) {
      return ''
    }
    if (v < 50) {
      return 'relay-nodes__latency--good'
    }
    if (v < 120) {
      return 'relay-nodes__latency--fair'
    }
    return 'relay-nodes__latency--poor'
  }

  /* ================= 当前生效配置（原 relay_servers 读取逻辑） ================= */
  const serverCfg = reactive({ raw: '', loading: false })
  const serverLoaded = ref(false)
  const expandCfg = ref(false)
  const parseList = (s) => (s || '').split(',').map(i => i.trim()).filter(i => i)
  const serverHosts = computed(() => parseList(serverCfg.raw))

  const getServerConfig = async () => {
    serverCfg.loading = true
    const res = await sendCmd({ cmd: 'rs', target: ID_TARGET }).catch(_ => false)
    serverCfg.loading = false
    if (res) {
      serverCfg.raw = res.data.split('\n').filter(i => i).join(',')
      serverLoaded.value = true
    }
  }
  watch(() => props.canSend, (v) => {
    if (v) {
      getServerConfig()
    }
  })

  const copyConfig = async () => {
    if (!serverCfg.raw) {
      return
    }
    let copied = false
    try {
      await navigator.clipboard.writeText(serverCfg.raw)
      copied = true
    } catch (_) {
      const ta = document.createElement('textarea')
      ta.value = serverCfg.raw
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        copied = document.execCommand('copy')
      } catch (e) {
        copied = false
      }
      document.body.removeChild(ta)
    }
    if (copied) {
      ElMessage.success(T('CopyAuditTip'))
    } else {
      ElMessage.error(T('CopyFailed'))
    }
  }

  /* ================= 同步状态与「应用到服务器」（唯一主操作） ================= */
  const applying = ref(false)
  const enabledNodes = computed(() =>
    allNodes.value.filter(n => n.enabled).slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)),
  )
  const desiredHosts = computed(() => enabledNodes.value.map(n => `${n.host}:${n.port}`))
  const mismatch = computed(() => {
    if (!serverLoaded.value) {
      return false
    }
    const a = serverHosts.value
    const b = desiredHosts.value
    if (a.length !== b.length) {
      return true
    }
    const setA = new Set(a)
    return b.some(x => !setA.has(x))
  })

  const applyToServer = async (skipConfirm = false) => {
    if (!desiredHosts.value.length) {
      return false
    }
    if (!skipConfirm) {
      const ok = await confirmRisk('relay_apply')
      if (!ok) {
        return false
      }
    }
    applying.value = true
    const value = desiredHosts.value.join(',')
    const res = await sendCmd({ cmd: 'rs', option: value, target: ID_TARGET }).catch(_ => false)
    applying.value = false
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      serverCfg.raw = value
      serverLoaded.value = true
      return true
    }
    return false
  }

  // 强制中继保存后联动重存，防止中继列表被重置（替代原 relay_servers.resave）
  const resync = async () => {
    if (!allNodes.value.length) {
      await getAllNodes()
    }
    if (!desiredHosts.value.length) {
      ElMessage.warning(T('RelayNodesResyncManual'))
      return
    }
    await applyToServer(true)
  }
  defineExpose({ resync })

  /* ================= 从服务器导入 ================= */
  const importDlg = reactive({ visible: false, rows: [], selected: [], importing: false, unparsed: 0 })
  const importTableRef = ref(null)

  const openImport = async () => {
    // 去重以全量节点表为准
    await getAllNodes()
    const existing = new Set(allNodes.value.map(n => `${n.host}:${n.port}`))
    const rows = []
    let unparsed = 0
    for (const item of serverHosts.value) {
      const idx = item.lastIndexOf(':')
      const host = idx > 0 ? item.slice(0, idx).trim() : ''
      const port = idx > 0 ? parseInt(item.slice(idx + 1), 10) : NaN
      if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
        unparsed++
        continue
      }
      rows.push({
        key: `${host}:${port}`,
        host,
        port,
        name: host,
        region: '',
        priority: 0,
        exists: existing.has(`${host}:${port}`),
      })
    }
    importDlg.rows = rows
    importDlg.selected = []
    importDlg.unparsed = unparsed
    importDlg.visible = true
  }

  const doImport = async () => {
    const chosen = importDlg.selected.filter(r => !r.exists)
    if (!chosen.length) {
      return
    }
    importDlg.importing = true
    let okCount = 0
    let failCount = 0
    for (const row of chosen) {
      const res = await createRelayNode({
        name: row.name || row.host,
        host: row.host,
        port: row.port,
        public_key: '',
        region: row.region,
        isp: '',
        priority: row.priority || 0,
        enabled: true,
        remark: '',
      }).catch(_ => false)
      if (res) {
        okCount++
      } else {
        failCount++
      }
    }
    importDlg.importing = false
    importDlg.visible = false
    const skipped = importDlg.rows.filter(r => r.exists).length
    const parts = [T('ImportSummarySuccess', { n: okCount })]
    if (skipped) {
      parts.push(T('ImportSummarySkip', { m: skipped }))
    }
    if (failCount) {
      parts.push(T('ImportSummaryFail', { k: failCount }))
    }
    ElMessage[failCount ? 'warning' : 'success'](parts.join('，'))
    getList()
    getAllNodes()
  }

  /* ================= 连通性测试 ================= */
  const testingMap = reactive({})
  const testingAll = ref(false)

  const applyTestResult = (row, data) => {
    row.status = data.ok ? 1 : 2
    row.last_latency_ms = data.ok ? data.latency_ms : null
    row.last_checked_at = Date.now()
  }

  const testRow = async (row) => {
    if (testingMap[row.row_id]) {
      return
    }
    testingMap[row.row_id] = true
    const res = await testRelayNode({ row_id: row.row_id }).catch(_ => false)
    testingMap[row.row_id] = false
    if (res && res.data) {
      applyTestResult(row, res.data)
      if (res.data.ok) {
        ElMessage.success(`${row.name || row.host}: ${res.data.latency_ms}ms`)
      } else {
        ElMessage.error(`${row.name || row.host}: ${res.data.error || T('TestFailed')}`)
      }
    }
  }

  const testAll = async () => {
    testingAll.value = true
    for (const row of listRes.list) {
      testingMap[row.row_id] = true
      const res = await testRelayNode({ row_id: row.row_id }).catch(_ => false)
      testingMap[row.row_id] = false
      if (res && res.data) {
        applyTestResult(row, res.data)
      }
    }
    testingAll.value = false
    // 全部测试完成后刷新列表，回写服务端权威状态
    await getList()
    const okCount = listRes.list.filter(r => r.status === 1).length
    ElMessage.success(`${T('TestAll')}: ${okCount}/${listRes.list.length} ${T('Online')}`)
  }

  /* ================= 启用开关（即时生效，失败不翻滚） ================= */
  const enablingMap = reactive({})
  const toggleEnabled = async (row, v) => {
    enablingMap[row.row_id] = true
    const res = await updateRelayNode(buildPayload({ ...row, enabled: v })).catch(_ => false)
    enablingMap[row.row_id] = false
    if (res) {
      row.enabled = v
      ElMessage.success(T('OperationSuccess'))
      getAllNodes()
    }
  }

  /* ================= 新增 / 编辑 ================= */
  const formVisible = ref(false)
  const submitting = ref(false)
  const formRef = ref(null)
  const formData = reactive({
    row_id: null,
    name: '',
    host: '',
    port: 21117,
    public_key: '',
    region: '',
    isp: '',
    priority: 0,
    enabled: true,
    remark: '',
  })

  const buildPayload = (src) => ({
    row_id: src.row_id ?? undefined,
    name: src.name,
    host: src.host,
    port: src.port,
    public_key: src.public_key,
    region: src.region,
    isp: src.isp,
    priority: src.priority,
    enabled: !!src.enabled,
    remark: src.remark,
  })

  const validatePort = (rule, value, callback) => {
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      callback(new Error('1-65535'))
    } else {
      callback()
    }
  }
  const validatePriority = (rule, value, callback) => {
    if (value !== null && value !== undefined && !Number.isFinite(Number(value))) {
      callback(new Error('number'))
    } else {
      callback()
    }
  }
  const formRules = {
    host: [{ required: true, message: T('ParamRequired', { param: T('Host') }), trigger: 'blur' }],
    port: [{ required: true, validator: validatePort, trigger: 'blur' }],
    priority: [{ validator: validatePriority, trigger: 'blur' }],
  }

  const resetForm = () => {
    formData.row_id = null
    formData.name = ''
    formData.host = ''
    formData.port = 21117
    formData.public_key = ''
    formData.region = ''
    formData.isp = ''
    formData.priority = 0
    formData.enabled = true
    formData.remark = ''
  }
  const toAdd = () => {
    resetForm()
    formVisible.value = true
  }
  const toUpdate = (row) => {
    resetForm()
    Object.assign(formData, {
      row_id: row.row_id,
      name: row.name,
      host: row.host,
      port: row.port,
      public_key: row.public_key,
      region: row.region,
      isp: row.isp,
      priority: row.priority,
      enabled: !!row.enabled,
      remark: row.remark,
    })
    formVisible.value = true
  }

  const submit = async () => {
    const valid = await formRef.value.validate().catch(_ => false)
    if (!valid) {
      return
    }
    submitting.value = true
    const api = formData.row_id ? updateRelayNode : createRelayNode
    const res = await api(buildPayload(formData)).catch(_ => false)
    submitting.value = false
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      formVisible.value = false
      getList()
      getAllNodes()
    }
  }

  /* ================= 保存前测试连接预检（六态按钮） ================= */
  const preTest = reactive({ state: 'idle', latency: null, error: '' })
  const resetPreTest = () => {
    preTest.state = 'idle'
    preTest.latency = null
    preTest.error = ''
  }
  watch(() => [formData.host, formData.port], resetPreTest)
  const preCheck = async () => {
    preTest.state = 'testing'
    preTest.error = ''
    const res = await testRelayNode({ host: formData.host, port: formData.port }).catch(_ => false)
    if (res && res.data && res.data.ok) {
      preTest.state = 'success'
      preTest.latency = res.data.latency_ms
    } else {
      preTest.state = 'failed'
      preTest.error = res?.data?.error || T('TestFailed')
    }
  }

  /* ================= 删除（高风险确认） ================= */
  const onRowCommand = (cmd, row) => {
    if (cmd === 'delete') {
      del(row)
    }
  }
  const del = async (row) => {
    const ok = await confirmRisk('relay_node_delete')
    if (!ok) {
      return
    }
    const res = await deleteRelayNodes({ row_ids: [row.row_id] }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
      getAllNodes()
    }
  }
</script>

<style scoped lang="scss">
.relay-nodes {
  /* 生效配置紧凑摘要行 */
  &__summary {
    margin-bottom: var(--yj-spacing-xxl);
  }

  &__summary-row {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-md);
    min-height: 48px;
    padding: var(--yj-spacing-sm) 0;
  }

  &__summary-text {
    font-size: var(--yj-font-size-md);
    color: var(--yj-text-primary);
    font-weight: var(--yj-font-weight-medium);
  }

  &__summary-status {
    font-size: var(--yj-font-size-sm);

    &.is-synced {
      color: var(--yj-success);
    }

    &.is-pending {
      color: var(--yj-warning);
    }
  }

  &__summary-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-xs);

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--yj-spacing-sm);
    padding: 0 0 var(--yj-spacing-md) var(--yj-spacing-xxl);
  }

  /* 工具行 */
  &__toolbar {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-sm);
    margin-bottom: var(--yj-spacing-lg);

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  &__search {
    width: 220px;
  }

  &__toolbar-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-sm);

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  &__apply-badge {
    :deep(.el-badge__content.is-dot) {
      z-index: 1;
    }
  }

  &__skeleton {
    padding: var(--yj-spacing-lg) 0;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--yj-spacing-lg);
  }

  &__danger {
    color: var(--yj-danger);
  }

  &__import-tip {
    margin-bottom: var(--yj-spacing-md);
  }

  &__exists-tag {
    margin-left: var(--yj-spacing-sm);
  }

  &__dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--yj-spacing-md);
  }

  &__pretest {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-sm);
    min-width: 0;
  }

  &__pretest-err {
    font-size: var(--yj-font-size-sm);
    color: var(--yj-danger);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  /* 延迟色阶（对齐会话质量标准） */
  &__latency--good {
    color: var(--yj-success);
    font-weight: var(--yj-font-weight-medium);
  }

  &__latency--fair {
    color: var(--yj-warning);
    font-weight: var(--yj-font-weight-medium);
  }

  &__latency--poor {
    color: var(--yj-danger);
    font-weight: var(--yj-font-weight-medium);
  }
}

/* 延迟 / 优先级数字：等宽 tnum */
:deep(.relay-nodes__tnum) {
  font-variant-numeric: tabular-nums;
}
</style>
