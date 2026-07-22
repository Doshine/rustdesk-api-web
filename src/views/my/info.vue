<template>
  <div class="my-info">
    <el-card shadow="hover" class="info-card">
      <template #header>
        <div class="card-title">{{ T('Userinfo') }}</div>
      </template>
      <el-form class="info-form" ref="form" label-width="120px" label-suffix="：">
        <el-form-item :label="T('Username')">
          <div>{{ userStore.username }}</div>
        </el-form-item>
        <el-form-item :label="T('Email')">
          <div>{{ userStore.email }}</div>
        </el-form-item>
        <el-form-item :label="T('Password')" prop="password">
          <el-button type="danger" @click="showChangePwd">{{ T('ChangePassword') }}</el-button>
        </el-form-item>
        <el-form-item label="OIDC">
          <el-table :data="oidcData" border fit>
            <el-table-column :label="T('IdP')" prop="op" align="center"></el-table-column>
            <el-table-column :label="T('Status')" prop="status" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.status === 1" type="success">{{ T('HasBind') }}</el-tag>
                <el-tag v-else type="danger">{{ T('NoBind') }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="T('Actions')" align="center" width="200">
              <template #default="{ row }">
                <el-button v-if="row.status === 1" type="danger" size="small" @click="toUnBind(row)">{{ T('UnBind') }}</el-button>
                <el-button v-else type="success" size="small" @click="toBind(row)">{{ T('ToBind') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="hover" class="security-card">
      <template #header>
        <div class="security-heading">
          <div>
            <div class="card-title">{{ T('MfaSecurity') }}</div>
            <div class="security-subtitle">{{ T('MfaSecurityDescription') }}</div>
          </div>
          <el-tag :type="mfaEnabled ? 'success' : 'info'" effect="light">
            {{ mfaEnabled ? T('MfaEnabled') : T('MfaNotEnabled') }}
          </el-tag>
        </div>
      </template>
      <div class="security-body">
        <div class="security-copy">
          <div class="security-icon"><el-icon><Lock /></el-icon></div>
          <div>
            <div class="security-title">{{ mfaEnabled ? T('MfaEnabledTitle') : T('MfaNotEnabledTitle') }}</div>
            <div class="security-note">{{ mfaEnabled ? T('MfaEnabledHint') : T('MfaNotEnabledHint') }}</div>
          </div>
        </div>
        <el-button v-if="!mfaEnabled" type="primary" :loading="securityLoading" @click="beginMfaSetup">
          {{ T('EnableMfa') }}
        </el-button>
        <el-button v-else type="danger" plain @click="mfaDisableVisible = true">
          {{ T('DisableMfa') }}
        </el-button>
      </div>
    </el-card>
    <el-card v-if="passkeyAvailable" shadow="hover" class="security-card passkey-card">
      <template #header>
        <div class="security-heading">
          <div>
            <div class="card-title">{{ T('PasskeySecurity') }}</div>
            <div class="security-subtitle">{{ T('PasskeySecurityDescription') }}</div>
          </div>
          <el-tag type="success" effect="light">{{ passkeys.length }}</el-tag>
        </div>
      </template>
      <div class="passkey-actions">
        <el-button type="primary" :loading="passkeyLoading" @click="registerPasskey">{{ T('AddPasskey') }}</el-button>
      </div>
      <el-table v-if="passkeys.length" :data="passkeys" border fit>
        <el-table-column :label="T('PasskeyName')" prop="name" min-width="140">
          <template #default="{ row }">{{ row.name || T('PasskeyUnnamed') }}</template>
        </el-table-column>
        <el-table-column :label="T('PasskeyLastUsed')" prop="last_used_at" min-width="150">
          <template #default="{ row }">{{ row.last_used_at ? new Date(row.last_used_at * 1000).toLocaleString() : T('PasskeyNeverUsed') }}</template>
        </el-table-column>
        <el-table-column :label="T('Actions')" width="110" align="center">
          <template #default="{ row }">
            <el-button type="danger" link :loading="passkeyLoading" @click="revokePasskey(row)">{{ T('Revoke') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else :description="T('PasskeyEmpty')" :image-size="70" />
    </el-card>
    <el-card shadow="hover" class="hello-card">
      <div v-html="html"></div>
    </el-card>
    <changePwdDialog v-model:visible="changePwdVisible"></changePwdDialog>

    <el-dialog v-model="mfaSetupVisible" :title="T('MfaSetupTitle')" width="520px" destroy-on-close @closed="enrollment = null; verificationCode = ''">
      <el-steps :active="1" simple class="mfa-steps">
        <el-step :title="T('MfaSetupStep1')" />
        <el-step :title="T('MfaSetupStep2')" />
      </el-steps>
      <div v-if="enrollment" class="mfa-setup">
        <el-alert :title="T('MfaAuthenticatorHint')" type="info" :closable="false" show-icon />
        <div class="mfa-field">
          <div class="mfa-label">{{ T('MfaSecret') }}</div>
          <el-input :model-value="enrollment.secret" readonly>
            <template #append><el-button @click="copyText(enrollment.secret)">{{ T('Copy') }}</el-button></template>
          </el-input>
        </div>
        <div class="mfa-field">
          <div class="mfa-label">{{ T('MfaOtpAuthUrl') }}</div>
          <el-input :model-value="enrollment.otpauth_url" readonly />
        </div>
        <div class="backup-panel">
          <div class="mfa-label-row">
            <div class="mfa-label">{{ T('MfaBackupCodes') }}</div>
            <el-button text size="small" @click="copyText(enrollment.backup_codes.join('\n'))">{{ T('Copy') }}</el-button>
          </div>
          <div class="backup-grid">
            <code v-for="code in enrollment.backup_codes" :key="code">{{ code }}</code>
          </div>
          <div class="backup-hint">{{ T('MfaBackupCodesHint') }}</div>
        </div>
        <el-form class="verify-form" @submit.prevent>
          <el-form-item :label="T('MfaVerificationCode')">
            <el-input v-model="verificationCode" maxlength="6" inputmode="numeric" :placeholder="T('MfaCodePlaceholder')" clearable />
          </el-form-item>
          <el-button type="primary" :loading="securityLoading" @click="confirmMfaEnable">
            {{ T('ConfirmEnableMfa') }}
          </el-button>
        </el-form>
      </div>
    </el-dialog>

    <el-dialog v-model="mfaDisableVisible" :title="T('DisableMfa')" width="420px" destroy-on-close @closed="disableCode = ''; disablePassword = ''">
      <p class="disable-hint">{{ T('MfaDisableHint') }}</p>
      <el-form class="disable-form" @submit.prevent>
        <el-form-item :label="T('Password')">
          <el-input v-model="disablePassword" type="password" show-password :placeholder="T('MfaCurrentPassword')" clearable />
        </el-form-item>
        <el-form-item :label="T('MfaVerificationCode')">
          <el-input v-model="disableCode" maxlength="10" inputmode="text" autocomplete="one-time-code" :placeholder="T('MfaCodePlaceholder')" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mfaDisableVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="danger" :loading="securityLoading" @click="confirmMfaDisable">{{ T('DisableMfa') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import changePwdDialog from '@/components/changePwdDialog.vue'
  import { computed, ref } from 'vue'
  import { useUserStore } from '@/store/user'
  import { useAppStore } from '@/store/app'
  import { bind, unbind } from '@/api/oauth'
  import { mfaDisable, mfaEnable, mfaEnroll, myOauth } from '@/api/user'
  import { createPasskey, isPasskeySupported } from '@/utils/passkey'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { T } from '@/utils/i18n'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import { Lock } from '@element-plus/icons-vue'

  const appStore = useAppStore()
  const userStore = useUserStore()
  const changePwdVisible = ref(false)
  const mfaSetupVisible = ref(false)
  const mfaDisableVisible = ref(false)
  const enrollment = ref(null)
  const verificationCode = ref('')
  const disableCode = ref('')
  const disablePassword = ref('')
  const securityLoading = ref(false)
  const mfaEnabled = computed(() => Boolean(userStore.mfa_enabled))
  const passkeyAvailable = ref(false)
  const passkeys = ref([])
  const passkeyLoading = ref(false)
  const showChangePwd = () => {
    changePwdVisible.value = true
  }

  const beginMfaSetup = async () => {
    securityLoading.value = true
    const res = await mfaEnroll().catch(_ => false)
    securityLoading.value = false
    if (!res) return
    enrollment.value = res.data
    verificationCode.value = ''
    mfaSetupVisible.value = true
  }

  const confirmMfaEnable = async () => {
    if (!/^\d{6}$/.test(verificationCode.value)) {
      ElMessage.warning(T('MfaCodePlaceholder'))
      return
    }
    securityLoading.value = true
    const res = await mfaEnable({ code: verificationCode.value }).catch(_ => false)
    securityLoading.value = false
    if (!res) return
    mfaSetupVisible.value = false
    enrollment.value = null
    await userStore.info()
    ElMessage.success(T('MfaEnableSuccess'))
  }

  const confirmMfaDisable = async () => {
    const normalized = String(disableCode.value || '').replace(/[\s-]/g, '')
    if (!disablePassword.value) {
      ElMessage.warning(T('MfaCurrentPassword'))
      return
    }
    if (!/^(\d{6}|[a-fA-F0-9]{10})$/.test(normalized)) {
      ElMessage.warning(T('MfaCodePlaceholder'))
      return
    }
    securityLoading.value = true
    const res = await mfaDisable({ code: normalized, password: disablePassword.value }).catch(_ => false)
    securityLoading.value = false
    if (!res) return
    mfaDisableVisible.value = false
    disableCode.value = ''
    disablePassword.value = ''
    await userStore.info()
    ElMessage.success(T('MfaDisableSuccess'))
  }

  const getPasskeys = async () => {
    if (!isPasskeySupported()) return
    const res = await userStore.listPasskeys().catch(_ => false)
    if (res) {
      passkeys.value = res
      passkeyAvailable.value = true
    }
  }

  const registerPasskey = async () => {
    passkeyLoading.value = true
    try {
      const prompt = await ElMessageBox.prompt(T('PasskeyNamePrompt'), T('AddPasskey'), {
        confirmButtonText: T('Confirm'), cancelButtonText: T('Cancel'), inputValue: browserName(),
      }).catch(_ => false)
      if (!prompt) return
      const begin = await userStore.beginPasskeyRegistration()
      const credential = await createPasskey(begin)
      await userStore.completePasskeyRegistration({ challenge: begin.challenge, credential, name: prompt.value })
      await getPasskeys()
      ElMessage.success(T('PasskeyAdded'))
    } catch (err) {
      ElMessage.error(err?.message || T('PasskeyFailed'))
    } finally {
      passkeyLoading.value = false
    }
  }

  const revokePasskey = async (row) => {
    const confirmed = await ElMessageBox.confirm(T('PasskeyRevokeConfirm'), T('Revoke'), {
      confirmButtonText: T('Revoke'), cancelButtonText: T('Cancel'), type: 'warning',
    }).catch(_ => false)
    if (!confirmed) return
    passkeyLoading.value = true
    const res = await userStore.revokePasskey(row.id, { reason: 'self-service' }).catch(_ => false)
    passkeyLoading.value = false
    if (res) {
      await getPasskeys()
      ElMessage.success(T('PasskeyRevoked'))
    }
  }

  const browserName = () => {
    const ua = navigator.userAgent || ''
    if (/edg/i.test(ua)) return 'Edge'
    if (/chrome|crios/i.test(ua)) return 'Chrome'
    if (/firefox|fxios/i.test(ua)) return 'Firefox'
    if (/safari/i.test(ua)) return 'Safari'
    return 'Browser'
  }

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      ElMessage.success(T('Copied'))
    } catch (_) {
      ElMessage.warning(T('CopyFailed'))
    }
  }
  const oidcData = ref([])
  const getMyOauth = async () => {
    const res = await myOauth().catch(_ => false)
    if (res) {
      oidcData.value = res.data
    }

  }
  getMyOauth()
  getPasskeys()
  const toBind = async (row) => {
    const res = await bind({ op: row.op }).catch(_ => false)
    if (res) {
      const { code, url } = res.data
      window.open(url)
    }
  }
  const toUnBind = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('UnBind') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }
    const res = await unbind({ op: row.op }).catch(_ => false)
    if (res) {
      getMyOauth()
    }

  }

  const html = computed(_ => DOMPurify.sanitize(marked.parse(appStore.setting.hello || ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
  }))

</script>

<style scoped lang="scss">
.my-info {
  .info-card {
    .card-title {
      font-size: var(--yj-font-size-lg);
      font-weight: var(--yj-font-weight-semibold);
      color: var(--yj-text-primary);
    }
  }

  .hello-card {
    margin-top: var(--yj-spacing-lg);
  }

  .security-card {
    margin-top: var(--yj-spacing-lg);
  }
}

.security-heading,
.security-body,
.security-copy {
  display: flex;
  align-items: center;
}

.security-heading,
.security-body {
  justify-content: space-between;
  gap: var(--yj-spacing-lg);
}

.security-subtitle,
.security-note,
.disable-hint,
.backup-hint {
  color: var(--yj-text-tertiary);
  font-size: var(--yj-font-size-sm);
  line-height: var(--yj-line-height-relaxed);
}

.security-subtitle {
  margin-top: var(--yj-spacing-xs);
}

.security-icon {
  width: 42px;
  height: 42px;
  margin-right: var(--yj-spacing-md);
  border-radius: var(--yj-radius-lg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--yj-primary);
  background: var(--yj-primary-subtle);
  font-size: var(--yj-font-size-xl);
}

.security-title {
  color: var(--yj-text-primary);
  font-size: var(--yj-font-size-md);
  font-weight: var(--yj-font-weight-semibold);
}

.security-note {
  margin-top: var(--yj-spacing-xs);
}

.mfa-steps {
  margin-bottom: var(--yj-spacing-xl);
}

.mfa-setup {
  display: grid;
  gap: var(--yj-spacing-lg);
}

.mfa-label {
  margin-bottom: var(--yj-spacing-xs);
  color: var(--yj-text-secondary);
  font-size: var(--yj-font-size-sm);
  font-weight: var(--yj-font-weight-medium);
}

.mfa-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--yj-spacing-xs);
}

.mfa-label-row .mfa-label {
  margin-bottom: 0;
}

.backup-panel {
  padding: var(--yj-spacing-lg);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-lg);
  background: var(--yj-surface-hover);
}

.backup-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--yj-spacing-sm);
}

.backup-grid code {
  padding: var(--yj-spacing-sm) var(--yj-spacing-md);
  border-radius: var(--yj-radius-sm);
  background: var(--yj-surface);
  color: var(--yj-text-primary);
  font-family: var(--yj-font-family-mono);
  letter-spacing: 0.08em;
  text-align: center;
}

.backup-hint {
  margin-top: var(--yj-spacing-md);
}

.verify-form {
  display: grid;
  gap: var(--yj-spacing-sm);
}

.info-form {
  max-width: 640px;
  margin: 0 auto;

  :deep(.el-form-item) {
    margin-bottom: var(--yj-spacing-lg);
  }
}
</style>
