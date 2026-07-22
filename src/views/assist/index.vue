<template>
  <div class="assist-page control-page">
    <YjPageHeader
      eyebrow="HELPDESK"
      :title="T('AssistanceCenter')"
      :description="T('AssistanceCenterDescription')"
    >
      <template #status>
        <YjStatusDot
          :status="webClientEnabled ? 'online' : 'warning'"
          :text="webClientEnabled ? T('Online') : T('WebClientUnavailable')"
        />
      </template>
    </YjPageHeader>

    <section class="access-paths" :aria-label="T('SessionLauncherTitle')">
      <button
        type="button"
        class="access-path"
        :class="{ 'is-active': activeMode === 'temporary' }"
        @click="selectMode('temporary')"
      >
        <span class="access-path__index">01</span>
        <span class="access-path__icon"><Key /></span>
        <span class="access-path__copy">
          <strong>{{ T('TemporaryAssistance') }}</strong>
          <small>{{ T('TemporaryAssistanceDescription') }}</small>
        </span>
        <ArrowRight class="access-path__arrow" />
      </button>
      <button
        type="button"
        class="access-path"
        :class="{ 'is-active': activeMode === 'fixed' }"
        @click="selectMode('fixed')"
      >
        <span class="access-path__index">02</span>
        <span class="access-path__icon"><Monitor /></span>
        <span class="access-path__copy">
          <strong>{{ T('FixedDeviceAccess') }}</strong>
          <small>{{ T('FixedDeviceAccessDescription') }}</small>
        </span>
        <ArrowRight class="access-path__arrow" />
      </button>
    </section>

    <section class="assist-workbench">
      <div class="assist-workbench__main">
        <template v-if="activeMode === 'temporary'">
          <div class="workbench-heading">
            <span class="workbench-heading__icon"><Key /></span>
            <span>
              <strong>{{ T('StartTemporaryAssist') }}</strong>
              <small>{{ T('TemporaryAssistanceDescription') }}</small>
            </span>
          </div>

          <el-alert
            v-if="!webClientEnabled"
            type="warning"
            :title="T('WebClientUnavailable')"
            show-icon
            :closable="false"
          />

          <div v-if="!temporaryResult" class="assist-form">
            <el-form label-position="top" @submit.prevent="createTemporaryLink">
              <el-form-item :label="T('AssistanceDevice')" required>
                <el-select
                  v-model="temporaryForm.deviceId"
                  filterable
                  :loading="devicesLoading"
                  :placeholder="devicesLoading ? T('LoadingDevices') : (devices.length ? T('PleaseSelectData') : T('NoManagedDevices'))"
                  :disabled="devicesLoading || !devices.length"
                >
                  <el-option
                    v-for="device in devices"
                    :key="device.id"
                    :value="device.id"
                    :label="deviceLabel(device)"
                  >
                    <span class="device-option">
                      <span>{{ device.alias || device.hostname || device.username || device.id }}</span>
                      <span class="yj-mono">{{ device.id }}</span>
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>

              <div class="assist-form__row">
                <el-form-item :label="T('AssistanceCode')" required>
                  <el-input
                    v-model="temporaryForm.password"
                    type="password"
                    show-password
                    maxlength="32"
                    autocomplete="one-time-code"
                    :placeholder="T('AssistanceCodePlaceholder')"
                  />
                  <span class="field-hint">{{ T('AssistanceCodeHint') }}</span>
                </el-form-item>
                <el-form-item :label="T('AssistanceDuration')" required>
                  <el-select v-model="temporaryForm.expire">
                    <el-option
                      v-for="option in expireOptions"
                      :key="option.value"
                      :value="option.value"
                      :label="option.label"
                    />
                  </el-select>
                </el-form-item>
              </div>

              <div class="assist-form__actions">
                <el-button
                  type="primary"
                  native-type="submit"
                  :loading="creatingLink"
                  :disabled="!canCreateTemporaryLink"
                >
                  {{ T('CreateAssistanceLink') }}
                  <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                </el-button>
              </div>
            </el-form>
          </div>

          <div v-else class="assist-result" aria-live="polite">
            <div class="assist-result__mark"><CircleCheck /></div>
            <div class="assist-result__copy">
              <span class="assist-result__eyebrow">{{ T('AssistanceLinkReady') }}</span>
              <h2>{{ temporaryResult.deviceLabel }}</h2>
              <p>{{ T('AssistanceLinkReadyDescription') }}</p>
            </div>
            <div class="assist-result__link">
              <el-input :model-value="temporaryResult.url" readonly>
                <template #append>
                  <el-button :icon="CopyDocument" :aria-label="T('CopyLink')" @click="copyTemporaryLink" />
                </template>
              </el-input>
            </div>
            <div class="assist-result__meta">
              <span><Clock /> {{ T('LinkExpiresAt', { time: temporaryResult.expiresAt }) }}</span>
              <span><Lock /> {{ T('LinkSensitiveWarning') }}</span>
            </div>
            <div class="assist-result__actions">
              <el-button type="primary" @click="openTemporaryLink">
                {{ T('OpenLink') }}
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
              <el-button @click="resetTemporaryForm">{{ T('Create') }}</el-button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="workbench-heading">
            <span class="workbench-heading__icon"><Monitor /></span>
            <span>
              <strong>{{ T('OpenFixedAccess') }}</strong>
              <small>{{ T('FixedDeviceAccessDescription') }}</small>
            </span>
          </div>
          <div class="fixed-access">
            <label for="fixed-device-id">{{ T('Id') }}</label>
            <div class="fixed-access__input">
              <el-input
                id="fixed-device-id"
                v-model="fixedDeviceId"
                class="yj-mono"
                clearable
                :placeholder="T('FixedIdPlaceholder')"
                @keyup.enter="connectNative"
              />
              <el-button type="primary" :disabled="!normalizedFixedDeviceId" @click="connectNative">
                {{ T('NativeClientConnect') }}
              </el-button>
              <el-button
                :disabled="!normalizedFixedDeviceId || !webClientEnabled"
                @click="connectBrowser"
              >
                {{ T('BrowserConnect') }}
              </el-button>
            </div>
          </div>
        </template>
      </div>

      <aside class="trust-panel">
        <div class="trust-panel__heading">
          <span>{{ T('AssistanceSecurityTitle') }}</span>
          <Lock />
        </div>
        <ol>
          <li>
            <span>01</span>
            <p>{{ T('AssistanceSecurityCredential') }}</p>
          </li>
          <li>
            <span>02</span>
            <p>{{ T('AssistanceSecurityExpiry') }}</p>
          </li>
          <li>
            <span>03</span>
            <p>{{ T('AssistanceSecurityRevoke') }}</p>
          </li>
        </ol>
      </aside>
    </section>

    <section class="recent-assistance">
      <div class="section-heading">
        <div>
          <span>ACCESS LOG</span>
          <h2>{{ T('RecentAssistance') }}</h2>
        </div>
        <el-button text :icon="RefreshRight" :loading="recentLoading" @click="loadRecent">
          {{ T('Refresh') }}
        </el-button>
      </div>
      <div v-if="recentLoading" class="recent-loading" aria-hidden="true">
        <el-skeleton :rows="3" animated />
      </div>
      <YjEmpty v-else-if="!recentLinks.length" :description="T('NoRecentAssistance')" />
      <div v-else class="recent-list">
        <div v-for="item in recentLinks" :key="item.id" class="recent-row">
          <YjStatusDot
            :status="isExpired(item) ? 'offline' : 'online'"
            :text="isExpired(item) ? T('Expired') : T('Active')"
          />
          <span class="recent-row__device yj-mono">{{ item.peer_id }}</span>
          <span class="recent-row__time">{{ formatCreatedAt(item.created_at) }}</span>
          <span class="recent-row__expiry">{{ formatExpiry(item) }}</span>
          <el-button text type="danger" :disabled="isExpired(item)" @click="revokeLink(item)">
            {{ T('RevokeLink') }}
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ArrowRight, CircleCheck, Clock, CopyDocument, Key, Lock, Monitor, RefreshRight } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { list as addressBookList } from '@/api/my/address_book'
  import { list as shareRecordList, remove as removeShareRecord } from '@/api/my/share_record'
  import { shareByWebClient } from '@/api/address_book'
  import YjEmpty from '@/components/yj/YjEmpty.vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'
  import { useAppStore } from '@/store/app'
  import { T } from '@/utils/i18n'
  import { handleClipboard } from '@/utils/clipboard'
  import { connectByClient } from '@/utils/peer'
  import { getV2ShareUrl, toWebClientLink } from '@/utils/webclient'

  const route = useRoute()
  const router = useRouter()
  const appStore = useAppStore()
  const activeMode = ref(route.query.mode === 'fixed' ? 'fixed' : 'temporary')
  const webClientEnabled = computed(() => Boolean(appStore.setting.appConfig.web_client))

  const selectMode = (mode) => {
    activeMode.value = mode
    router.replace({ query: { ...route.query, mode } })
  }

  const devices = ref([])
  const devicesLoading = ref(false)
  const loadDevices = async () => {
    devicesLoading.value = true
    const res = await addressBookList({ page: 1, page_size: 200 }).catch(() => false)
    devicesLoading.value = false
    if (res) devices.value = res.data.list || []
  }
  const deviceLabel = (device) => {
    const name = device.alias || device.hostname || device.username
    return name ? `${name} · ${device.id}` : device.id
  }

  const temporaryForm = reactive({ deviceId: '', password: '', expire: 1800 })
  const creatingLink = ref(false)
  const temporaryResult = ref(null)
  const expireOptions = computed(() => [
    { value: 300, label: T('Minutes', { param: 5 }, 5) },
    { value: 900, label: T('Minutes', { param: 15 }, 15) },
    { value: 1800, label: T('Minutes', { param: 30 }, 30) },
    { value: 3600, label: T('Hours', { param: 1 }, 1) },
  ])
  const canCreateTemporaryLink = computed(() =>
    webClientEnabled.value &&
    temporaryForm.deviceId &&
    temporaryForm.password.trim().length >= 4 &&
    !creatingLink.value)

  const createTemporaryLink = async () => {
    if (!canCreateTemporaryLink.value) return
    creatingLink.value = true
    const password = temporaryForm.password.trim()
    const res = await shareByWebClient({
      id: temporaryForm.deviceId,
      password_type: 'once',
      password,
      expire: temporaryForm.expire,
    }).catch(() => false)
    creatingLink.value = false
    if (!res) return

    const device = devices.value.find(item => item.id === temporaryForm.deviceId)
    temporaryResult.value = {
      url: getV2ShareUrl(res.data.share_token),
      deviceLabel: device ? deviceLabel(device) : temporaryForm.deviceId,
      expiresAt: new Date(Date.now() + temporaryForm.expire * 1000).toLocaleString(),
    }
    temporaryForm.password = ''
    loadRecent()
  }
  const resetTemporaryForm = () => {
    temporaryResult.value = null
    temporaryForm.password = ''
  }
  const copyTemporaryLink = (event) => handleClipboard(temporaryResult.value.url, event)
  const openTemporaryLink = () => window.open(temporaryResult.value.url, '_blank', 'noopener,noreferrer')

  const fixedDeviceId = ref('')
  const normalizedFixedDeviceId = computed(() => fixedDeviceId.value.trim())
  const connectNative = () => {
    if (normalizedFixedDeviceId.value) connectByClient(normalizedFixedDeviceId.value)
  }
  const connectBrowser = () => {
    if (normalizedFixedDeviceId.value && webClientEnabled.value) {
      toWebClientLink({ id: normalizedFixedDeviceId.value })
    }
  }

  const recentLinks = ref([])
  const recentLoading = ref(false)
  const loadRecent = async () => {
    recentLoading.value = true
    const res = await shareRecordList({ page: 1, page_size: 5 }).catch(() => false)
    recentLoading.value = false
    if (res) recentLinks.value = res.data.list || []
  }
  const expiresAt = (item) => item.expire
    ? new Date(new Date(item.created_at).getTime() + item.expire * 1000)
    : null
  const isExpired = (item) => {
    const expiry = expiresAt(item)
    return expiry ? expiry.getTime() <= Date.now() : false
  }
  const formatCreatedAt = (value) => new Date(value).toLocaleString()
  const formatExpiry = (item) => {
    const expiry = expiresAt(item)
    return expiry ? expiry.toLocaleString() : T('Forever')
  }
  const revokeLink = async (item) => {
    const confirmed = await ElMessageBox.confirm(T('Confirm?', { param: T('RevokeLink') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(() => false)
    if (!confirmed) return
    const res = await removeShareRecord({ id: item.id }).catch(() => false)
    if (res) {
      ElMessage.success(T('LinkRevoked'))
      loadRecent()
    }
  }

  onMounted(() => {
    loadDevices()
    loadRecent()
  })
</script>

<style scoped lang="scss">
  .assist-page {
    padding-bottom: var(--yj-spacing-section);
  }

  .access-paths {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--yj-spacing-lg);
    margin-bottom: var(--yj-spacing-xl);
  }

  .access-path {
    position: relative;
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--yj-spacing-lg);
    min-height: 116px;
    padding: var(--yj-spacing-xl);
    border: 1px solid var(--yj-border);
    border-radius: var(--yj-radius-lg);
    background: var(--yj-surface);
    color: var(--yj-text-primary);
    text-align: left;
    cursor: pointer;
    transition: border-color var(--yj-duration-fast) var(--yj-easing-standard),
      background-color var(--yj-duration-fast) var(--yj-easing-standard),
      transform var(--yj-duration-fast) var(--yj-easing-standard);

    &:hover {
      border-color: var(--yj-border-strong);
      transform: translateY(-1px);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--yj-focus-ring);
    }

    &.is-active {
      border-color: var(--yj-primary);
      background: color-mix(in srgb, var(--yj-primary-subtle) 60%, var(--yj-surface));

      .access-path__icon,
      .access-path__arrow {
        color: var(--yj-primary);
      }
    }
  }

  .access-path__index {
    align-self: start;
    color: var(--yj-text-tertiary);
    font-family: var(--yj-font-family-mono);
    font-size: var(--yj-font-size-xs);
  }

  .access-path__icon,
  .workbench-heading__icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--yj-border);
    border-radius: var(--yj-radius-md);
    background: var(--yj-surface-raised);
    color: var(--yj-text-secondary);

    svg {
      width: 19px;
      height: 19px;
    }
  }

  .access-path__copy {
    display: grid;
    gap: var(--yj-spacing-xs);

    strong {
      font-size: var(--yj-font-size-lg);
      line-height: var(--yj-line-height-tight);
    }

    small {
      color: var(--yj-text-secondary);
      font-size: var(--yj-font-size-base);
      line-height: var(--yj-line-height-base);
    }
  }

  .access-path__arrow {
    width: 20px;
    color: var(--yj-text-tertiary);
  }

  .assist-workbench {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 296px;
    overflow: hidden;
    border: 1px solid var(--yj-border);
    border-radius: var(--yj-radius-lg);
    background: var(--yj-surface);
  }

  .assist-workbench__main {
    min-height: 430px;
    padding: var(--yj-spacing-xxxl);
  }

  .workbench-heading {
    display: flex;
    align-items: center;
    gap: var(--yj-spacing-lg);
    padding-bottom: var(--yj-spacing-xl);
    margin-bottom: var(--yj-spacing-xxl);
    border-bottom: 1px solid var(--yj-divider);

    > span:last-child {
      display: grid;
      gap: var(--yj-spacing-xs);
    }

    strong {
      color: var(--yj-text-primary);
      font-size: var(--yj-font-size-title-l);
    }

    small {
      color: var(--yj-text-secondary);
      font-size: var(--yj-font-size-base);
    }
  }

  .assist-form {
    max-width: 720px;
  }

  .assist-form__row {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(180px, .55fr);
    gap: var(--yj-spacing-lg);
  }

  .assist-form :deep(.el-select) {
    width: 100%;
  }

  .field-hint {
    display: block;
    margin-top: var(--yj-spacing-sm);
    color: var(--yj-text-tertiary);
    font-size: var(--yj-font-size-sm);
    line-height: var(--yj-line-height-base);
  }

  .assist-form__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--yj-spacing-sm);
  }

  .device-option {
    display: flex;
    justify-content: space-between;
    gap: var(--yj-spacing-xl);
    width: 100%;

    .yj-mono {
      color: var(--yj-text-tertiary);
    }
  }

  .assist-result {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--yj-spacing-lg) var(--yj-spacing-xl);
    max-width: 760px;
    padding-top: var(--yj-spacing-lg);
  }

  .assist-result__mark {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: var(--yj-radius-full);
    background: var(--yj-success-subtle);
    color: var(--yj-success);

    svg {
      width: 26px;
      height: 26px;
    }
  }

  .assist-result__copy {
    h2 {
      margin: var(--yj-spacing-xs) 0;
      color: var(--yj-text-primary);
      font-size: var(--yj-font-size-h3);
    }

    p {
      margin: 0;
      color: var(--yj-text-secondary);
      line-height: var(--yj-line-height-base);
    }
  }

  .assist-result__eyebrow,
  .section-heading span {
    color: var(--yj-primary);
    font-family: var(--yj-font-family-mono);
    font-size: var(--yj-font-size-xs);
    font-weight: var(--yj-font-weight-semibold);
    letter-spacing: var(--yj-letter-spacing-section-label);
  }

  .assist-result__link,
  .assist-result__meta,
  .assist-result__actions {
    grid-column: 1 / -1;
  }

  .assist-result__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--yj-spacing-md) var(--yj-spacing-xl);
    color: var(--yj-text-secondary);
    font-size: var(--yj-font-size-sm);

    span {
      display: inline-flex;
      align-items: center;
      gap: var(--yj-spacing-sm);
    }

    svg {
      width: 15px;
    }
  }

  .fixed-access {
    max-width: 760px;

    label {
      display: block;
      margin-bottom: var(--yj-spacing-sm);
      color: var(--yj-text-secondary);
      font-size: var(--yj-font-size-base);
      font-weight: var(--yj-font-weight-medium);
    }
  }

  .fixed-access__input {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: var(--yj-spacing-sm);
  }

  .trust-panel {
    padding: var(--yj-spacing-xxxl) var(--yj-spacing-xxl);
    border-left: 1px solid var(--yj-border);
    background: var(--yj-deep-navy);
    color: var(--yj-text-inverse);
  }

  .trust-panel__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--yj-spacing-lg);
    padding-bottom: var(--yj-spacing-xl);
    border-bottom: 1px solid rgba(255, 255, 255, .14);
    font-size: var(--yj-font-size-lg);
    font-weight: var(--yj-font-weight-semibold);

    svg {
      width: 18px;
      color: var(--yj-accent);
    }
  }

  .trust-panel ol {
    display: grid;
    gap: 0;
    padding: 0;
    margin: 0;
    list-style: none;

    li {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--yj-spacing-md);
      padding: var(--yj-spacing-xl) 0;
      border-bottom: 1px solid rgba(255, 255, 255, .1);
    }

    span {
      color: var(--yj-accent);
      font-family: var(--yj-font-family-mono);
      font-size: var(--yj-font-size-xs);
    }

    p {
      margin: 0;
      color: rgba(255, 255, 255, .72);
      font-size: var(--yj-font-size-sm);
      line-height: var(--yj-line-height-relaxed);
    }
  }

  .recent-assistance {
    margin-top: var(--yj-spacing-xxl);
    padding: var(--yj-spacing-xxl);
    border: 1px solid var(--yj-border);
    border-radius: var(--yj-radius-lg);
    background: var(--yj-surface);
  }

  .section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--yj-spacing-lg);
    padding-bottom: var(--yj-spacing-lg);
    border-bottom: 1px solid var(--yj-divider);

    h2 {
      margin: var(--yj-spacing-xs) 0 0;
      color: var(--yj-text-primary);
      font-size: var(--yj-font-size-xl);
    }
  }

  .recent-loading {
    padding: var(--yj-spacing-xl) 0 0;
  }

  .recent-list {
    display: grid;
  }

  .recent-row {
    display: grid;
    grid-template-columns: 110px minmax(120px, 1fr) 180px 180px auto;
    align-items: center;
    gap: var(--yj-spacing-lg);
    min-height: 58px;
    border-bottom: 1px solid var(--yj-divider);
    color: var(--yj-text-secondary);
    font-size: var(--yj-font-size-sm);

    &:last-child {
      border-bottom: 0;
    }
  }

  .recent-row__device {
    color: var(--yj-text-primary);
    font-weight: var(--yj-font-weight-medium);
  }

  @media (max-width: 1024px) {
    .assist-workbench {
      grid-template-columns: 1fr;
    }

    .trust-panel {
      border-top: 1px solid var(--yj-border);
      border-left: 0;
    }

    .trust-panel ol {
      grid-template-columns: repeat(3, 1fr);

      li {
        padding-right: var(--yj-spacing-lg);
        border-right: 1px solid rgba(255, 255, 255, .1);
        border-bottom: 0;
      }
    }

    .recent-row {
      grid-template-columns: 100px 1fr 160px auto;
    }

    .recent-row__time {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .access-paths {
      grid-template-columns: 1fr;
    }

    .access-path {
      min-height: 96px;
      padding: var(--yj-spacing-lg);
    }

    .assist-workbench__main,
    .trust-panel,
    .recent-assistance {
      padding: var(--yj-spacing-lg);
    }

    .assist-form__row,
    .fixed-access__input,
    .trust-panel ol {
      grid-template-columns: 1fr;
    }

    .fixed-access__input .el-button {
      width: 100%;
      margin-left: 0;
    }

    .trust-panel ol li {
      border-right: 0;
      border-bottom: 1px solid rgba(255, 255, 255, .1);
    }

    .recent-row {
      grid-template-columns: 92px 1fr auto;
      gap: var(--yj-spacing-sm);
      padding: var(--yj-spacing-md) 0;
    }

    .recent-row__expiry,
    .recent-row__time {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .access-path {
      transition: none;
    }

    .access-path:hover {
      transform: none;
    }
  }
</style>
