<template>
  <div class="yj-settings-center">
    <YjPageHeader :title="T('ServerCmd')" description="服务器安全、网络与用量统一配置">
      <template #actions>
        <div class="yj-settings-status">
          <YjStatusDot :status="canSendIdServerCmd ? 'online' : 'offline'" text="ID 服务"/>
          <YjStatusDot :status="canSendRelayServerCmd ? 'online' : 'offline'" text="Relay 服务"/>
          <el-button text size="small" @click="refreshStatus">{{ T('Refresh') }}</el-button>
        </div>
      </template>
    </YjPageHeader>

    <div class="yj-settings-body">
      <!-- 左侧二级导航 176px：安全 / 网络 / 用量分组（规范 v2.1 §2.3-D） -->
      <aside class="yj-settings-nav">
        <div v-for="group in SETTINGS_NAV" :key="group.key" class="yj-settings-nav__group">
          <div class="yj-settings-nav__group-label">{{ group.label }}</div>
          <button
              v-for="item in group.items"
              :key="item.key"
              type="button"
              class="yj-settings-nav__item"
              :class="{ 'is-active': activePanel === item.key }"
              @click="switchPanel(item.key)"
          >
            <span class="yj-settings-nav__item-label">{{ T(item.label) }}</span>
            <span v-if="item.risk" class="yj-settings-nav__item-risk">高风险</span>
            <span v-if="dirtyMap[item.key]" class="yj-settings-nav__item-dirty" title="有未保存的更改"></span>
          </button>
        </div>
      </aside>

      <!-- 右侧内容：表单最大 760px -->
      <section class="yj-settings-content">
        <div v-show="activePanel === 'blacklist'" class="yj-settings-pane">
          <Blacklist :can-send="canSendRelayServerCmd"/>
        </div>
        <div v-show="activePanel === 'blocklist'" class="yj-settings-pane">
          <Blocklist :can-send="canSendRelayServerCmd"/>
        </div>
        <div v-show="activePanel === 'must_login'" class="yj-settings-pane">
          <MustLogin ref="mlPanel" :can-send="canControlMustLogin && canSendIdServerCmd"
                     @dirty-change="v => onDirtyChange('must_login', v)"/>
        </div>
        <div v-show="activePanel === 'always_use_relay'" class="yj-settings-pane">
          <AlwaysUseRelay ref="aurPanel" :can-send="canSendIdServerCmd"
                          @success="handleAlwaysUseRelaySuccess"
                          @dirty-change="v => onDirtyChange('always_use_relay', v)"/>
        </div>
        <div v-show="activePanel === 'relay_nodes'" class="yj-settings-pane">
          <RelayNodes ref="rnPanel" :can-send="canSendIdServerCmd"/>
        </div>
        <div v-show="activePanel === 'usage'" class="yj-settings-pane">
          <Usage :can-send="canSendRelayServerCmd"/>
        </div>

        <!-- 命令控制台（原 Advanced 标签页内容） -->
        <div v-show="activePanel === 'control'" class="yj-settings-pane">
          <div class="yj-settings-panel">
            <header class="yj-settings-panel__header">
              <h2 class="yj-settings-panel__title">命令控制台 <span class="yj-settings-panel__code">ADVANCED</span></h2>
              <p class="yj-settings-panel__desc"
                 v-html="T('ServerCmdTips', {wiki: '<a target=\'_blank\' href=\'https://github.com/lejianwen/rustdesk-api/wiki/Rustdesk-Command\'>WIKI</a>'})"></p>
            </header>

            <div class="yj-settings-group">
              <div class="yj-settings-row yj-settings-row--column">
                <div class="yj-settings-row__main">
                  <div class="yj-settings-row__name">命令模板</div>
                  <div class="yj-settings-row__help">预置命令模板，可直接下发到 ID 服务器或中继服务器，请谨慎操作。</div>
                </div>
                <div class="yj-settings-console__actions">
                  <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
                  <el-button @click="toAdd">{{ T('Add') }}</el-button>
                  <el-button :disabled="!canSendIdServerCmd" @click="showCmd({cmd:'',option:'',target:ID_TARGET})">
                    {{ T('Send') }} To Id
                  </el-button>
                  <el-button :disabled="!canSendRelayServerCmd" @click="showCmd({cmd:'',option:'',target:RELAY_TARGET})">
                    {{ T('Send') }} To Relay
                  </el-button>
                </div>
              </div>
            </div>

            <el-table :data="listRes.list" v-loading="listRes.loading" border size="small" class="yj-settings-console__table">
              <el-table-column prop="cmd" label="cmd" width="110" show-overflow-tooltip class-name="yj-mono"></el-table-column>
              <el-table-column prop="alias" label="alias" width="90" show-overflow-tooltip></el-table-column>
              <el-table-column prop="option" label="option" min-width="120" show-overflow-tooltip class-name="yj-mono"></el-table-column>
              <el-table-column prop="explain" label="explain" min-width="120" show-overflow-tooltip></el-table-column>
              <el-table-column :label="T('Actions')" width="168" fixed="right">
                <template #default="{row}">
                  <el-button link type="primary" :disabled="!canSendCmd(row.target)" @click="showCmd(row)">{{ T('Send') }}</el-button>
                  <el-button v-if="row.id" link type="primary" @click="toUpdate(row)">{{ T('Edit') }}</el-button>
                  <el-button v-if="row.id" link type="danger" @click="del(row)">{{ T('Delete') }}</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-dialog v-model="formVisible">
              <el-form label-width="150">
                <el-form-item label="cmd">
                  <el-input v-model="formData.cmd"></el-input>
                </el-form-item>
                <el-form-item label="alias">
                  <el-input v-model="formData.alias"></el-input>
                </el-form-item>
                <el-form-item label="option">
                  <el-input v-model="formData.option"></el-input>
                </el-form-item>
                <el-form-item label="target">
                  <el-radio-group v-model="formData.target">
                    <el-radio label="id_server" value="21115"></el-radio>
                    <el-radio label="relay_server" value="21117"></el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="explain">
                  <el-input v-model="formData.explain"></el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submit">{{ T('Submit') }}</el-button>
                  <el-button @click="cancel">{{ T('Cancel') }}</el-button>
                </el-form-item>
              </el-form>
            </el-dialog>

            <el-dialog :title="T('SendCmd')" v-model="showCmdForm">
              <el-form label-width="150" :disabled="!canSendCmd(customCmd.target)">
                <el-form-item label="cmd">
                  <el-input v-model="customCmd.cmd"></el-input>
                </el-form-item>
                <el-form-item label="option">
                  <el-input v-model="customCmd.option"></el-input>
                  <el-text v-if="customCmd.example.trim()" style="margin-top: 5px">Example:
                    <el-text type="primary">{{ customCmd.example }}</el-text>
                  </el-text>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitCmd">{{ T('Send') }}</el-button>
                </el-form-item>
                <el-form-item :label="T('Result')">
                  <el-input type="textarea" readonly disabled v-model="customCmd.res" rows="15"></el-input>
                </el-form-item>
              </el-form>
            </el-dialog>
          </div>
        </div>

        <!-- 底部粘性保存条：仅当前分组有未保存变更时出现 -->
        <div class="yj-savebar-slot">
          <transition name="yj-savebar">
            <div v-if="activeDirty" class="yj-savebar">
              <span class="yj-savebar__text">当前分组有未保存的更改</span>
              <div class="yj-savebar__actions">
                <el-button @click="onDiscard">放弃</el-button>
                <el-button type="primary" :loading="panelSaving" @click="onSave">保存更改</el-button>
              </div>
            </div>
          </transition>
        </div>
      </section>
    </div>
  </div>
