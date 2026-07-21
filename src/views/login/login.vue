<template>
  <div class="login-page">
    <!-- 左侧深空品牌区（桌面 42%；移动端折叠为 88px 顶部 Logo 条） -->
    <aside class="brand-pane">
      <div class="brand-inner">
        <!-- 占位鲸 Logo：正式品牌资产到位后仅替换资源文件（实施方案 R6） -->
        <img src="@/assets/brand-logo.png" alt="蓝鲸银河" class="brand-logo"/>
        <h1 class="brand-name">蓝鲸银河</h1>
        <p class="brand-slogan">深空可信 · 通透连接 · 克制高效</p>
        <ul class="brand-points">
          <li>跨平台远程桌面，随时随地安全接入</li>
          <li>端到端加密通信，支持私有化部署</li>
          <li>设备、用户与会话的统一管理</li>
        </ul>
      </div>
      <!-- 银河三段渐变点缀 -->
      <div class="brand-glow brand-glow-a"></div>
      <div class="brand-glow brand-glow-b"></div>
      <div class="brand-glow-bar"></div>
    </aside>

    <!-- 右侧登录区（桌面 58%，内容最大宽 420px） -->
    <main class="form-pane">
      <div class="login-card">
        <div class="card-head">
          <img src="@/assets/brand-logo.png" alt="蓝鲸银河" class="card-logo"/>
          <h2 class="card-title">蓝鲸银河管理后台</h2>
          <p class="card-subtitle">登录以管理你的设备与远程会话</p>
        </div>

        <!-- 认证服务异常：页内警示条（3px severity 左边条），不使用裸 500 toast -->
        <div v-if="pageAlert" class="page-alert" role="alert">
          <span class="page-alert-text">{{ pageAlert }}</span>
          <button type="button" class="page-alert-close" aria-label="close" @click="pageAlert = ''">×</button>
        </div>

        <el-tabs v-if="!disablePwd" v-model="activeTab" class="login-tabs">
          <el-tab-pane :label="T('AccountLogin')" name="account">
            <!-- 账号密码登录 -->
            <el-form v-if="accountMode === 'pwd'" label-position="top" class="login-form" @submit.prevent>
              <el-form-item :label="T('Username')" :error="errors.username">
                <el-input v-model="form.username" type="username" class="login-input"
                          @input="errors.username = ''"></el-input>
              </el-form-item>
              <el-form-item :label="T('Password')" :error="errors.password">
                <el-input v-model="form.password" type="password" show-password class="login-input"
                          @input="errors.password = ''" @keyup.enter="login"></el-input>
              </el-form-item>
              <el-form-item :label="T('Captcha')" v-if="captchaCode" :error="errors.captcha">
                <el-input v-model="form.captcha" class="login-input captcha-input"
                          @input="errors.captcha = ''" @keyup.enter="login">
                  <template #append>
                    <img :src="captchaCode.b64" @click="loadCaptcha" class="captcha" alt="captcha"/>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-button @click="login" type="primary" class="login-button" :loading="loading">
                  {{ T('Login') }}
                </el-button>
                <el-button v-if="allowRegister" @click="register" class="login-button register-btn">
                  {{ T('Register') }}
                </el-button>
              </el-form-item>
              <div class="form-switch">
                <el-link type="primary" :underline="false" @click="accountMode = 'sms'">
                  {{ T('UseSmsLogin') }}
                </el-link>
              </div>
            </el-form>

            <!-- 短信验证码登录（账号登录 tab 内的子模式，功能保持原样） -->
            <el-form v-else label-position="top" class="login-form" @submit.prevent>
              <el-form-item :label="T('Phone')" :error="errors.phone">
                <el-input v-model="smsForm.phone" maxlength="11" class="login-input"
                          @input="errors.phone = ''"></el-input>
              </el-form-item>
              <el-form-item :label="T('Captcha')" v-if="captchaCode" :error="errors.smsCaptcha">
                <el-input v-model="smsForm.captcha" class="login-input captcha-input"
                          @input="errors.smsCaptcha = ''">
                  <template #append>
                    <img :src="captchaCode.b64" @click="loadCaptcha" class="captcha" alt="captcha"/>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item :label="T('SmsCode')" :error="errors.code">
                <el-input v-model="smsForm.code" class="login-input code-input"
                          @input="errors.code = ''" @keyup.enter="loginBySms">
                  <template #append>
                    <el-button @click="sendSmsCode" :disabled="smsCountdown > 0" class="sms-send-btn">
                      {{ smsCountdown > 0 ? T('ResendIn', { s: smsCountdown }) : T('SendSmsCode') }}
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-button @click="loginBySms" type="primary" class="login-button" :loading="loading">
                  {{ T('Login') }}
                </el-button>
              </el-form-item>
              <div class="form-switch">
                <el-link type="primary" :underline="false" @click="accountMode = 'pwd'">
                  {{ T('UsePwdLogin') }}
                </el-link>
              </div>
            </el-form>
          </el-tab-pane>

          <!-- 微信扫码：复用既有 wechat OIDC 通道 -->
          <el-tab-pane :label="T('WechatLogin')" name="wechat">
            <div v-if="hasWechat" class="wechat-pane">
              <div class="wechat-qr-box">
                <img :src="wechatImage" alt="wechat" class="wechat-qr-icon"/>
              </div>
              <p class="wechat-tip">{{ T('WechatScanTip') }}</p>
              <el-button type="primary" class="login-button" @click="startWechatLogin">
                {{ T('WechatLogin') }}
              </el-button>
            </div>
            <div v-else class="wechat-empty">{{ T('WechatNotConfigured') }}</div>
          </el-tab-pane>
        </el-tabs>

        <div class="divider" v-if="oidcList.length > 0 && !disablePwd">
          <span>{{ T('or login in with') }}</span>
        </div>

        <div class="oidc-options">
          <div v-for="(option, index) in oidcList" :key="index" class="oidc-option">
            <el-button @click="handleOIDCLogin(option.name)" class="oidc-btn">
              <img :src="getProviderImage(option.name)" alt="provider" class="oidc-icon"/>
              <span>{{ T(option.name) }}</span>
            </el-button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { reactive, computed, onMounted, onUnmounted, ref } from 'vue'
  import { useUserStore } from '@/store/user'
  import { ElMessage } from 'element-plus'
  import { T } from '@/utils/i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { loginOptions, captcha, smsCode } from '@/api/login'
  import { getCode, removeCode } from '@/utils/auth'

  const oauthInfo = ref({})
  const userStore = useUserStore()
  const route = useRoute()
  const router = useRouter()
  const options = reactive([]) // 存储 OIDC 登录选项

  let platform = window.navigator.platform
  if (navigator.platform.indexOf('Mac') === 0) {
    platform = 'mac'
  } else if (navigator.platform.indexOf('Win') === 0) {
    platform = 'windows'
  } else if (navigator.platform.indexOf('Linux armv') === 0) {
    platform = 'android'
  } else if (navigator.platform.indexOf('Linux') === 0) {
    platform = 'linux'
  }
  const userAgent = navigator.userAgent
  let browser = 'Unknown Browser'
  if (/chrome|crios/i.test(userAgent)) browser = 'Chrome'
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox'
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari'
  else if (/edg/i.test(userAgent)) browser = 'Edge'

  const form = reactive({
    username: '',
    password: '',
    platform: platform,
    captcha: '',
    captcha_id: ''
  })

  const activeTab = ref('account')
  const accountMode = ref('pwd') // 账号登录 tab 内：pwd 密码 / sms 短信验证码
  const smsForm = reactive({
    phone: '',
    code: '',
    captcha: '',
    captcha_id: ''
  })
  const smsCountdown = ref(0)
  let smsTimer = null
  const phoneReg = /^1[3-9]\d{9}$/

  // 字段级行内错误 + 页内服务异常警示条
  const errors = reactive({ username: '', password: '', captcha: '', phone: '', smsCaptcha: '', code: '' })
  const pageAlert = ref('')
  const loading = ref(false)

  const captchaCode = ref('')
  const redirect = route.query?.redirect

  // 服务级异常（网络错误 / 5xx）走页内警示条；业务错误（数字 code）行内展示
  const isServiceError = (e) => {
    if (!e) return false
    if (e.isAxiosError) return true
    if (typeof e.code === 'string') return true
    if (typeof e.code === 'number' && e.code >= 500) return true
    return false
  }

  const login = async () => {
    errors.username = form.username ? '' : T('ParamRequired', { param: T('Username') })
    errors.password = form.password ? '' : T('ParamRequired', { param: T('Password') })
    errors.captcha = captchaCode.value && !form.captcha
      ? T('ParamRequired', { param: T('Captcha') })
      : ''
    if (errors.username || errors.password || errors.captcha) return
    pageAlert.value = ''
    loading.value = true
    const res = await userStore.login(form).catch(e => e)
    loading.value = false
    if (res && !res.code) {
      ElMessage.success(T('LoginSuccess'))
      router.push({ path: redirect || '/', replace: true })
      return
    }
    if (res.code === 110) {
      // need captcha
      loadCaptcha()
      errors.captcha = res.message || T('ParamRequired', { param: T('Captcha') })
      return
    }
    if (isServiceError(res)) {
      pageAlert.value = T('AuthServiceUnavailable')
      return
    }
    errors.password = res.message || T('Error')
  }

  const sendSmsCode = async () => {
    if (smsCountdown.value > 0) return
    if (!phoneReg.test(smsForm.phone)) {
      errors.phone = T('InvalidPhone')
      return
    }
    pageAlert.value = ''
    const res = await smsCode({
      phone: smsForm.phone,
      captcha: smsForm.captcha,
      captcha_id: smsForm.captcha_id,
    }).catch(e => e)
    if (res.code === 110) {
      // need captcha
      loadCaptcha()
      return
    }
    if (isServiceError(res)) {
      pageAlert.value = T('AuthServiceUnavailable')
      return
    }
    if (res.code) {
      errors.code = res.message || T('Error')
      return
    }
    ElMessage.success(T('SmsSendSuccess'))
    smsForm.captcha = ''
    smsCountdown.value = 60
    smsTimer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(smsTimer)
        smsTimer = null
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (smsTimer) clearInterval(smsTimer)
  })

  const loginBySms = async () => {
    errors.phone = phoneReg.test(smsForm.phone) ? '' : T('InvalidPhone')
    errors.code = smsForm.code ? '' : T('ParamRequired', { param: T('SmsCode') })
    if (errors.phone || errors.code) return
    pageAlert.value = ''
    loading.value = true
    const res = await userStore.loginBySms({
      phone: smsForm.phone,
      code: smsForm.code,
      platform: platform,
    }).catch(e => e)
    loading.value = false
    if (res && !res.code) {
      ElMessage.success(T('LoginSuccess'))
      router.push({ path: redirect || '/', replace: true })
      return
    }
    if (isServiceError(res)) {
      pageAlert.value = T('AuthServiceUnavailable')
      return
    }
    errors.code = res.message || T('Error')
  }

  const loadCaptcha = async () => {
    const captchaRes = await captcha().catch(_ => false)
    if (!captchaRes || !captchaRes.data) {
      pageAlert.value = T('AuthServiceUnavailable')
      return
    }
    captchaCode.value = captchaRes.data.captcha
    form.captcha_id = captchaRes.data.captcha.id
    smsForm.captcha_id = captchaRes.data.captcha.id
  }

  const handleOIDCLogin = (provider) => {
    userStore.oidc(provider, platform, browser)
  }

  import googleImage from '@/assets/google.png'
  import githubImage from '@/assets/github.png'
  import oidcImage from '@/assets/oidc.png'
  import webauthImage from '@/assets/webauth.png'
  import wechatImage from '@/assets/wechat.svg'
  import defaultImage from '@/assets/oidc.png'

  const providerImageMap = {
    google: googleImage,
    github: githubImage,
    oidc: oidcImage,
    wechat: wechatImage,
    // WebAuth: webauthImage,
    default: defaultImage,
  }

  const getProviderImage = (provider) => {
    return providerImageMap[provider.toLowerCase()] || providerImageMap.default
  }

  // 微信扫码通道来自既有 OIDC ops 配置；disablePwd 时全部走第三方列表
  const hasWechat = computed(() => options.some(o => o.name.toLowerCase() === 'wechat'))
  const oidcList = computed(() =>
    disablePwd.value ? options : options.filter(o => o.name.toLowerCase() !== 'wechat'))
  const startWechatLogin = () => handleOIDCLogin('wechat')

  const allowRegister = ref(false)
  const disablePwd = ref(false)
  const loadLoginOptions = async () => {
    try {
      const res = await loginOptions().catch(_ => false)
      if (!res || !res.data) {
        console.error('No valid response received')
        pageAlert.value = T('AuthServiceUnavailable')
        return
      }
      res.data.ops.map(option => (options.push({ name: option }))) // 创建新的对象数组
      if (res.data.auto_oidc) {
        // 如果有自动OIDC登录选项，直接调用第一个
        handleOIDCLogin(res.data.ops[0])
      }
      disablePwd.value = res.data.disable_pwd
      allowRegister.value = res.data.register
      if (res.data.need_captcha) {
        loadCaptcha()
      }
    } catch (error) {
      console.error('Error loading login options:', error.message)
      pageAlert.value = T('AuthServiceUnavailable')
    }
  }

  onMounted(async () => {
    const code = getCode()
    if (code) {
      // 如果code存在，进行query获取user info
      const res = await userStore.query(code)
      if (res) {
        // 删除code，确保跳转之前对code进行清楚
        removeCode()
        ElMessage.success(T('LoginSuccess'))
        router.push({ path: redirect || '/', replace: true })
      }
    } else {
      // 如果code不存在, 现实登陆页面
      loadLoginOptions() // 组件挂载后调用登录选项加载函数
    }
  })

  const register = () => {
    router.push('/register')
  }
