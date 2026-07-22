import { defineStore, acceptHMRUpdate } from 'pinia'
import { current, login, loginSms, mfaBootstrapBegin, mfaBootstrapComplete, passkeyRegisterBegin, passkeyRegisterComplete, passkeyList, passkeyRevoke } from '@/api/user'
import { setToken, removeToken, setCode, removeCode } from '@/utils/auth'
import { useRouteStore } from '@/store/router'
import { useAppStore } from '@/store/app'
import { oidcAuth, oidcMfaVerify, oidcQuery, passkeyLoginBegin, passkeyLoginComplete } from '@/api/login'

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    nickname: '',
    username: '',
    email: '',
    token: '',
    role: '',
    mfa_enabled: false,
    avatar: '',
    route_names: [],
  }),

  actions: {
    logout () {
      removeToken()
      removeCode()
      this.$patch({
        name: '',
        role: {},
      })
    },

    saveUserData (userData) {
      // useAppStore().getAppConfig()
      setToken(userData.token)
      //
      localStorage.setItem('user_info', JSON.stringify({ name: userData.username }))
      this.$patch({
        ...userData,
      })
      if (userData.route_names && userData.route_names.length) {
        useRouteStore().addRoutes(userData.route_names)
      }
    },

    async login (form) {
      const res = await login(form).catch(e => e)
      console.log('login', res)
      if (!res.code) {
        const userData = res.data
        if (userData?.mfa_enrollment_required) {
          return userData
        }
        useAppStore().loadConfig()
        this.saveUserData(userData)
        return userData
      } else {
        return Promise.reject(res)
      }
    },
    async loginBySms (form) {
      const res = await loginSms(form).catch(e => e)
      if (!res.code) {
        const userData = res.data
        if (userData?.mfa_enrollment_required) {
          return userData
        }
        useAppStore().loadConfig()
        this.saveUserData(userData)
        return userData
      } else {
        return Promise.reject(res)
      }
    },
    async info () {
      const res = await current().catch(_ => false)
      if (res) {
        useAppStore().loadConfig()
        const userData = res.data
        setToken(userData.token)
        this.$patch({
          ...userData,
        })
        useRouteStore().addRoutes(userData.route_names)
        return userData
      }
      return false
    },
    async oidc (provider, platform, browser) {
      // oidc data need to be implement
      const data = {
        deviceInfo: {
          name: navigator.userAgent, // 使用浏览器的 User-Agent 作为设备名
          os: platform, // 获取操作系统信息
          type: 'webadmin', // any vaule
        },
        id: `${platform}-${browser}`,
        op: provider, // 传入的 provider
        uuid: '',//crypto.randomUUID(), // 自动生成 UUID
      }
      const res = await oidcAuth(data).catch(_ => false)
      if (res) {
        const { code, url } = res.data
        setCode(code)
        if (provider == 'webauth') {
          window.open(url)
        } else {
          window.location.href = url
        }
      }
    },
    async query (code) {
      const params = { 'code': code, uuid: '' }
      const res = await oidcQuery(params).catch(_ => false)
      if (res) {
        removeCode()
        if (res.data?.mfa_required || res.data?.mfa_enrollment_required) {
          return res.data
        }
        useAppStore().loadConfig()
        const userData = res.data
        this.saveUserData(userData)
        return userData
      }
      return false
    },
    async oidcMfa (challenge, code) {
      const res = await oidcMfaVerify({ challenge, code }).catch(e => e)
      if (res && !res.code) {
        useAppStore().loadConfig()
        const userData = res.data
        this.saveUserData(userData)
        return userData
      }
      return Promise.reject(res)
    },
    async beginMfaEnrollment (challenge) {
      const res = await mfaBootstrapBegin({ challenge }).catch(e => e)
      if (res && !res.code) return res.data
      return Promise.reject(res)
    },
    async completeMfaEnrollment (challenge, code) {
      const res = await mfaBootstrapComplete({ challenge, code }).catch(e => e)
      if (res && !res.code) {
        useAppStore().loadConfig()
        const userData = res.data
        this.saveUserData(userData)
        return userData
      }
      return Promise.reject(res)
    },
    async passkeyLogin (data) {
      const res = await passkeyLoginComplete(data).catch(e => e)
      if (res && !res.code) {
        if (res.data?.mfa_required || res.data?.mfa_enrollment_required) return res.data
        useAppStore().loadConfig()
        const userData = res.data
        this.saveUserData(userData)
        return userData
      }
      return Promise.reject(res)
    },
    async beginPasskeyLogin () {
      const res = await passkeyLoginBegin().catch(e => e)
      if (res && !res.code) return res.data
      return Promise.reject(res)
    },
    async beginPasskeyRegistration () {
      const res = await passkeyRegisterBegin().catch(e => e)
      if (res && !res.code) return res.data
      return Promise.reject(res)
    },
    async completePasskeyRegistration (data) {
      const res = await passkeyRegisterComplete(data).catch(e => e)
      if (res && !res.code) return res.data
      return Promise.reject(res)
    },
    async listPasskeys () {
      const res = await passkeyList().catch(e => e)
      if (res && !res.code) return res.data
      return Promise.reject(res)
    },
    async revokePasskey (id, data = {}) {
      const res = await passkeyRevoke(id, data).catch(e => e)
      if (res && !res.code) return res.data
      return Promise.reject(res)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
