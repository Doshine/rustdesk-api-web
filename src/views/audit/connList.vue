<template>
  <div>
    <YjPageHeader :title="T('AuditConnLog')">
      <template #actions>
        <el-button @click="toExport">{{ T('Export') }}</el-button>
        <el-button type="danger" plain @click="toBatchDelete">{{ T('BatchDelete') }}</el-button>
      </template>
    </YjPageHeader>

    <el-card class="list-query" shadow="hover">
      <YjFilterBar @search="handlerQuery" @reset="onResetFilter">
        <el-form-item :label="T('Peer')">
          <el-input v-model="listQuery.peer_id" clearable @keyup.enter="handlerQuery"></el-input>
        </el-form-item>
        <el-form-item :label="T('FromPeer')">
          <el-input v-model="listQuery.from_peer" clearable @keyup.enter="handlerQuery"></el-input>
        </el-form-item>
      </YjFilterBar>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <!-- 日志页默认紧凑密度 -->
      <el-table :data="listRes.list" v-loading="listRes.loading" border size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" align="center" width="40"/>
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
        <el-table-column :label="T('Actions')" align="center" width="120" class-name="table-actions" fixed="right">
          <template #default="{row}">
            <el-tooltip :content="T('Delete')" placement="top">
              <el-button type="danger" circle :icon="Delete" @click="del(row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <YjEmpty/>
        </template>
      </el-table>
    </el-card>
    <el-card class="list-page" shadow="hover">
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
  import { onActivated, onMounted, ref, watch } from 'vue'
  import { useRepositories } from '@/views/audit/reponsitories'
  import { T } from '@/utils/i18n'
  import { Delete } from '@element-plus/icons'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjFilterBar from '@/components/yj/YjFilterBar.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'
  import YjEmpty from '@/components/yj/YjEmpty.vue'

  const {
    listRes,
    listQuery,
    getList,
    handlerQuery,
    del,
    batchdel,
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

  const multipleSelection = ref([])
  const handleSelectionChange = (val) => {
    multipleSelection.value = val
  }
  const toBatchDelete = () => {
    if (multipleSelection.value.length === 0) {
      return
    }
    batchdel(multipleSelection.value)
  }
</script>

<style scoped lang="scss">

</style>