</script>

<style scoped lang="scss">
/* 页面级 token：值取自规范 v2.1 §1 深空色板 / §2.3-A，待 WS0 并入全局 tokens.css 后切换 */
.login-page {
  --yj-login-deep: #0F1420;                    /* 深空 Canvas */
  --yj-login-deep-raised: #141B2A;             /* 深空 Surface */
  --yj-login-text-hi: #F2F6FC;                 /* 深空 Text Primary */
  --yj-login-text-lo: #AAB7CA;                 /* 深空 Text Secondary */
  --yj-login-galaxy: linear-gradient(120deg, #102647 0%, #2F80FF 55%, #00C2FF 100%);

  display: flex;
  min-height: 100vh;
  background: var(--yj-bg);
}

/* ============ 左侧深空品牌区 42% ============ */
.brand-pane {
  position: relative;
  flex: 0 0 42%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--yj-login-deep);
}

.brand-inner {
  position: relative;
  z-index: 1;
  max-width: 380px;
  padding: var(--yj-spacing-page);
}

.brand-logo {
  width: 96px;
  height: 96px;
  display: block;
  margin-bottom: var(--yj-spacing-xl);
}

.brand-name {
  margin: 0 0 var(--yj-spacing-sm);
  font-size: var(--yj-font-size-display);
  font-weight: var(--yj-font-weight-bold);
  letter-spacing: -0.02em;
  color: var(--yj-login-text-hi);
}