</template>


<script setup>
  import { create, list, remove, sendCmd, update } from '@/api/rustdesk'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { T } from '@/utils/i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ID_TARGET, RELAY_TARGET, SETTINGS_NAV } from '@/views/rustdesk/options'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'
  import Blocklist from '@/views/rustdesk/blocklist.vue'
  import Blacklist from '@/views/rustdesk/blacklist.vue'
  import AlwaysUseRelay from '@/views/rustdesk/always_use_relay.vue'
  import MustLogin from '@/views/rustdesk/must_login.vue'
  import RelayNodes from '@/views/rustdesk/relay_nodes.vue'
  import Usage from '@/views/rustdesk/usage.vue'

  /* ================= 设置中心导航与面板切换（?panel=xxx 可直达） ================= */
  const route = useRoute()
  const router = useRouter()
  const panelKeys = SETTINGS_NAV.flatMap(g => g.items.map(i => i.key))
  // 旧面板入口重定向（防止书签 404）：relay_servers 已并入 relay_nodes
  const LEGACY_PANEL = { relay_servers: 'relay_nodes' }
  const normalizePanel = (p) => LEGACY_PANEL[p] || p
  const activePanel = ref(panelKeys.includes(normalizePanel(route.query.panel)) ? normalizePanel(route.query.panel) : 'blacklist')
  const switchPanel = (key) => {
    if (activePanel.value === key) {
      return
    }
    activePanel.value = key
    router.replace({ query: { ...route.query, panel: key } })
  }
  watch(() => route.query.panel, (v) => {
    if (v && LEGACY_PANEL[v]) {
      router.replace({ query: { ...route.query, panel: LEGACY_PANEL[v] } })
      return
    }
    if (v && panelKeys.includes(v) && v !== activePanel.value) {
      activePanel.value = v
    }
  })

  /* ================= 粘性保存条：面板 dirty 状态汇聚 ================= */
  const dirtyMap = reactive({})
  const onDirtyChange = (key, v) => {
    dirtyMap[key] = v
  }
  const activeDirty = computed(() => !!dirtyMap[activePanel.value])
  const rnPanel = ref(null)
  const aurPanel = ref(null)
  const mlPanel = ref(null)
  const panelRefs = {
    always_use_relay: aurPanel,
    must_login: mlPanel,
  }
  const panelSaving = ref(false)
  const onSave = async () => {
    const inst = panelRefs[activePanel.value]?.value
    if (!inst?.save) {
      return
    }
    panelSaving.value = true
    await inst.save()
    panelSaving.value = false
  }
  const onDiscard = () => {
    panelRefs[activePanel.value]?.value?.discard?.()
  }

  /* ================= 服务器命令可用性 ================= */
  const canSendIdServerCmd = ref(false)
  const canControlMustLogin = ref(false)
  const checkCanSendIdServerCmd = async () => {
    const res = await sendCmd({ cmd: 'h', target: ID_TARGET }).catch(_ => false)
    canSendIdServerCmd.value = !!res.data
    if (canSendIdServerCmd.value) {
      const commands = res.data.split('\n').filter(i => i)
      canControlMustLogin.value = commands.some(i => i.includes('must-login'))
    }
  }

  const canSendRelayServerCmd = ref(false)
  const checkCanSendRelayServerCmd = async () => {
    const res = await sendCmd({ cmd: 'h', target: RELAY_TARGET }).catch(_ => false)
    canSendRelayServerCmd.value = !!res.data
  }

  const refreshStatus = () => {
    checkCanSendIdServerCmd()
    checkCanSendRelayServerCmd()
  }
  onMounted(refreshStatus)

  // 保存强制中继后联动重存中继列表（节点表为单一事实源），防止被重置
  const handleAlwaysUseRelaySuccess = () => {
    rnPanel.value?.resync?.()
  }

  const canSendCmd = (target) => {
    if (target === ID_TARGET) {
      return canSendIdServerCmd.value
    }
    if (target === RELAY_TARGET) {
      return canSendRelayServerCmd.value
    }
    return false
  }

  /* ================= 命令控制台（原 Advanced） ================= */
  const listRes = reactive({
    list: [], total: 0, loading: false,
  })
  const listQuery = reactive({
    page: 1,
    page_size: 10,
  })
  const getList = async () => {
    listRes.loading = true
    const res = await list(listQuery).catch(_ => false)
    listRes.loading = false
    if (res) {
      listRes.list = res.data.list
      listRes.total = res.data.total
    }
  }
  const handlerQuery = () => {
    if (listQuery.page === 1) {
      getList()
    } else {
      listQuery.page = 1
    }
  }
  onMounted(getList)
  const del = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }

    const res = await remove({ id: row.id }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
    }
  }
  const formData = reactive({
    cmd: '',
    alias: '',
    option: '',
    target: '',
    explain: '',
  })
  const formVisible = ref(false)
  const toAdd = () => {
    formVisible.value = true
    formData.cmd = ''
    formData.alias = ''
    formData.option = ''
    formData.explain = ''
  }
  const toUpdate = (row) => {
    formVisible.value = true
    formData.id = row.id
    formData.cmd = row.cmd
    formData.alias = row.alias
    formData.option = row.option
    formData.target = row.target
    formData.explain = row.explain
  }
  const submit = async () => {
    if (!formData.cmd) {
      ElMessage.error(T('ParamRequired', { param: 'cmd' }))
      return
    }
    const api = formData.id ? update : create
    const res = await api(formData).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      formVisible.value = false
      getList()
    }
  }
  const cancel = () => {
    formVisible.value = false
  }

  const showCmdForm = ref(false)
  const customCmd = reactive({
    cmd: '',
    option: '',
    target: '',
    res: '',
    example: '',
  })
  const showCmd = (row) => {
    showCmdForm.value = true
    customCmd.cmd = row.cmd
    customCmd.option = ''
    customCmd.res = ''
    customCmd.target = row.target
    customCmd.example = `${row.cmd} ${row.option}`
  }
  const submitCmd = async () => {
    sendCmd(customCmd).then(res => {
      customCmd.res = res.data
      ElMessage.success(T('OperationSuccess'))
    })
  }

