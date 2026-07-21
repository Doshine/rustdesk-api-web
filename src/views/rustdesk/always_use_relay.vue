<template>
  <div class="yj-settings-panel" v-loading="form.loading">
    <header class="yj-settings-panel__header">
      <h2 class="yj-settings-panel__title">强制中继 <span class="yj-settings-panel__code">ALWAYS_USE_RELAY</span></h2>
      <p class="yj-settings-panel__desc">开启后所有连接强制走中继服务器，不再尝试 P2P 直连。</p>
    </header>

    <div class="yj-settings-group">
      <div class="yj-settings-row">
        <div class="yj-settings-row__main">
          <div class="yj-settings-row__name">启用强制中继</div>
          <div class="yj-settings-row__help">高风险项：开启后在线会话将中断重连，可能增加延迟；保存前需确认。</div>
        </div>
        <el-switch v-model="form.option" :disabled="!canSend" active-value="Y" inactive-value="N"></el-switch>
      </div>

      <div class="yj-settings-row">
        <div class="yj-settings-row__main">
          <div class="yj-settings-row__name">重新读取</div>
          <div class="yj-settings-row__help">从服务器重新获取当前生效值，未保存的修改会被覆盖。</div>
        </div>
        <el-button @click="get">{{ T('Refresh') }}</el-button>
      </div>
    </div>
  </div>
</template>
<script setup>

  import { T } from '@/utils/i18n'
  import { computed, reactive, ref, watch } from 'vue'
  import { sendCmd } from '@/api/rustdesk'
  import { ElMessage } from 'element-plus'
  import { confirmRisk, ID_TARGET } from '@/views/rustdesk/options'

  const emit = defineEmits(['success', 'dirty-change'])
  const props = defineProps({
    canSend: Boolean,
  })

  const form = reactive({
    cmd: 'aur',
    option: '',
    target: ID_TARGET,
    value: 0,
    loading: false,
  })
  // 最近一次从服务器读取/成功保存的值，用于 dirty 判定与「放弃」回滚
  const savedOption = ref('')
  const dirty = computed(() => form.option !== savedOption.value)
  watch(dirty, (v) => emit('dirty-change', v), { immediate: true })

  const get = async () => {
    form.loading = true
    const res = await sendCmd({ cmd: 'aur', target: ID_TARGET }).catch(_ => false)
    form.loading = false
    if (res) {
      if (res.data === 'ALWAYS_USE_RELAY: true' || res.data === 'ALWAYS_USE_RELAY: true\n') {
        form.option = 'Y'
      } else {
        form.option = 'N'
      }
      savedOption.value = form.option
    }
  }
  const save = async () => {
    if (!dirty.value) {
      return true
    }
    const ok = await confirmRisk('always_use_relay')
    if (!ok) {
      return false
    }
    const res = await sendCmd({ cmd: form.cmd, option: form.option, target: form.target }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      savedOption.value = form.option
      emit('success')
      return true
    }
    return false
  }
  const discard = () => {
    form.option = savedOption.value
  }

  watch(() => props.canSend, (v) => {
    if (v) {
      get()
    }
  })

  defineExpose({
    save,
    discard,
  })
</script>


<style scoped lang="scss">

</style>
