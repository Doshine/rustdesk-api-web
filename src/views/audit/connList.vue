<template>
  <div class="control-page">
    <YjPageHeader
      eyebrow="SECURITY JOURNAL"
      :title="T('AuditConnLog')"
      :description="T('AuditConnDescription')"
    >
      <template #status>
        <YjStatusDot class="audit-integrity" status="online" :text="T('AuditImmutable')"/>
      </template>
      <template #actions>
        <el-button @click="toExport">{{ T('Export') }}</el-button>
      </template>
    </YjPageHeader>

    <el-card class="list-query" shadow="never">
      <YjFilterBar @search="handlerQuery" @reset="onResetFilter">
        <el-form-item :label="T('Peer')">
          <el-input v-model="listQuery.peer_id" clearable @keyup.enter="handlerQuery"></el-input>
        </el-form-item>
        <el-form-item :label="T('FromPeer')">
          <el-input v-model="listQuery.from_peer" clearable @keyup.enter="handlerQuery"></el-input>
        </el-form-item>
      </YjFilterBar>
    </el-card>
    <el-card class="list-body" shadow="never">
      <div class="table-summary-bar">
        <span>{{ T('DashboardConnTotal') }} <strong>{{ listRes.total }}</strong></span>
      </div>
      <!-- 日志页默认紧凑密度 -->
      <el-table :data="listRes.list" v-loading="listRes.loading" size="small">
        <el-table-column prop="id" label="ID" align="center" width="100" class-name="yj-mono"/>
        <el-table-column :label="T('Peer')" prop="peer_id" align="center" width="148" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column :label="T('FromPeer')" prop="from_peer" align="center" width="148" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column :label="T('FromName')" prop="from_name" align="center" width="120" show-overflow-tooltip/>
        <el-table-column :label="T('Ip')" prop="ip" align="center" width="132" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column pop="type" :label="T('Type')" align="center" width="92">
          <template #default="{row}">
            <YjStatusDot v-if="row.type === 1" status="warning" :text="T('File')"/>
            <YjStatusDot v-else status="online" :text="T('Common')"/>
          </template>
        </el-table-column>
        <el-table-column prop="uuid" label="uuid" align="center" width="120" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" width="160" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column :label="T('CloseTime')" prop="close_time" align="center" width="160" class-name="yj-mono" show-overflow-tooltip/>
        <template #empty>
          <YjEmpty/>
        </template>
      </el-table>
    </el-card>
    <el-card class="list-page" shadow="never">
      <el-pagination background
                     layout="prev, pager, next, sizes, jumper"
                     :page-sizes="[10,20,50,100]"
                     v-model:page-size="listQuery.page_size"
                     v-model:current-page="listQuery.page"
                     :total="listRes.total">
      </el-pagination>
    </el-card>
  </div>
</template>

<script setup>
  import { onActivated, onMounted, watch } from 'vue'
  import { useRepositories } from '@/views/audit/reponsitories'
  import { T } from '@/utils/i18n'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjFilterBar from '@/components/yj/YjFilterBar.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'
  import YjEmpty from '@/components/yj/YjEmpty.vue'

  const {
    listRes,
    listQuery,
    getList,
    handlerQuery,
    toExport,
  } = useRepositories()

  onMounted(getList)
  onActivated(getList)

  watch(() => listQuery.page, getList)

  watch(() => listQuery.page_size, handlerQuery)

  const onResetFilter = () => {
    listQuery.peer_id = null
    listQuery.from_peer = null
    handlerQuery()
  }

</script>

<style scoped lang="scss">

</style>