</script>

<!-- 设置面板共享样式（全局，yj-settings- 前缀仅供本设置中心各面板使用） -->
<style lang="scss">
.yj-settings-panel {
  &__header {
    margin-bottom: var(--yj-spacing-xxl);
  }

  &__title {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: var(--yj-spacing-sm);
    font-size: var(--yj-font-size-xl);
    line-height: 26px;
    font-weight: var(--yj-font-weight-semibold);
    color: var(--yj-text-primary);
  }

  &__code {
    font-family: var(--yj-font-family-mono);
    font-size: var(--yj-font-size-xs);
    font-weight: var(--yj-font-weight-regular);
    color: var(--yj-text-tertiary);
    letter-spacing: 0.04em;
  }

  &__desc {
    margin: var(--yj-spacing-xs) 0 0;
    font-size: var(--yj-font-size-base);
    line-height: var(--yj-line-height-base);
    color: var(--yj-text-secondary);
  }
}

.yj-settings-group {
  border-top: 1px solid var(--yj-divider);
}

.yj-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--yj-spacing-lg);
  min-height: 56px;
  padding: var(--yj-spacing-md) 0;
  border-bottom: 1px solid var(--yj-divider);

  &--column {
    flex-direction: column;
    align-items: stretch;
    gap: var(--yj-spacing-md);
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: var(--yj-font-size-md);
    font-weight: var(--yj-font-weight-medium);
    color: var(--yj-text-primary);
  }

  &__help {
    margin-top: var(--yj-spacing-xs);
    font-size: var(--yj-font-size-sm);
    line-height: var(--yj-line-height-base);
    color: var(--yj-text-tertiary);
  }

  &__control {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-sm);

    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.yj-current-value {
  display: flex;
  align-items: center;
  gap: var(--yj-spacing-sm);
}

