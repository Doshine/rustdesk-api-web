<template>
  <div class="yj-settings-panel" v-loading="form.loading">
    <header class="yj-settings-panel__header">
      <h2 class="yj-settings-panel__title">IP 黑名单 <span class="yj-settings-panel__code">BLACK_LIST</span></h2>
      <p class="yj-settings-panel__desc">被拉黑的 IP 将被中继服务器拒绝服务，相关连接会被立即中断。</p>
    </header>

    <div class="yj-settings-group">
      <div class="yj-settings-row yj-settings-row--column">
        <div class="yj-settings-row__main">
          <div class="yj-settings-row__name">当前黑名单（{{ form.list.length }}）</div>
        </div>
        <div v-if="form.list.length" class="yj-ip-list">
          <el-tag v-for="ip in form.list" :key="ip" class="yj-ip-list__tag" disable-transitions>{{ ip }}</el-tag>
        </div>
        <div v-else class="yj-ip-list__empty">暂无条目</div>
      </div>

      <div class="yj-settings-row">
        <div class="yj-settings-row__main">
          <div class="yj-settings-row__name">黑名单操作</div>
          <div class="yj-settings-row__help">添加与删除均为高风险操作，提交前需确认影响范围与回滚方式。</div>
        </div>
        <div class="yj-settings-row__control">
          <el-button @click="getList">{{ T('Refresh') }}</el-button>
          <el-button type="primary" :disabled="!canSend" @click="showForm('add')">{{ T('Add') }}</el-button>
          <el-button type="danger" plain :disabled="!canSend" @click="showForm('delete')">{{ T('Delete') }}</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="form.form_visible" :title="form.form_type === 'add' ? '添加黑名单' : '删除黑名单'" width="480px">
      <el-form label-width="72px">
        <el-form-item label="IP">
          <el-input v-model="form.form_input" placeholder="1.2.3.4|5.6.7.8"></el-input>
          <div class="yj-dialog-hint">
            多个 IP 以 | 分割<span v-if="form.form_type==='delete'">，全部删除填 <strong>all</strong></span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.form_visible=false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" :loading="form.submitting" @click="submit">{{ T('Submit') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>

  import { T } from '@/utils/i18n'
  import { reactive, watch } from 'vue'
  import { sendCmd } from '@/api/rustdesk'
  import { ElMessage } from 'element-plus'
  import { confirmRisk, RELAY_TARGET } from '@/views/rustdesk/options'

  const props = defineProps({
    canSend: Boolean,
  })

  const form = reactive({
    get_cmd: 'blacklist',
    add_cmd: 'blacklist-add',
    remove_cmd: 'blacklist-remove',
    list: [],
    target: RELAY_TARGET,
    loading: false,
    submitting: false,
    form_visible: false,
    form_input: '',
    form_type: '',
  })
  const getList = async () => {
    form.loading = true
    const res = await sendCmd({ cmd: form.get_cmd, target: RELAY_TARGET }).catch(_ => false)
    form.loading = false
    if (res) {
      form.list = res.data.split('\n').filter(i => i)
    }
  }
  const showForm = (type) => {
    form.form_visible = true
    form.form_input = ''
    form.form_type = type
  }
  const submit = async () => {
    if (!form.form_input.trim()) {
      ElMessage.error(T('ParamRequired', { param: 'IP' }))
      return
    }
    // 高风险操作：保存前确认影响范围与回滚方式
    const ok = await confirmRisk(form.form_type === 'add' ? 'blacklist_add' : 'blacklist_remove')
    if (!ok) {
      return
    }
    form.submitting = true
    const res = await sendCmd({
      cmd: form.form_type === 'add' ? form.add_cmd : form.remove_cmd,
      option: form.form_input,
      target: RELAY_TARGET,
    }).catch(_ => false)
    form.submitting = false
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      form.form_visible = false
      getList()
    }
  }
  watch(() => props.canSend, (v) => {
    if (v) {
      getList()
    }
  })


</script>
<style scoped lang="scss">

</style>
