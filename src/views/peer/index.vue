<template>
  <div class="control-page">
    <YjPageHeader
      eyebrow="DEVICE OPERATIONS"
      :title="T('PeerManage')"
      :description="T('PeerManageDescription')"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="toAdd">{{ T('AddPeer') }}</el-button>
        <el-dropdown trigger="click" @command="handleMoreCommand">
          <el-button>
            {{ T('More') }}<el-icon class="el-icon--right"><ArrowDown/></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="import">{{ T('Import') }}</el-dropdown-item>
              <el-dropdown-item command="export">{{ T('Export') }}</el-dropdown-item>
              <el-dropdown-item command="batchAddToAB">{{ T('BatchAddToAB') }}</el-dropdown-item>
              <el-dropdown-item command="batchTags">{{ T('BatchUpdateTags') }}</el-dropdown-item>
              <el-dropdown-item command="batchDelete" divided>
                <span class="yj-danger-text">{{ T('BatchDelete') }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </YjPageHeader>

    <el-card class="list-query" shadow="never">
      <YjFilterBar @search="handlerQuery" @reset="onResetFilter">
        <el-form-item label="ID">
          <el-input v-model="listQuery.id" clearable @keyup.enter="handlerQuery"/>
        </el-form-item>
        <el-form-item :label="T('Hostname')">
          <el-input v-model="listQuery.hostname" clearable @keyup.enter="handlerQuery"/>
        </el-form-item>
        <el-form-item :label="T('Status')">
          <el-select v-model="onlineStatus" clearable>
            <el-option :label="T('Online')" value="online"></el-option>
            <el-option :label="T('Offline')" value="offline"></el-option>
            <el-option :label="T('PendingApproval')" value="pending"></el-option>
          </el-select>
        </el-form-item>
        <template #more>
          <el-form-item :label="T('Os')">
            <el-input v-model="listQuery.os" clearable/>
          </el-form-item>
          <el-form-item :label="T('Group')">
            <el-select v-model="listQuery.group_id" clearable filterable>
              <el-option
                  v-for="item in groupListRes.list"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="T('Username')">
            <el-input v-model="listQuery.username" clearable/>
          </el-form-item>
          <el-form-item label="IP">
            <el-input v-model="listQuery.ip" clearable/>
          </el-form-item>
          <el-form-item :label="T('LastOnlineTime')">
            <el-select v-model="listQuery.time_ago" clearable>
              <el-option
                  v-for="item in timeFilters"
                  :key="item.value"
                  :label="item.text"
                  :value="item.value"
                  :disabled="item.value === 0"
              ></el-option>
            </el-select>
          </el-form-item>
        </template>
      </YjFilterBar>
    </el-card>
    <!-- 待审批提示条：有待审批设备时出现 -->
    <el-alert
        v-if="pendingCount > 0 && listQuery.status !== 0"
        class="pending-alert"
        type="warning"
        :closable="false"
        show-icon
    >
      <template #title>
        <span>{{ T('PendingAlert', { n: pendingCount }) }}</span>
        <el-link type="primary" class="pending-alert__link" underline="never" @click="onlineStatus = 'pending'; handlerQuery()">
          {{ T('ViewPending') }}
        </el-link>
      </template>
    </el-alert>

    <el-card class="list-body" shadow="never">
      <div class="table-summary-bar">
        <span>{{ T('DashboardPeersTotalCaption', { n: listRes.total }) }}</span>
        <el-button :icon="Setting" :aria-label="T('Setting')" @click="showColumnSetting"></el-button>
      </div>

      <YjSelectionBar
          :count="multipleSelection.length"
          :summary="T('SelectedDevices', { n: multipleSelection.length })"
          :detail="selectedPendingCount ? T('PendingSelected', { n: selectedPendingCount }) : ''"
          :clear-text="T('ClearSelection')"
          @clear="clearSelection"
      >
        <el-button v-if="selectedPendingCount" type="primary" :icon="Check" @click="toBatchApprove">
          {{ T('ApproveSelected') }}
        </el-button>
        <el-button v-if="selectedApprovedCount" @click="toBatchAddToAB">
          {{ T('BatchAddToAB') }}
        </el-button>
        <el-button v-if="selectedApprovedCount" @click="toBatchTags">
          {{ T('BatchUpdateTags') }}
        </el-button>
        <el-button type="danger" plain @click="toBatchDelete">{{ T('Delete') }}</el-button>
      </YjSelectionBar>

      <el-table ref="peerTable" :data="listRes.list" v-loading="listRes.loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="40" align="center"/>
        <template v-for="c in visibleColumns.filter(cc => cc.visible)" :key="c">
          <el-table-column v-if="c.name==='id'" prop="id" label="ID" align="center" width="148" class-name="yj-mono">
            <template #default="{row}">
              <span class="peer-id">{{ row.id }} <el-icon class="copy-icon" @click="handleClipboard(row.id, $event)"><CopyDocument/></el-icon></span>
            </template>
          </el-table-column>
          <el-table-column v-if="c.name==='online_status'" :label="T('OnlineStatus')" align="center" width="92">
            <template #default="{row}">
              <YjStatusDot v-if="isPending(row)" status="connecting" :text="T('PendingApproval')"/>
              <YjStatusDot v-else :status="onlineOf(row)" :text="onlineOf(row) === 'online' ? T('Online') : T('Offline')"/>
            </template>
          </el-table-column>
          <el-table-column v-if="c.name==='cpu'" prop="cpu" label="CPU" align="center" width="100" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='hostname'" prop="hostname" :label="T('Hostname')" align="center" min-width="180" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='memory'" prop="memory" :label="T('Memory')" align="center" width="120" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='os'" prop="os" :label="T('Os')" align="center" width="120" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='last_online_time'" prop="last_online_time" :label="T('LastOnlineTime')" align="center" width="160" class-name="yj-mono">
            <template #default="{row}">
              <el-tooltip :content="row.last_online_time ? formatTime(row.last_online_time * 1000) : '-'" placement="top">
                <span>{{ row.last_online_time ? timeAgo(row.last_online_time * 1000) : '-' }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column v-if="c.name==='last_online_ip'" prop="last_online_ip" :label="T('LastOnlineIp')" align="center" width="132" class-name="yj-mono" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='username'" prop="username" :label="T('Username')" align="center" width="120" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='group_id'" prop="group_id" :label="T('Group')" align="center" width="120">
            <template #default="{row}">
              <span v-if="row.group_id" class="neutral-chip">{{ groupListRes.list?.find(g => g.id === row.group_id)?.name }}</span>
              <span v-else> - </span>
            </template>
          </el-table-column>
          <el-table-column v-if="c.name==='uuid'" prop="uuid" :label="T('Uuid')" align="center" width="120" class-name="yj-mono" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='version'" prop="version" :label="T('Version')" align="center" width="80" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='alias'" prop="alias" :label="T('Alias')" align="center" width="80" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='created_at'" prop="created_at" :label="T('CreatedAt')" align="center" width="160" class-name="yj-mono" show-overflow-tooltip/>
          <el-table-column v-if="c.name==='updated_at'" prop="updated_at" :label="T('UpdatedAt')" align="center" width="160" class-name="yj-mono" show-overflow-tooltip/>
        </template>

        <el-table-column :label="T('Actions')" align="center" width="136" class-name="table-actions" fixed="right">
          <template #default="{row}">
            <!-- 待审批行：批准 / 拒绝 -->
            <template v-if="isPending(row)">
              <el-tooltip :content="T('Approve')" placement="top">
                <el-button type="success" circle :icon="Check" :aria-label="T('Approve')" @click="toApprove(row)"/>
              </el-tooltip>
              <el-tooltip :content="T('Reject')" placement="top">
                <el-button type="danger" circle :icon="Close" :aria-label="T('Reject')" @click="toReject(row)"/>
              </el-tooltip>
            </template>
            <template v-else>
              <el-tooltip :content="T('Link')" placement="top">
                <el-button type="success" circle :icon="Connection" :aria-label="T('Link')" @click="connectByClient(row.id)"/>
              </el-tooltip>
              <el-tooltip :content="T('Edit')" placement="top">
                <el-button circle :icon="Edit" :aria-label="T('Edit')" @click="toEdit(row)"/>
              </el-tooltip>
              <el-dropdown trigger="click" @command="(cmd) => handleRowCommand(cmd, row)">
                <el-button circle :icon="MoreFilled" :aria-label="T('More')"/>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="appStore.setting.appConfig.web_client" command="webclient">Web Client</el-dropdown-item>
                    <el-dropdown-item command="ab">{{ T('AddToAddressBook') }}</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <span class="yj-danger-text">{{ T('Delete') }}</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </template>
        </el-table-column>
        <template #empty>
          <YjEmpty :title="emptyTitle" :description="emptyDescription">
            <template v-if="listQuery.status !== 0" #action>
              <el-button type="primary" @click="toAdd">{{ T('AddPeer') }}</el-button>
            </template>
          </YjEmpty>
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
    <el-dialog v-model="formVisible" :title="!formData.row_id?T('Create'):T('Update')" width="800">
      <el-form class="dialog-form" ref="form" :model="formData" label-width="120px">
        <el-form-item label="ID" prop="id" required>
          <el-input v-model="formData.id"></el-input>
        </el-form-item>
        <el-form-item :label="T('Group')" prop="group_id">
          <el-select v-model="formData.group_id">
            <el-option
                v-for="item in groupListRes.list"
                :key="item.id"
                :label="item.name"
                :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="formData.username"></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')" prop="hostname">
          <el-input v-model="formData.hostname"></el-input>
        </el-form-item>
        <el-form-item label="CPU" prop="cpu">
          <el-input v-model="formData.cpu"></el-input>
        </el-form-item>
        <el-form-item :label="T('Memory')" prop="memory">
          <el-input v-model="formData.memory"></el-input>
        </el-form-item>
        <el-form-item :label="T('Os')" prop="os">
          <el-input v-model="formData.os"></el-input>
        </el-form-item>
        <el-form-item :label="T('Uuid')" prop="uuid">
          <el-input v-model="formData.uuid"></el-input>
        </el-form-item>
        <el-form-item :label="T('Version')" prop="version">
          <el-input v-model="formData.version"></el-input>
        </el-form-item>
        <el-form-item :label="T('Alias')" prop="alias">
          <el-input v-model="formData.alias"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
          <el-button @click="submit" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="ABFormVisible" width="800" :title="T('Create')" destroy-on-close>
      <createABForm :peer="clickRow" @success="ABFormVisible=false" @cancel="ABFormVisible=false"></createABForm>
    </el-dialog>

    <el-dialog v-model="batchABFormVisible" width="800" :title="T('Create')">
      <el-form class="dialog-form" ref="form" :model="batchABFormData" label-width="120px">
        <el-form-item :label="T('Owner')" prop="user_id" required>
          <el-select v-model="batchABFormData.user_id" @change="changeUserForBatchCreateAB">
            <el-option
                v-for="item in allUsers"
                :key="item.id"
                :label="item.username"
                :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="batchABFormData.collection_id" clearable>
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option v-for="c in collectionListResForBatchCreateAB.list" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
        </el-form-item>
        <!--        <el-form-item :label="T('Tags')" prop="tags">
                  <el-select v-model="batchABFormData.tags" multiple>
                    <el-option
                        v-for="item in tagListRes.list"
                        :key="item.name"
                        :label="item.name"
                        :value="item.name"
                    ></el-option>
                  </el-select>
                </el-form-item>-->
        <el-form-item>
          <el-button @click="batchABFormVisible = false">{{ T('Cancel') }}</el-button>
          <el-button @click="submitBatchAddToAB" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 批量打标签对话框 -->
    <el-dialog v-model="batchTagsVisible" :title="T('BatchUpdateTags')" width="600">
      <el-form class="dialog-form" label-position="top">
        <el-form-item :label="T('SelectTags')">
          <el-select v-model="batchTagsForm.tags" multiple filterable style="width: 100%">
            <el-option
                v-for="item in tagListRes.list"
                :key="item.name"
                :label="item.name"
                :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchTagsVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="submitBatchTags">{{ T('Submit') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImport" :title="T('Import')" width="600">
      <el-upload
          class="upload-demo"
          drag
          accept=".csv"
          :before-upload="parseCsv"
      >
        <el-icon class="el-icon--upload">
          <upload-filled/>
        </el-icon>
        <div class="el-upload__text">
          {{ T('Drop file here or click to upload') }}
        </div>
        <template #tip>
          <div class="el-upload__tip">
            {{ T('Please upload csv file') }} <br>
            {{ T('Columns') }}: <span style="font-weight: bold;font-size: 15px">id,cpu,hostname,memory,os,username,uuid,version,group_id</span>
            <br>
            <span>{{ T('You can reference export file') }}</span>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showImport=false" type="primary">{{ T('Cancel') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="columnSettingVisible" title="Column Setting">
      <div v-for="(row, key) in visibleColumns" :key="key" style="margin-bottom: 10px;display: flex;align-items: center">
        <div style="width: 200px">
          <el-checkbox v-model="row.visible" :label="true">{{ T(row.label) }}</el-checkbox>
        </div>
        <div @click="upColumn(key)" style="width: 100px;cursor: pointer">
          <el-icon :size="20">
            <ArrowUp/>
          </el-icon>
        </div>
        <div @click="downColumn(key)" style="width: 100px;cursor: pointer">
          <el-icon :size="20">
            <ArrowDown/>
          </el-icon>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="columnSettingVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="saveColumnSetting">{{ T('Save') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
  import { approve, batchRemove, batchUpdateTags, create, list, remove, update } from '@/api/peer'
  import { list as tagList } from '@/api/tag'
  import { list as groupList } from '@/api/device_group'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { toWebClientLink } from '@/utils/webclient'
  import { T } from '@/utils/i18n'
  import { timeAgo } from '@/utils/time'
  import { jsonToCsv, downBlob } from '@/utils/file'
  import { loadAllUsers } from '@/global'
  import { useAppStore } from '@/store/app'
  import { connectByClient } from '@/utils/peer'
  import { ArrowDown, ArrowUp, Check, Close, Connection, CopyDocument, Edit, MoreFilled, Plus, Setting } from '@element-plus/icons-vue'
  import { handleClipboard } from '@/utils/clipboard'
  import { batchCreateFromPeers } from '@/api/address_book'
  import { useRepositories as useCollectionRepositories } from '@/views/address_book/collection'
  import createABForm from '@/views/peer/createABForm.vue'
  import { UploadFilled } from '@element-plus/icons-vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjFilterBar from '@/components/yj/YjFilterBar.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'
  import YjEmpty from '@/components/yj/YjEmpty.vue'
  import YjSelectionBar from '@/components/yj/YjSelectionBar.vue'
  import { formatTime } from '@/utils/time'

  const appStore = useAppStore()

  //group
  const groupListRes = reactive({
    list: [], total: 0, loading: false,
  })
  const groupListQuery = reactive({
    page: 1,
    page_size: 999,
  })
  const getGroupList = async () => {
    groupListRes.loading = true
    const res = await groupList(groupListQuery).catch(_ => false)
    groupListRes.loading = false
    if (res) {
      groupListRes.list = res.data.list
      groupListRes.total = res.data.total
    }
  }
  onMounted(getGroupList)
  //

  const listRes = reactive({
    list: [], total: 0, loading: false,
  })
  const listQuery = reactive({
    page: 1,
    page_size: 10,
    time_ago: null,
    id: '',
    hostname: '',
    username: '',
    ip: '',
    os: '',
    group_id: null,
    status: '', // '' 全部 / 0 待审批 / 1 已通过
  })

  // 状态结构化筛选：在线/离线映射 time_ago（<60s 视为在线），待审批映射 status=0
  const onlineStatus = computed({
    get: () => {
      if (listQuery.status === 0) return 'pending'
      if (listQuery.time_ago === -60) return 'online'
      if (listQuery.time_ago === 60) return 'offline'
      return null
    },
    set: (v) => {
      if (v === 'pending') {
        listQuery.status = 0
        listQuery.time_ago = null
      } else {
        listQuery.status = ''
        if (v === 'online') listQuery.time_ago = -60
        else if (v === 'offline') listQuery.time_ago = 60
        else listQuery.time_ago = null
      }
    },
  })

  // 待审批容错：status 缺失（旧数据）视为已通过
  const isPending = (row) => row.status === 0

  const onlineOf = (row) =>
    row.last_online_time && timeDis(row.last_online_time) < 60 ? 'online' : 'offline'

  // 待审批数量提示条
  const pendingCount = ref(0)
  const getPendingCount = async () => {
    const res = await list({ page: 1, page_size: 1, status: 0 }).catch(_ => false)
    if (res && typeof res.data?.total === 'number') {
      pendingCount.value = res.data.total
    }
  }
  onMounted(getPendingCount)

  // 批准 / 拒绝（拒绝即删除待审批记录，走既有 remove）
  const toApprove = async (row) => {
    const cf = await ElMessageBox.confirm(T('ApproveConfirm'), {
      confirmButtonText: T('Approve'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) return false
    const res = await approve({ row_ids: [row.row_id] }).catch(_ => false)
    if (res) {
      ElMessage.success(T('ApproveSuccess'))
      getList()
      getPendingCount()
    }
  }
  const toReject = async (row) => {
    del(row)
  }

  // Onboarding 空态文案（对齐 Tailscale「新设备等待审批」模式）
  const emptyTitle = computed(() =>
    listQuery.status === 0 ? T('PendingEmptyTitle') : T('NoData'))
  const emptyDescription = computed(() =>
    listQuery.status === 0 ? T('PendingEmptyTip') : T('NoDataTip'))

  const onResetFilter = () => {
    listQuery.id = ''
    listQuery.hostname = ''
    listQuery.username = ''
    listQuery.ip = ''
    listQuery.os = ''
    listQuery.group_id = null
    listQuery.time_ago = null
    listQuery.status = ''
    handlerQuery()
  }

  // 标题区「更多」菜单：导入 / 导出 / 批量操作
  const handleMoreCommand = (cmd) => {
    if (cmd === 'import') showImport.value = true
    else if (cmd === 'export') toExport()
    else if (cmd === 'batchDelete') toBatchDelete()
    else if (cmd === 'batchAddToAB') toBatchAddToAB()
    else if (cmd === 'batchTags') toBatchTags()
  }

  // 行内「更多」菜单：Web Client / 加入地址簿 / 删除
  const handleRowCommand = (cmd, row) => {
    if (cmd === 'webclient') toWebClientLink(row)
    else if (cmd === 'ab') toAddressBook(row)
    else if (cmd === 'delete') del(row)
  }

  const getList = async () => {
    listRes.loading = true
    const res = await list(listQuery).catch(_ => false)
    listRes.loading = false
    if (res) {
      listRes.list = res.data.list
      listRes.total = res.data.total
    }
  }
  const handlerQuery = () => {
    if (listQuery.page === 1) {
      getList()
    } else {
      listQuery.page = 1
    }
  }

  const del = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }

    const res = await remove({ row_id: row.row_id }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
      getPendingCount()
    }
  }
  onMounted(getList)
  onActivated(getList)

  watch(() => listQuery.page, getList)

  watch(() => listQuery.page_size, handlerQuery)

  const formVisible = ref(false)
  const formData = reactive({
    row_id: 0,
    group_id: null,
    cpu: '',
    hostname: '',
    id: '',
    memory: '',
    os: '',
    username: '',
    uuid: '',
    version: '',
  })

  const toEdit = (row) => {
    formVisible.value = true
    //将row中的数据赋值给formData
    Object.keys(formData).forEach(key => {
      formData[key] = row[key]
    })
  }
  const toAdd = () => {
    formVisible.value = true
    //重置formData
    formData.row_id = 0
    formData.cpu = ''
    formData.hostname = ''
    formData.id = ''
    formData.memory = ''
    formData.os = ''
    formData.username = ''
    formData.uuid = ''
    formData.version = ''
  }
  const submit = async () => {
    const api = formData.row_id ? update : create
    const res = await api(formData).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      formVisible.value = false
      getList()
    }
  }

  const timeDis = (time) => {
    let now = new Date().getTime()
    let after = new Date(time * 1000).getTime()
    return (now - after) / 1000
  }

  const timeFilters = computed(() => [
    { text: T('MinutesLess', { param: 1 }, 1), value: -60 },
    { text: T('HoursLess', { param: 1 }, 1), value: -3600 },
    { text: T('DaysLess', { param: 1 }, 1), value: -86400 },
    { text: '---------', value: 0 },
    { text: T('MinutesAgo', { param: 1 }, 1), value: 60 },
    { text: T('HoursAgo', { param: 1 }, 1), value: 3600 },
    { text: T('DaysAgo', { param: 1 }, 1), value: 86400 },
    { text: T('MonthsAgo', { param: 1 }, 1), value: 2592000 },
    // { text: T('YearsAgo', { param: 1 }, 1), value: 31536000 },
  ])

  const toExport = async () => {
    const q = { ...listQuery }
    q.page_size = 10000
    q.page = 1
    const res = await list(q).catch(_ => false)
    if (res) {
      const data = res.data.list.map(item => {
        item.last_online_time = item.last_online_time ? new Date(item.last_online_time * 1000).toLocaleString() : '-'
        delete item.user_id
        delete item.user
        return item
      })
      const csv = jsonToCsv(data)
      downBlob(csv, 'peers.csv')
    }
  }

  const showImport = ref(false)
  const canKeys = ['id', 'cpu', 'hostname', 'memory', 'os', 'username', 'uuid', 'version', 'group_id']
  const parseCsv = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = e.target.result
      console.log(data)
      //组装数据
      const rows = data.split('\n')
      const keys = rows[0].split(',')
      console.log(keys, rows.slice(1).map(row => row.split(',')))
      const values = rows.slice(1).map(row => {
        const obj = {}
        row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).forEach((v, i) => {
          //去掉两边的"
          obj[keys[i]] = v.trim().replace(/^"|"$/g, '')
        })
        return obj
      }).filter(item => item.id)
      // console.log(values)
      //移除不需要的key
      values.forEach(item => {
        item.group_id = parseInt(item.group_id)
        Object.keys(item).forEach(key => {
          if (!canKeys.includes(key)) {
            delete item[key]
          }
        })
      })
      console.log(values)
      const pa = []
      values.map(item => {
        pa.push(create(item))
      })
      const res = await Promise.all(pa).catch(_ => false)
      if (res) {
        ElMessage.success(T('OperationSuccess'))
        getList()
      }

    }
    reader.readAsText(file)
    return false
  }
  const toImport = () => {
    ElMessage.warning('暂未实现')
  }

  const ABFormVisible = ref(false)
  const clickRow = ref({})
  const toAddressBook = (row) => {
    clickRow.value = row
    ABFormVisible.value = true
  }

  const peerTable = ref(null)
  const multipleSelection = ref([])
  const selectedPending = computed(() => multipleSelection.value.filter(isPending))
  const selectedApproved = computed(() => multipleSelection.value.filter(row => !isPending(row)))
  const selectedPendingCount = computed(() => selectedPending.value.length)
  const selectedApprovedCount = computed(() => selectedApproved.value.length)
  const handleSelectionChange = (val) => {
    multipleSelection.value = val
  }
  const clearSelection = () => {
    peerTable.value?.clearSelection()
  }
  const toBatchApprove = async () => {
    if (!selectedPendingCount.value) return false
    const cf = await ElMessageBox.confirm(T('ApproveConfirm'), {
      confirmButtonText: T('Approve'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) return false
    const res = await approve({ row_ids: selectedPending.value.map(i => i.row_id) }).catch(_ => false)
    if (res) {
      ElMessage.success(T('ApproveSuccess'))
      clearSelection()
      getList()
      getPendingCount()
    }
  }
  const toBatchDelete = async () => {
    if (!multipleSelection.value.length) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('BatchDelete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }

    const res = await batchRemove({ row_ids: multipleSelection.value.map(i => i.row_id) }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      clearSelection()
      getList()
      getPendingCount()
    }
  }

  // 批量添加到地址簿 start
  const { allUsers, getAllUsers } = loadAllUsers()
  onMounted(getAllUsers)
  const {
    listRes: collectionListResForBatchCreateAB,
    listQuery: collectionListQueryForBatchCreateAB,
    getList: getCollectionListForBatchCreateAB,
  } = useCollectionRepositories('admin')
  collectionListQueryForBatchCreateAB.page_size = 9999
  const changeUserForBatchCreateAB = (val) => {
    batchABFormData.value.collection_id = 0
    collectionListQueryForBatchCreateAB.user_id = val
    getCollectionListForBatchCreateAB()
  }
  const batchABFormVisible = ref(false)
  const toBatchAddToAB = () => {
    if (!selectedApprovedCount.value) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    batchABFormVisible.value = true
  }
  const batchABFormData = ref({
    collection_id: 0,
    tags: [],
    peer_ids: [],
    user_id: null,
  })
  const submitBatchAddToAB = async () => {
    if (selectedApprovedCount.value === 0) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    batchABFormData.value.peer_ids = selectedApproved.value.map(i => i.row_id)
    if (!batchABFormData.value.peer_ids.length) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }

    const res = await batchCreateFromPeers(batchABFormData.value).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      batchABFormVisible.value = false
    }
  }
  // 批量添加到地址簿 end

  // 批量打标签 start
  const batchTagsVisible = ref(false)
  const batchTagsForm = reactive({ tags: [] })
  const tagListRes = reactive({ list: [], loading: false })
  const getTagList = async () => {
    tagListRes.loading = true
    const res = await tagList({ page: 1, page_size: 9999 }).catch(_ => false)
    tagListRes.loading = false
    if (res) {
      tagListRes.list = res.data.list
    }
  }
  const toBatchTags = () => {
    if (!selectedApprovedCount.value) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    batchTagsForm.tags = []
    batchTagsVisible.value = true
    getTagList()
  }
  const submitBatchTags = async () => {
    const res = await batchUpdateTags({
      row_ids: selectedApproved.value.map(i => i.row_id),
      tags: batchTagsForm.tags,
    }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      batchTagsVisible.value = false
      getList()
    }
  }
  // 批量打标签 end

  const columnSettingVisible = ref(false)
  const allColumns = ref([
    { name: 'id', visible: true, label: 'Id' },
    { name: 'online_status', visible: true, label: 'OnlineStatus' },
    { name: 'cpu', visible: false, label: 'Cpu' },
    { name: 'hostname', visible: true, label: 'Hostname' },
    { name: 'memory', visible: false, label: 'Memory' },
    { name: 'os', visible: true, label: 'Os' },
    { name: 'last_online_time', visible: true, label: 'LastOnlineTime' },
    { name: 'last_online_ip', visible: false, label: 'LastOnlineIp' },
    { name: 'username', visible: true, label: 'Username' },
    { name: 'group_id', visible: true, label: 'Group' },
    { name: 'uuid', visible: false, label: 'Uuid' },
    { name: 'version', visible: false, label: 'Version' },
    { name: 'alias', visible: false, label: 'Alias' },
    { name: 'created_at', visible: false, label: 'CreatedAt' },
    { name: 'updated_at', visible: false, label: 'UpdatedAt' },
  ])
  // 与本地保存的列配置按 name 合并：新增列默认可见，已删列自动剔除
  const savedColumns = JSON.parse(localStorage.getItem('peer_visible_columns') || 'null')
  const visibleColumns = ref(
    Array.isArray(savedColumns)
      ? allColumns.value.map(c => savedColumns.find(s => s.name === c.name) || c)
      : allColumns.value
  )
  const showColumnSetting = () => {
    columnSettingVisible.value = true
  }
  const saveColumnSetting = () => {
    localStorage.setItem('peer_visible_columns', JSON.stringify(visibleColumns.value))
    ElMessage.success(T('OperationSuccess'))
    columnSettingVisible.value = false
  }

  const upColumn = (index) => {
    if (index === 0) return
    const col = visibleColumns.value[index]
    visibleColumns.value.splice(index, 1)
    visibleColumns.value.splice(index - 1, 0, col)

  }
  const downColumn = (index) => {
    if (index === visibleColumns.value.length - 1) return
    const col = visibleColumns.value[index]
    visibleColumns.value.splice(index, 1)
    visibleColumns.value.splice(index + 1, 0, col)

  }
</script>

<style scoped lang="scss">
.pending-alert {
  margin-bottom: var(--yj-spacing-lg);

  &__link {
    margin-left: var(--yj-spacing-md);
    vertical-align: baseline;
  }
}

.yj-danger-text {
  color: var(--yj-danger);
}

.peer-id {
  display: inline-flex;
  align-items: center;
  gap: var(--yj-spacing-xs);

  .copy-icon {
    color: var(--yj-text-tertiary);
    cursor: pointer;
    transition: color var(--yj-duration-fast) var(--yj-easing-standard);

    &:hover {
      color: var(--yj-primary);
    }
  }
}
</style>