.yj-mono-value {
  font-family: var(--yj-font-family-mono);
  font-size: var(--yj-font-size-sm);
  color: var(--yj-text-primary);
  background: var(--yj-surface-hover);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-sm);
  padding: var(--yj-spacing-xs) var(--yj-spacing-sm);
  word-break: break-all;
}

.yj-ip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--yj-spacing-sm);

  &__empty {
    font-size: var(--yj-font-size-base);
    color: var(--yj-text-tertiary);
  }
}

.yj-dialog-hint {
  margin-top: var(--yj-spacing-xs);
  font-size: var(--yj-font-size-sm);
  line-height: var(--yj-line-height-base);
  color: var(--yj-text-tertiary);
}

.yj-risk-confirm {
  p {
    margin: 0 0 var(--yj-spacing-sm);
    font-size: var(--yj-font-size-base);
    line-height: var(--yj-line-height-base);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.yj-savebar-slot {
  margin-top: auto;
  position: sticky;
  bottom: var(--yj-spacing-lg);
  padding-top: var(--yj-spacing-lg);
  z-index: var(--yj-z-sticky);
}

.yj-savebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--yj-spacing-lg);
  padding: var(--yj-spacing-md) var(--yj-spacing-lg);
  background: var(--yj-surface);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-lg);
  box-shadow: var(--yj-shadow-md);

  &__text {
    font-size: var(--yj-font-size-base);
    color: var(--yj-text-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-sm);

    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.yj-savebar-enter-active,
.yj-savebar-leave-active {
  transition: opacity var(--yj-duration-normal) var(--yj-easing-standard),
  transform var(--yj-duration-normal) var(--yj-easing-standard);
}

.yj-savebar-enter-from,
.yj-savebar-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .yj-savebar-enter-active,
  .yj-savebar-leave-active {
    transition: none;
  }

  .yj-savebar-enter-from,
  .yj-savebar-leave-to {
    transform: none;
  }
}
</style>