.brand-slogan {
  margin: 0 0 var(--yj-spacing-xxxl);
  font-size: var(--yj-font-size-lg);
  color: var(--yj-login-text-lo);
}

.brand-points {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    position: relative;
    padding-left: 18px;
    margin-bottom: var(--yj-spacing-lg);
    font-size: var(--yj-font-size-md);
    line-height: var(--yj-line-height-base);
    color: var(--yj-login-text-lo);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
      border-radius: var(--yj-radius-full);
      background: var(--yj-accent);
    }
  }
}

/* 银河三段渐变点缀 */
.brand-glow {
  position: absolute;
  border-radius: var(--yj-radius-full);
  filter: blur(90px);
  pointer-events: none;
}

.brand-glow-a {
  width: 420px;
  height: 420px;
  right: -140px;
  top: -120px;
  background: rgba(47, 128, 255, 0.28);
}

.brand-glow-b {
  width: 360px;
  height: 360px;
  left: -120px;
  bottom: -140px;
  background: rgba(0, 194, 255, 0.20);
}

.brand-glow-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: var(--yj-login-galaxy);
}

/* ============ 右侧登录区 58% ============ */
.form-pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--yj-spacing-page);
  background: var(--yj-bg);
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: var(--yj-spacing-xxxl);
  background: var(--yj-surface);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-lg);
  box-shadow: var(--yj-shadow-md);
}

