<template>
  <div class="control-page deployment-page">
    <YjPageHeader
      eyebrow="ZERO-TOUCH ENROLLMENT"
      :title="T('DeploymentCodes')"
      :description="T('DeploymentCodesDescription')"
    >
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="loadWorkspace">{{ T('Refresh') }}</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">{{ T('CreateDeploymentCode') }}</el-button>
      </template>
    </YjPageHeader>

    <section class="enrollment-stage" aria-labelledby="enrollment-stage-title">
      <div class="enrollment-stage__copy">
        <span class="enrollment-stage__kicker">{{ T('EnrollmentTrustBoundary') }}</span>
        <h2 id="enrollment-stage-title">{{ T('EnrollmentStageTitle') }}</h2>
        <p>{{ T('EnrollmentStageDescription') }}</p>
        <div class="trust-pills" aria-label="Security controls">
          <span><Lock :size="14"/> SHA-256</span>
          <span><View :size="14"/> {{ T('ShownOnce') }}</span>
          <span><CircleCheck :size="14"/> {{ T('ApprovalRequired') }}</span>
        </div>
      </div>
      <div class="enrollment-flow" aria-label="Enrollment flow">
        <div class="flow-node is-active">
          <span class="flow-node__index">01</span>
          <strong>{{ T('DeploymentCode') }}</strong>
          <small>{{ T('ScopedCredential') }}</small>
        </div>
        <span class="flow-connector" aria-hidden="true"></span>
        <div class="flow-node">
          <span class="flow-node__index">02</span>
          <strong>{{ T('PendingApproval') }}</strong>
          <small>{{ T('DeviceQuarantine') }}</small>
        </div>
        <span class="flow-connector" aria-hidden="true"></span>
        <div class="flow-node">
          <span class="flow-node__index">03</span>
          <strong>{{ T('TrustedDevice') }}</strong>
          <small>{{ T('OperatorApproved') }}</small>
        </div>
      </div>
    </section>

    <section class="metric-grid" :aria-label="T('EnrollmentOverview')">
      <article class="metric-card">
        <span>{{ T('ActiveCodes') }}</span>
        <strong>{{ metrics.active }}</strong>
        <small>{{ T('ActiveCodesCaption') }}</small>
      </article>
      <article class="metric-card">
        <span>{{ T('RemainingCapacity') }}</span>
        <strong>{{ metrics.capacity }}</strong>
        <small>{{ T('RemainingCapacityCaption') }}</small>
      </article>
      <article class="metric-card" :class="{ 'is-warning': metrics.expiring > 0 }">
        <span>{{ T('ExpiringSoon') }}</span>
        <strong>{{ metrics.expiring }}</strong>
        <small>{{ T('ExpiringSoonCaption') }}</small>
      </article>
      <article class="metric-card" :class="{ 'is-warning': pendingCount > 0 }">
        <span>{{ T('PendingDevices') }}</span>
        <strong>{{ pendingCount }}</strong>
        <el-link type="primary" underline="never" @click="router.push({ name: 'Peer', query: { status: 0 } })">
          {{ T('ReviewQueue') }} →
        </el-link>
      </article>
    </section>

    <el-card class="deployment-list" shadow="never" v-loading="loading">
      <div class="deployment-list__header">
        <div>
          <span class="section-label">{{ T('CredentialInventory') }}</span>
          <h2>{{ T('DeploymentCodeInventory') }}</h2>
        </div>
        <div class="inventory-legend">
          <YjStatusDot status="online" size="sm" :text="T('Active')"/>
          <YjStatusDot status="warning" size="sm" :text="T('ExhaustedOrExpired')"/>
          <YjStatusDot status="offline" size="sm" :text="T('Revoked')"/>
        </div>
      </div>

      <el-table class="desktop-inventory" :data="codes">
        <el-table-column :label="T('DeploymentCode')" min-width="245">
          <template #default="{ row }">
            <div class="credential-cell">
              <code>{{ row.code_hint }}</code>
              <div><strong>{{ row.name }}</strong><small>#{{ row.id }}</small></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="T('Scope')" min-width="185">
          <template #default="{ row }">
            <span class="scope-name">{{ groupName(row.device_group_id) }}</span>
            <div class="platform-list">
              <span v-for="platform in platforms(row)" :key="platform">{{ platform }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="T('Usage')" min-width="180">
          <template #default="{ row }">
            <div class="usage-cell">
              <span>{{ row.used_count }} / {{ row.max_uses }}</span>
              <el-progress :percentage="usagePercent(row)" :show-text="false" :stroke-width="5"/>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="T('ExpiresAt')" min-width="155">
          <template #default="{ row }">
            <span class="mono-value">{{ formatUnix(row.expires_at) }}</span>
            <small class="time-caption">{{ expiryCaption(row) }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" width="125">
          <template #default="{ row }">
            <YjStatusDot :status="statusOf(row).dot" size="sm" :text="statusOf(row).label"/>
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" width="190" align="right" fixed="right">
          <template #default="{ row }">
            <el-button text @click="openAudit(row)">{{ T('Audit') }}</el-button>
            <el-dropdown v-if="statusOf(row).key === 'active'" trigger="click" @command="(command) => act(command, row)">
              <el-button text>{{ T('Manage') }}<el-icon class="el-icon--right"><ArrowDown/></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rotate">{{ T('RotateCode') }}</el-dropdown-item>
                  <el-dropdown-item command="revoke" divided><span class="danger-text">{{ T('RevokeCode') }}</span></el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <template #empty>
          <YjEmpty :title="T('NoDeploymentCodes')" :description="T('NoDeploymentCodesDescription')">
            <template #action><el-button type="primary" @click="openCreate">{{ T('CreateDeploymentCode') }}</el-button></template>
          </YjEmpty>
        </template>
      </el-table>

      <div class="mobile-inventory">
        <article v-for="row in codes" :key="row.id" class="mobile-code-card">
          <div class="mobile-code-card__top">
            <code>{{ row.code_hint }}</code>
            <YjStatusDot :status="statusOf(row).dot" size="sm" :text="statusOf(row).label"/>
          </div>
          <h3>{{ row.name }}</h3>
          <p>{{ groupName(row.device_group_id) }} · {{ platforms(row).join(' / ') }}</p>
          <div class="mobile-code-card__usage"><span>{{ T('Usage') }}</span><strong>{{ row.used_count }} / {{ row.max_uses }}</strong></div>
          <el-progress :percentage="usagePercent(row)" :show-text="false" :stroke-width="5"/>
          <div class="mobile-code-card__actions">
            <el-button text @click="openAudit(row)">{{ T('Audit') }}</el-button>
            <el-button v-if="statusOf(row).key === 'active'" text @click="act('rotate', row)">{{ T('RotateCode') }}</el-button>
            <el-button v-if="statusOf(row).key === 'active'" text type="danger" @click="act('revoke', row)">{{ T('RevokeCode') }}</el-button>
          </div>
        </article>
      </div>
    </el-card>

    <el-dialog v-model="createVisible" :title="T('CreateDeploymentCode')" width="min(760px, calc(100vw - 32px))" class="deployment-dialog" @closed="resetCreate">
      <el-steps :active="createStep" align-center finish-status="success">
        <el-step :title="T('Scope')"/>
        <el-step :title="T('Guardrails')"/>
        <el-step :title="T('Review')"/>
      </el-steps>
      <div class="wizard-panel">
        <template v-if="createStep === 0">
          <div class="wizard-heading"><span>01 / 03</span><h3>{{ T('DefineEnrollmentScope') }}</h3><p>{{ T('DefineEnrollmentScopeHint') }}</p></div>
          <el-form label-position="top">
            <el-form-item :label="T('CodeName')" required>
              <el-input v-model="form.name" maxlength="80" show-word-limit :placeholder="T('CodeNamePlaceholder')"/>
            </el-form-item>
            <el-form-item :label="T('DeviceGroup')">
              <el-select v-model="form.device_group_id" filterable style="width: 100%">
                <el-option :label="T('UnassignedGroup')" :value="0"/>
                <el-option v-for="group in groups" :key="group.id" :label="group.name" :value="group.id"/>
              </el-select>
            </el-form-item>
            <el-form-item :label="T('AllowedPlatforms')" required>
              <el-checkbox-group v-model="form.allowed_platforms" class="platform-picker">
                <el-checkbox-button v-for="platform in platformOptions" :key="platform" :value="platform">{{ platform }}</el-checkbox-button>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </template>
        <template v-else-if="createStep === 1">
          <div class="wizard-heading"><span>02 / 03</span><h3>{{ T('SetGuardrails') }}</h3><p>{{ T('SetGuardrailsHint') }}</p></div>
          <div class="guardrail-grid">
            <label><span>{{ T('ValidityWindow') }}</span>
              <el-select v-model="form.ttl" style="width: 100%">
                <el-option v-for="option in ttlOptions" :key="option.value" :label="option.label" :value="option.value"/>
              </el-select>
              <small>{{ T('ValidityWindowHint') }}</small>
            </label>
            <label><span>{{ T('MaximumUses') }}</span>
              <el-input-number v-model="form.max_uses" :min="1" :max="10000" controls-position="right" style="width: 100%"/>
              <small>{{ T('MaximumUsesHint') }}</small>
            </label>
          </div>
          <el-alert type="info" :closable="false" show-icon :title="T('ApprovalAlwaysRequired')" :description="T('ApprovalAlwaysRequiredHint')"/>
        </template>
        <template v-else>
          <div class="wizard-heading"><span>03 / 03</span><h3>{{ T('ReviewDeploymentCode') }}</h3><p>{{ T('ReviewDeploymentCodeHint') }}</p></div>
          <dl class="review-grid">
            <div><dt>{{ T('CodeName') }}</dt><dd>{{ form.name }}</dd></div>
            <div><dt>{{ T('DeviceGroup') }}</dt><dd>{{ groupName(form.device_group_id) }}</dd></div>
            <div><dt>{{ T('AllowedPlatforms') }}</dt><dd>{{ form.allowed_platforms.join(' / ') }}</dd></div>
            <div><dt>{{ T('ValidityWindow') }}</dt><dd>{{ ttlLabel(form.ttl) }}</dd></div>
            <div><dt>{{ T('MaximumUses') }}</dt><dd>{{ form.max_uses }}</dd></div>
            <div><dt>{{ T('ApprovalPolicy') }}</dt><dd>{{ T('PendingApproval') }}</dd></div>
          </dl>
        </template>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createVisible = false">{{ T('Cancel') }}</el-button>
          <span class="dialog-footer__spacer"></span>
          <el-button v-if="createStep > 0" @click="createStep--">{{ T('Back') }}</el-button>
          <el-button v-if="createStep < 2" type="primary" @click="nextStep">{{ T('Continue') }}</el-button>
          <el-button v-else type="primary" :loading="creating" @click="submitCreate">{{ T('CreateDeploymentCode') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="secretVisible" :title="T('DeploymentCodeReady')" width="min(620px, calc(100vw - 32px))" :close-on-click-modal="false">
      <div class="secret-result">
        <div class="secret-result__icon"><CircleCheck :size="26"/></div>
        <h3>{{ T('DeploymentCodeReadyTitle') }}</h3>
        <p>{{ T('DeploymentCodeReadyHint') }}</p>
        <div class="secret-code"><code>{{ issuedSecret }}</code><el-button :icon="CopyDocument" @click="handleClipboard(issuedSecret, $event)">{{ T('Copy') }}</el-button></div>
        <el-alert type="warning" :closable="false" show-icon :title="T('SecretShownOnce')" :description="T('SecretShownOnceHint')"/>
      </div>
      <template #footer><el-button type="primary" @click="secretVisible = false">{{ T('Done') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="auditVisible" :title="T('EnrollmentAudit')" width="min(760px, calc(100vw - 32px))">
      <div class="audit-context"><code>{{ auditTarget?.code_hint }}</code><span>{{ auditTarget?.name }}</span></div>
      <el-table :data="auditEvents" v-loading="auditLoading">
        <el-table-column :label="T('Event')" width="130"><template #default="{ row }"><span class="event-chip">{{ auditAction(row.action) }}</span></template></el-table-column>
        <el-table-column :label="T('Device')" min-width="180"><template #default="{ row }"><span class="mono-value">{{ row.device_id || '—' }}</span><small class="time-caption">{{ row.uuid || row.detail }}</small></template></el-table-column>
        <el-table-column label="IP" min-width="130" prop="ip"/>
        <el-table-column :label="T('CreatedAt')" min-width="165" prop="created_at"/>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onActivated, onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ArrowDown, CircleCheck, CopyDocument, Lock, Plus, Refresh, View } from '@element-plus/icons-vue'
  import { audit, create, list, revoke, rotate } from '@/api/deployment_code'
  import { list as deviceGroupList } from '@/api/device_group'
  import { list as peerList } from '@/api/peer'
  import { T } from '@/utils/i18n'
  import { handleClipboard } from '@/utils/clipboard'
  import YjEmpty from '@/components/yj/YjEmpty.vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'

  const router = useRouter()
  const loading = ref(false)
  const codes = ref([])
  const groups = ref([])
  const pendingCount = ref(0)
  const createVisible = ref(false)
  const createStep = ref(0)
  const creating = ref(false)
  const secretVisible = ref(false)
  const issuedSecret = ref('')
  const auditVisible = ref(false)
  const auditLoading = ref(false)
  const auditEvents = ref([])
  const auditTarget = ref(null)
  const platformOptions = ['windows', 'macos', 'linux', 'android', 'ios']
  const form = reactive({ name: '', device_group_id: 0, allowed_platforms: ['windows', 'macos'], ttl: 86400, max_uses: 25 })

  const ttlOptions = computed(() => [
    { value: 3600, label: T('OneHour') }, { value: 28800, label: T('EightHours') },
    { value: 86400, label: T('OneDay') }, { value: 604800, label: T('SevenDays') },
    { value: 2592000, label: T('ThirtyDays') },
  ])
  const now = () => Math.floor(Date.now() / 1000)
  const platforms = (row) => {
    try { return JSON.parse(row.allowed_platforms || '[]') } catch (_) { return [] }
  }
  const isActive = (row) => row.status === 1 && row.expires_at > now() && row.used_count < row.max_uses
  const metrics = computed(() => ({
    active: codes.value.filter(isActive).length,
    capacity: codes.value.filter(isActive).reduce((sum, row) => sum + row.max_uses - row.used_count, 0),
    expiring: codes.value.filter(row => isActive(row) && row.expires_at - now() <= 86400).length,
  }))
  const usagePercent = (row) => Math.min(100, Math.round((row.used_count / Math.max(row.max_uses, 1)) * 100))
  const formatUnix = (value) => value ? new Date(value * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'
  const groupName = (id) => groups.value.find(group => group.id === id)?.name || T('UnassignedGroup')
  const ttlLabel = (value) => ttlOptions.value.find(option => option.value === value)?.label || '—'
  const expiryCaption = (row) => {
    if (row.status === 2) return T('Revoked')
    const seconds = row.expires_at - now()
    if (seconds <= 0) return T('Expired')
    if (seconds < 3600) return T('MinutesRemaining', { n: Math.ceil(seconds / 60) })
    if (seconds < 86400) return T('HoursRemaining', { n: Math.ceil(seconds / 3600) })
    return T('DaysRemaining', { n: Math.ceil(seconds / 86400) })
  }
  const statusOf = (row) => {
    if (row.status === 2) return { key: 'revoked', dot: 'offline', label: T('Revoked') }
    if (row.expires_at <= now()) return { key: 'expired', dot: 'warning', label: T('Expired') }
    if (row.used_count >= row.max_uses) return { key: 'exhausted', dot: 'warning', label: T('Exhausted') }
    return { key: 'active', dot: 'online', label: T('Active') }
  }
  const auditAction = (action) => ({ created: T('Created'), claimed: T('DeviceClaimed'), revoked: T('Revoked'), rotated: T('Rotated') })[action] || action

  const loadWorkspace = async () => {
    loading.value = true
    const [codeRes, groupRes, pendingRes] = await Promise.all([
      list({ page: 1, page_size: 100 }).catch(() => false),
      deviceGroupList({ page: 1, page_size: 999 }).catch(() => false),
      peerList({ page: 1, page_size: 1, status: 0 }).catch(() => false),
    ])
    if (codeRes) codes.value = codeRes.data.list || []
    if (groupRes) groups.value = groupRes.data.list || []
    if (pendingRes) pendingCount.value = pendingRes.data.total || 0
    loading.value = false
  }
  const openCreate = () => { createVisible.value = true }
  const resetCreate = () => {
    createStep.value = 0
    Object.assign(form, { name: '', device_group_id: 0, allowed_platforms: ['windows', 'macos'], ttl: 86400, max_uses: 25 })
  }
  const nextStep = () => {
    if (createStep.value === 0 && (!form.name.trim() || form.allowed_platforms.length === 0)) {
      ElMessage.warning(T('CompleteRequiredFields'))
      return
    }
    createStep.value++
  }
  const revealSecret = (value) => { issuedSecret.value = value; secretVisible.value = true }
  const submitCreate = async () => {
    creating.value = true
    const result = await create({
      name: form.name.trim(), device_group_id: form.device_group_id,
      allowed_platforms: form.allowed_platforms, expires_at: now() + form.ttl, max_uses: form.max_uses,
    }).catch(() => false)
    creating.value = false
    if (!result) return
    createVisible.value = false
    revealSecret(result.data.code)
    await loadWorkspace()
  }
  const act = async (command, row) => {
    if (command === 'revoke') {
      const confirmed = await ElMessageBox.confirm(T('RevokeCodeConfirm'), { type: 'warning', confirmButtonText: T('RevokeCode'), cancelButtonText: T('Cancel') }).catch(() => false)
      if (!confirmed) return
      const result = await revoke({ id: row.id }).catch(() => false)
      if (result) { ElMessage.success(T('CodeRevoked')); await loadWorkspace() }
      return
    }
    const confirmed = await ElMessageBox.confirm(T('RotateCodeConfirm'), { type: 'warning', confirmButtonText: T('RotateCode'), cancelButtonText: T('Cancel') }).catch(() => false)
    if (!confirmed) return
    const result = await rotate({ id: row.id }).catch(() => false)
    if (result) { revealSecret(result.data.code); await loadWorkspace() }
  }
  const openAudit = async (row) => {
    auditTarget.value = row; auditEvents.value = []; auditVisible.value = true; auditLoading.value = true
    const result = await audit({ deployment_code_id: row.id, page: 1, page_size: 100 }).catch(() => false)
    if (result) auditEvents.value = result.data.list || []
    auditLoading.value = false
  }

  onMounted(loadWorkspace)
  onActivated(loadWorkspace)
</script>

<style scoped lang="scss">
  .deployment-page { padding-bottom: var(--yj-spacing-xxxl); }
  .enrollment-stage {
    display: grid; grid-template-columns: minmax(280px, .82fr) minmax(520px, 1.18fr); gap: var(--yj-spacing-xxxl);
    align-items: center; margin-bottom: var(--yj-spacing-xl); padding: 28px 32px; overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--yj-blue-400) 30%, var(--yj-border)); border-radius: var(--yj-radius-xl);
    background: linear-gradient(125deg, color-mix(in srgb, var(--yj-deep-navy) 94%, var(--yj-primary)) 0%, var(--yj-deep-navy) 62%, #122956 100%);
    color: var(--yj-text-inverse); box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
    &__kicker { color: var(--yj-cyan-300); font: 600 var(--yj-font-size-xs)/1 var(--yj-font-family-mono); letter-spacing: .14em; }
    h2 { margin: 10px 0 8px; color: #fff; font-size: 24px; letter-spacing: -.03em; }
    p { margin: 0; max-width: 520px; color: rgba(255,255,255,.66); line-height: 1.6; }
  }
  .trust-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border: 1px solid rgba(255,255,255,.14); border-radius: var(--yj-radius-sm); background: rgba(255,255,255,.05); color: rgba(255,255,255,.78); font: 500 11px/1 var(--yj-font-family-mono); white-space: nowrap; } }
  .enrollment-flow { display: grid; grid-template-columns: 1fr 42px 1fr 42px 1fr; align-items: center; }
  .flow-node { min-width: 0; padding: 16px; border: 1px solid rgba(255,255,255,.14); border-radius: var(--yj-radius-md); background: rgba(255,255,255,.045); &.is-active { border-color: rgba(91,225,255,.58); background: rgba(0,194,255,.1); } strong, small { display: block; } strong { margin: 16px 0 5px; color: #fff; font-size: 13px; } small { color: rgba(255,255,255,.48); font-size: 11px; } &__index { color: var(--yj-cyan-300); font: 600 11px/1 var(--yj-font-family-mono); } }
  .flow-connector { height: 1px; background: linear-gradient(90deg, rgba(91,225,255,.58), rgba(255,255,255,.16)); }
  .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--yj-spacing-md); margin-bottom: var(--yj-spacing-xl); }
  .metric-card { min-height: 118px; padding: 17px 18px; border: 1px solid var(--yj-border); border-radius: var(--yj-radius-lg); background: var(--yj-surface); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); span, small { display: block; } span { color: var(--yj-text-secondary); font-size: var(--yj-font-size-sm); font-weight: 600; } strong { display: block; margin: 10px 0 6px; color: var(--yj-text-primary); font: 600 28px/1 var(--yj-font-family-mono); letter-spacing: -.04em; } small { color: var(--yj-text-tertiary); font-size: 11px; } &.is-warning { border-color: color-mix(in srgb, var(--yj-warning) 42%, var(--yj-border)); } .el-link { margin-top: 4px; font-size: 11px; } }
  .deployment-list :deep(.el-card__body) { padding: 0; }
  .deployment-list__header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 19px 20px; border-bottom: 1px solid var(--yj-divider); h2 { margin: 4px 0 0; color: var(--yj-text-primary); font-size: 17px; letter-spacing: -.02em; } }
  .section-label { color: var(--yj-primary); font: 600 10px/1 var(--yj-font-family-mono); letter-spacing: .12em; }
  .inventory-legend { display: flex; gap: 18px; }
  .credential-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; code { min-width: 138px; padding: 7px 8px; border: 1px solid var(--yj-border); border-radius: var(--yj-radius-sm); background: var(--yj-surface-sunken); color: var(--yj-text-primary); font: 600 11px/1 var(--yj-font-family-mono); } strong, small { display: inline; } strong { color: var(--yj-text-primary); font-size: 13px; } small { margin-left: 6px; color: var(--yj-text-tertiary); font: 11px/1 var(--yj-font-family-mono); } }
  .scope-name { display: block; margin-bottom: 7px; color: var(--yj-text-primary); font-size: 13px; }
  .platform-list { display: flex; flex-wrap: wrap; gap: 4px; span { padding: 2px 5px; border-radius: 4px; background: var(--yj-surface-sunken); color: var(--yj-text-tertiary); font: 10px/1.3 var(--yj-font-family-mono); text-transform: uppercase; } }
  .usage-cell { width: 138px; span { display: block; margin-bottom: 6px; color: var(--yj-text-secondary); font: 12px/1 var(--yj-font-family-mono); } }
  .mono-value { display: block; color: var(--yj-text-primary); font: 11px/1.4 var(--yj-font-family-mono); }
  .time-caption { display: block; margin-top: 3px; color: var(--yj-text-tertiary); font-size: 11px; }
  .danger-text { color: var(--yj-danger); }
  .mobile-inventory { display: none; }
  .wizard-panel { min-height: 330px; padding: 28px 4px 4px; }
  .wizard-heading { margin-bottom: 22px; span { color: var(--yj-primary); font: 600 10px/1 var(--yj-font-family-mono); letter-spacing: .1em; } h3 { margin: 8px 0 6px; color: var(--yj-text-primary); font-size: 20px; } p { margin: 0; color: var(--yj-text-tertiary); line-height: 1.5; } }
  .platform-picker { display: grid; grid-template-columns: repeat(5, 1fr); width: 100%; :deep(.el-checkbox-button__inner) { width: 100%; } }
  .guardrail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 20px; label > span, label > small { display: block; } label > span { margin-bottom: 8px; color: var(--yj-text-secondary); font-size: 13px; font-weight: 600; } label > small { margin-top: 7px; color: var(--yj-text-tertiary); line-height: 1.4; } }
  .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; overflow: hidden; margin: 0; border: 1px solid var(--yj-border); border-radius: var(--yj-radius-md); background: var(--yj-border); div { padding: 14px 16px; background: var(--yj-surface); } dt { color: var(--yj-text-tertiary); font-size: 11px; } dd { margin: 6px 0 0; color: var(--yj-text-primary); font-size: 13px; font-weight: 600; } }
  .dialog-footer { display: flex; width: 100%; &__spacer { flex: 1; } }
  .secret-result { text-align: center; &__icon { display: grid; place-items: center; width: 52px; height: 52px; margin: 4px auto 14px; border-radius: 50%; background: var(--yj-success-subtle); color: var(--yj-success); } h3 { margin: 0; color: var(--yj-text-primary); font-size: 20px; } > p { margin: 8px auto 20px; max-width: 460px; color: var(--yj-text-tertiary); line-height: 1.5; } .el-alert { margin-top: 18px; text-align: left; } }
  .secret-code { display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--yj-border-strong); border-radius: var(--yj-radius-md); background: var(--yj-surface-sunken); code { flex: 1; color: var(--yj-text-primary); font: 600 18px/1 var(--yj-font-family-mono); letter-spacing: .04em; } }
  .audit-context { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 10px 12px; border-radius: var(--yj-radius-sm); background: var(--yj-surface-sunken); code { color: var(--yj-text-primary); font: 600 11px/1 var(--yj-font-family-mono); } span { color: var(--yj-text-secondary); font-size: 12px; } }
  .event-chip { display: inline-flex; padding: 4px 7px; border-radius: var(--yj-radius-sm); background: var(--yj-primary-subtle); color: var(--yj-primary); font-size: 11px; font-weight: 600; }
  @media (max-width: 1100px) { .enrollment-stage { grid-template-columns: 1fr; } .metric-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 760px) { .enrollment-stage { padding: 22px; } .enrollment-flow { grid-template-columns: 1fr; gap: 7px; } .flow-connector { width: 1px; height: 14px; margin-left: 24px; background: linear-gradient(180deg, rgba(91,225,255,.58), rgba(255,255,255,.16)); } .desktop-inventory { display: none; } .mobile-inventory { display: grid; gap: 10px; padding: 12px; } .mobile-code-card { padding: 15px; border: 1px solid var(--yj-border); border-radius: var(--yj-radius-md); background: var(--yj-surface); &__top, &__usage, &__actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; } code { color: var(--yj-text-primary); font: 600 11px/1 var(--yj-font-family-mono); } h3 { margin: 14px 0 5px; color: var(--yj-text-primary); font-size: 15px; } p { margin: 0 0 16px; color: var(--yj-text-tertiary); font-size: 12px; } &__usage { margin-bottom: 7px; color: var(--yj-text-secondary); font-size: 11px; strong { font-family: var(--yj-font-family-mono); } } &__actions { justify-content: flex-end; margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--yj-divider); } } .inventory-legend { display: none; } }
  @media (max-width: 560px) { .metric-grid { grid-template-columns: 1fr 1fr; gap: 8px; } .metric-card { min-height: 106px; padding: 14px; } .platform-picker { grid-template-columns: 1fr 1fr; } .guardrail-grid, .review-grid { grid-template-columns: 1fr; } .secret-code { flex-direction: column; code { padding: 5px 0; font-size: 14px; } .el-button { width: 100%; } } }
</style>