<style scoped lang="scss">
.yj-settings-center {
  .yj-settings-status {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-lg);
  }
}

.yj-settings-body {
  display: flex;
  align-items: flex-start;
  gap: var(--yj-spacing-xxxl);
}

/* 左侧二级导航 176px：选中态蓝色文字 + 3px 左侧指示（规范 v2.1 §2.3-D） */
.yj-settings-nav {
  flex: none;
  width: 176px;
  position: sticky;
  top: var(--yj-spacing-lg);

  &__group + &__group {
    margin-top: var(--yj-spacing-xxl);
  }

  &__group-label {
    padding: 0 var(--yj-spacing-md);
    margin-bottom: var(--yj-spacing-xs);
    font-size: var(--yj-font-size-sm);
    line-height: 20px;
    color: var(--yj-text-tertiary);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-sm);
    width: 100%;
    height: 40px;
    padding: 0 var(--yj-spacing-md);
    border: none;
    border-left: 3px solid transparent;
    border-radius: 0 var(--yj-radius-md) var(--yj-radius-md) 0;
    background: transparent;
    font-size: var(--yj-font-size-md);
    color: var(--yj-text-secondary);
    cursor: pointer;
    transition: color var(--yj-duration-fast) var(--yj-easing-standard),
    background-color var(--yj-duration-fast) var(--yj-easing-standard),
    border-color var(--yj-duration-fast) var(--yj-easing-standard);

    &:hover {
      background: var(--yj-surface-hover);
      color: var(--yj-text-primary);
    }

    &.is-active {
      color: var(--yj-primary);
      border-left-color: var(--yj-primary);
      background: var(--yj-primary-subtle);
      font-weight: var(--yj-font-weight-medium);
    }
  }

  &__item-label {
    flex: 1;
    min-width: 0;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-risk {
    flex: none;
    font-size: var(--yj-font-size-xs);
    line-height: 16px;
    color: var(--yj-warning);
  }

  &__item-dirty {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: var(--yj-radius-full);
    background: var(--yj-warning);
  }
}

.yj-settings-content {
  flex: 1;
  min-width: 0;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  /* 让粘性保存条在短内容时也靠近页面底部 */
  min-height: calc(100vh - var(--yj-header-height) - var(--yj-tags-height) - 200px);
}

.yj-settings-console__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--yj-spacing-sm);

  .el-button + .el-button {
    margin-left: 0;
  }
}

.yj-settings-console__table {
  margin-top: var(--yj-spacing-lg);
}

@media (max-width: 900px) {
  .yj-settings-body {
    flex-direction: column;
    gap: var(--yj-spacing-lg);
  }

  .yj-settings-nav {
    width: 100%;
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: var(--yj-spacing-sm);

    &__group + &__group {
      margin-top: 0;
    }

    &__group {
      min-width: 150px;
    }
  }

  .yj-settings-content {
    max-width: none;
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .yj-settings-nav__item {
    transition: none;
  }
}
</style>
