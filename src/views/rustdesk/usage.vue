<template>
  <div class="yj-settings-panel" v-loading="form.loading">
    <header class="yj-settings-panel__header">
      <h2 class="yj-settings-panel__title">流量统计 <span class="yj-settings-panel__code">USAGE</span></h2>
      <p class="yj-settings-panel__desc">中继服务器各节点的连接用量统计，只读。</p>
    </header>

    <div class="yj-settings-group">
      <div class="yj-settings-row yj-settings-row--column">
        <el-table :data="form.list" size="small" border>
          <el-table-column prop="0" label="IP" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="1" label="TIME" min-width="90" show-overflow-tooltip></el-table-column>
          <el-table-column prop="2" label="TOTAL" min-width="80" show-overflow-tooltip></el-table-column>
          <el-table-column prop="3" label="HIGHEST" min-width="80" show-overflow-tooltip></el-table-column>
          <el-table-column prop="4" label="AVG" min-width="80" show-overflow-tooltip></el-table-column>
          <el-table-column prop="5" label="SPEED" min-width="80" show-overflow-tooltip></el-table-column>
          <template #empty>
            <span class="yj-ip-list__empty">暂无用量数据</span>
          </template>
        </el-table>
      </div>

      <div class="yj-settings-row">
        <div class="yj-settings-row__main">
          <div class="yj-settings-row__name">重新读取</div>
          <div class="yj-settings-row__help">从中继服务器重新获取最新用量统计。</div>
        </div>
        <el-button :disabled="!canSend" @click="getList">{{ T('Refresh') }}</el-button>
      </div>
    </div>
  </div>
</template>
<script setup>

  import { T } from '@/utils/i18n'
  import { reactive, watch } from 'vue'
  import { sendCmd } from '@/api/rustdesk'
  import { RELAY_TARGET } from '@/views/rustdesk/options'

  const props = defineProps({
    canSend: Boolean,
  })

  const form = reactive({
    get_cmd: 'u',
    list: [],
    target: RELAY_TARGET,
    loading: false,
  })
  const getList = async () => {
    form.loading = true
    const res = await sendCmd({ cmd: form.get_cmd, target: RELAY_TARGET }).catch(_ => false)
    form.loading = false
    if (res) {
      form.list = res.data.split('\n').filter(i => i).map(i => i.split(" "))
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
