<template>
  <div class="login-container">
    <div class="login-card">
      <img src="@/assets/brand-logo.png" alt="logo" class="login-logo"/>
      <el-form ref="f" :model="form" label-position="top" class="login-form" :rules="rules">
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="form.username" class="login-input"></el-input>
        </el-form-item>

        <el-form-item :label="T('Email')" prop="email">
          <el-input v-model="form.email" class="login-input"></el-input>
        </el-form-item>

        <el-form-item :label="T('Password')" prop="password">
          <el-input v-model="form.password" type="password" show-password
                    class="login-input"></el-input>
        </el-form-item>
        <el-form-item :label="T('ConfirmPassword')" prop="confirm_password">
          <el-input v-model="form.confirm_password" type="password" @keyup.enter.native="submit" show-password
                    class="login-input"></el-input>
        </el-form-item>
        <el-form-item label="">
          <el-button @click="submit" class="login-button" type="success">{{ T('Submit') }}</el-button>
          <el-button @click="toLogin" class="login-button">{{ T('ToLogin') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
  import { reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { T } from '@/utils/i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { register } from '@/api/user'
  import { useUserStore } from '@/store/user'
  import { useAppStore } from '@/store/app'

  const router = useRouter()
  const userStore = useUserStore()
  const form = reactive({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const rules = {
    username: [
      { required: true, message: T('ParamRequired', { param: T('Username') }), trigger: 'blur' },
    ],
    // email: [
    //   { required: true, message: T('ParamRequired', { param: T('Email') }), trigger: 'blur' },
    // ],
    password: [
      { required: true, message: T('ParamRequired', { param: T('Password') }), trigger: 'blur' },
    ],
    confirm_password: [
      { required: true, message: T('ParamRequired', { param: T('ConfirmPassword') }), trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== form.password) {
            callback(new Error(T('PasswordNotMatchConfirmPassword')))
          } else {
            callback()
          }
        }, trigger: 'blur',
      },
    ],
  }
  const f = ref(null)
  const submit = async () => {
    const v = await f.value.validate().catch(_ => false)
    if (!v) {
      return
    }
    const res = await register(form).catch(_ => false)
    if (!res) {
      return
    }
    userStore.saveUserData(res.data)
    useAppStore().loadConfig()
    ElMessage.success('Submit')
    router.push('/')
  }
  const toLogin = () => {
    router.push('/login')

  }
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--yj-bg);
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  width: 360px;
  background-color: var(--yj-surface);
  border: 1px solid var(--yj-border);
  padding: 40px;
  border-radius: var(--yj-radius-lg);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.login-form {
  margin-bottom: 20px;
}

.login-input {
  width: 100%;
}

.login-button {
  width: 100%;
  height: 40px;
  margin-bottom: 20px;
  margin-top: 20px;
  margin-left: 0;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: block;
}

/* 表单标签/输入框颜色交由 element-overrides.css 的 EP token 映射，不再强制白色 */
</style>
