<template>
  <div class="control-page">
    <YjPageHeader
      eyebrow="SECURITY JOURNAL"
      :title="T('AuditFileLog')"
      :description="T('AuditFileDescription')"
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
        <span>{{ T('AuditFileLog') }} <strong>{{ listRes.total }}</strong></span>
      </div>
      <!-- 日志页默认紧凑密度 -->
      <el-table :data="listRes.list" v-loading="listRes.loading" size="small" max-height="750">
        <el-table-column prop="id" label="ID" align="center" width="100" class-name="yj-mono"/>
        <el-table-column :label="T('Peer')" prop="peer_id" align="center" width="148" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column :label="T('FromPeer')" prop="from_peer" align="center" width="148" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column :label="T('FromName')" prop="from_name" align="center" width="120" show-overflow-tooltip/>
        <el-table-column :label="T('Ip')" prop="ip" align="center" width="132" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column prop="type" :label="T('Type')" align="center" width="200">
          <template #default="{row}">
            <span v-if="row.type === 1" class="transfer-route">{{ T('ToRemote') }}
              <el-icon>
                <Right/>
              </el-icon>
              {{ row.peer_id }}
            </span>
            <span v-else class="transfer-route">{{ T('ToLocal') }}
              <el-icon>
                <Right/>
              </el-icon>
              {{ row.from_peer }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="num" :label="T('Num')" align="center" width="100"/>
        <el-table-column :label="T('FileInfo')" align="center" width="300">
          <template #default="{row}">
            <template v-if="!row.is_file">
              <el-table size="small" :data="row.info?.files?.filter((v,k) => k<showDirFileNum)" fit>
                <el-table-column prop="0" :label="T('FileName')" align="center" width="150" show-overflow-tooltip></el-table-column>
                <el-table-column prop="1" :label="T('Size')" align="center">
                  <template #default="{row:_row}">
                    {{ sizeFormat(_row[1]) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-button size="small" v-if="row.info.files.length>showDirFileNum" style="width: 100%;margin-top: 5px" type="primary" @click="showAllFile(row.info.files)">
                {{ T('More') }}({{ row.info.files.length - showDirFileNum }})
              </el-button>
            </template>
            <div v-else>
              {{ sizeFormat(row.info.files[0][1]) }}
            </div>

          </template>
        </el-table-column>
        <el-table-column prop="path" :label="T('Path')" align="center" width="150" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column prop="uuid" label="uuid" align="center" width="120" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" width="160" class-name="yj-mono" show-overflow-tooltip/>
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
    <el-dialog v-model="allFilesVisible" :title="T('File')">
      <el-table :data="showFiles" max-height="800px">
        <el-table-column type="index" :label="T('IndexNum')" width="120" align="center"></el-table-column>
        <el-table-column prop="0" :label="T('FileName')" align="center"></el-table-column>
        <el-table-column prop="1" :label="T('Size')" align="center">
          <template #default="{row:_row}">
            {{ sizeFormat(_row[1]) }}
          </template>
        </el-table-column>
      </el-table>
      <el-button @click="allFilesVisible=false" style="margin-top: 20px;width: 100%" type="primary">{{ T('Close') }}</el-button>
    </el-dialog>
  </div>
</template>

<script setup>
  import { onActivated, onMounted, ref, watch } from 'vue'
  import { useFileRepositories } from '@/views/audit/reponsitories'
  import { T } from '@/utils/i18n'
  import { sizeFormat } from '@/utils/file'
  import { Right } from '@element-plus/icons-vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjFilterBar from '@/components/yj/YjFilterBar.vue'
  import YjEmpty from '@/components/yj/YjEmpty.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'

  const showDirFileNum = 3
  const {
    listRes,
    listQuery,
    getList,
    handlerQuery,
    toExport,
  } = useFileRepositories()

  onMounted(getList)
  onActivated(getList)

  watch(() => listQuery.page, getList)

  watch(() => listQuery.page_size, handlerQuery)

  const onResetFilter = () => {
    listQuery.peer_id = null
    listQuery.from_peer = null
    handlerQuery()
  }

  const allFilesVisible = ref(false)
  const showFiles = ref([])
  const showAllFile = (files) => {
    showFiles.value = files
    allFilesVisible.value = true
  }

</script>

<style scoped lang="scss">
.transfer-route {
  display: inline-flex;
  align-items: center;
  gap: var(--yj-spacing-xs);
  color: var(--yj-text-secondary);
  font-family: var(--yj-font-family-mono);
  font-size: var(--yj-font-size-xs);
}
</style>