.card-head {
  margin-bottom: var(--yj-spacing-xxl);
  text-align: center;
}

.card-logo {
  display: none; /* 桌面端品牌区已展示 Logo，移动端见媒体查询 */
}

.card-title {
  margin: 0 0 var(--yj-spacing-xs);
  font-size: var(--yj-font-size-xxl);
  font-weight: var(--yj-font-weight-semibold);
  letter-spacing: -0.02em;
  color: var(--yj-text-primary);
}

.card-subtitle {
  margin: 0;
  font-size: var(--yj-font-size-md);
  color: var(--yj-text-secondary);
}

/* 页内警示条：3px severity 左边条 */
.page-alert {
  display: flex;
  align-items: center;
  gap: var(--yj-spacing-sm);
  margin-bottom: var(--yj-spacing-xl);
  padding: 10px var(--yj-spacing-md);
  background: rgba(239, 68, 68, 0.08);
  border-left: 3px solid var(--yj-danger);
  border-radius: var(--yj-radius-sm);
  font-size: var(--yj-font-size-md);
  line-height: var(--yj-line-height-base);
  color: var(--yj-text-primary);
}

.page-alert-text {
  flex: 1;
}

.page-alert-close {
  border: none;
  background: transparent;
  padding: 0 2px;
  font-size: var(--yj-font-size-lg);
  line-height: 1;
  color: var(--yj-text-tertiary);
  cursor: pointer;
  transition: color var(--yj-duration-fast) var(--yj-easing-standard);

  &:hover {
    color: var(--yj-text-primary);
  }
}

.login-form {
  margin-bottom: var(--yj-spacing-xs);
}

.form-switch {
  margin-top: calc(-1 * var(--yj-spacing-sm));
  text-align: right;
}

.code-input,
.captcha-input {
  :deep(.el-input-group__append) {
    border-radius: var(--yj-radius-sm);
    padding: 0;
    overflow: hidden;
  }
}

.code-input {
  :deep(.el-input-group__append) {
    .sms-send-btn {
      border: none;
      border-radius: 0;
      width: 120px;
    }
  }
}

.login-input {
  width: 100%;

  .captcha {
    cursor: pointer;
    width: 150px;
  }
}

/* 主按钮：高 44px、宽 100% */
.login-button {
  width: 100%;
  height: 44px;
  margin: 0;
  font-size: var(--yj-font-size-lg);
}

.register-btn {
  margin-top: var(--yj-spacing-md);
}

/* 微信扫码 */
.wechat-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--yj-spacing-lg) 0 var(--yj-spacing-xs);
}

.wechat-qr-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 168px;
  height: 168px;
  margin-bottom: var(--yj-spacing-lg);
  background: var(--yj-surface);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-lg);
}

.wechat-qr-icon {
  width: 72px;
  height: 72px;
}

.wechat-tip {
  margin: 0 0 var(--yj-spacing-xl);
  font-size: var(--yj-font-size-md);
  line-height: var(--yj-line-height-base);
  text-align: center;
  color: var(--yj-text-secondary);
}

.wechat-empty {
  padding: var(--yj-spacing-xxxl) var(--yj-spacing-lg);
  font-size: var(--yj-font-size-md);
  text-align: center;
  color: var(--yj-text-tertiary);
}

.divider {
  display: flex;
  align-items: center;
  margin: var(--yj-spacing-xl) 0;
  font-size: var(--yj-font-size-md);
  color: var(--yj-text-tertiary);

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--yj-divider);
  }

  &::before {
    margin-right: 10px;
  }

  &::after {
    margin-left: 10px;
  }
}

.oidc-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.oidc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  margin: 0;
  background-color: var(--yj-surface);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-md);
  color: var(--yj-text-primary);
  font-size: var(--yj-font-size-md);
  transition: border-color var(--yj-duration-fast) var(--yj-easing-standard);

  &:hover {
    border-color: var(--yj-primary);
    color: var(--yj-primary);
  }
}

.oidc-icon {
  width: 24px;
  height: 24px;
}

/* ============ 移动端 ≤768px：隐藏品牌区，仅留 88px Logo 深空顶 ============ */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .brand-pane {
    flex: none;
    height: 88px;
  }

  .brand-inner {
    padding: 0;
  }

  .brand-logo {
    width: 56px;
    height: 56px;
    margin: 0;
  }

  .brand-name,
  .brand-slogan,
  .brand-points,
  .brand-glow {
    display: none;
  }

  .form-pane {
    flex: 1;
    align-items: flex-start;
    padding: var(--yj-spacing-xl);
  }

  /* 登录卡铺满，留 20px 边距 */
  .login-card {
    max-width: none;
    padding: var(--yj-spacing-xxl) var(--yj-spacing-xl);
    box-shadow: var(--yj-shadow-sm);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-alert-close,
  .oidc-btn {
    transition: none;
  }
}
</style>
