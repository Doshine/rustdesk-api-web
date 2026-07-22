<template>
  <div class="control-page">
    <YjPageHeader
      eyebrow="IDENTITY & ACCESS"
      :title="T('UserManage')"
      :description="T('UserManageDescription')"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="toAdd">{{ T('AddUser') }}</el-button>
        <el-button @click="toExport">{{ T('Export') }}</el-button>
      </template>
    </YjPageHeader>

    <el-card class="list-query" shadow="never">
      <YjFilterBar @search="handlerQuery" @reset="onResetFilter">
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username" clearable @keyup.enter="handlerQuery"></el-input>
        </el-form-item>
        <el-form-item :label="T('Status')">
          <el-select v-model="listQuery.status" clearable>
            <el-option :label="T('Enable')" :value="ENABLE_STATUS"></el-option>
            <el-option :label="T('Disable')" :value="DISABLE_STATUS"></el-option>
          </el-select>
        </el-form-item>
      </YjFilterBar>
    </el-card>
    <el-card class="list-body" shadow="never">
      <div class="table-summary-bar">
        <span>{{ T('DashboardTotalUsers') }} <strong>{{ listRes.total }}</strong></span>
      </div>
      <el-table :data="listRes.list" v-loading="listRes.loading">
        <el-table-column prop="id" label="ID" align="center" width="80"></el-table-column>
        <el-table-column prop="username" :label="T('Username')" align="center" min-width="180" show-overflow-tooltip/>
        <el-table-column prop="email" :label="T('Email')" align="center" min-width="180" show-overflow-tooltip/>
        <el-table-column prop="nickname" :label="T('Nickname')" align="center" width="120" show-overflow-tooltip/>
        <el-table-column prop="role" :label="T('Role')" align="center" width="110">
          <template #default="{row}">
            <span class="role-code">{{ row.role || 'user' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Group')" align="center" width="120">
          <template #default="{row}">
            <span v-if="row.group_id" class="neutral-chip">{{ listRes.groups?.find(g => g.id === row.group_id)?.name || '-' }}</span>
            <span v-else> - </span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" align="center" width="148">
          <template #default="{row}">
            <span class="status-control">
              <YjStatusDot
                :status="row.status === ENABLE_STATUS ? 'online' : 'offline'"
                :text="row.status === ENABLE_STATUS ? T('Enable') : T('Disable')"
              />
              <el-switch v-model="row.status"
                         :active-value="ENABLE_STATUS"
                         :inactive-value="DISABLE_STATUS"
                         :aria-label="T('Status')"
                         @change="changeStatus(row)"
              ></el-switch>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="T('Remark')" align="center" width="160" show-overflow-tooltip/>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" width="160" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column prop="updated_at" :label="T('UpdatedAt')" align="center" width="160" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column :label="T('Actions')" align="center" width="120" class-name="table-actions" fixed="right">
          <template #default="{row}">
            <el-tooltip :content="T('Edit')" placement="top">
              <el-button type="primary" circle :icon="Edit" :aria-label="T('Edit')" @click="toEdit(row)"/>
            </el-tooltip>
            <el-dropdown trigger="click" @command="(cmd) => handleRowCommand(cmd, row)">
              <el-button circle :icon="MoreFilled" :aria-label="T('More')"/>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="tag">{{ T('UserTags') }}</el-dropdown-item>
                  <el-dropdown-item command="ab">{{ T('UserAddressBook') }}</el-dropdown-item>
                  <el-dropdown-item command="resetPwd">{{ T('ResetPassword') }}</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <span class="yj-danger-text">{{ T('Delete') }}</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <template #empty>
          <YjEmpty>
            <template #action>
              <el-button type="primary" @click="toAdd">{{ T('AddUser') }}</el-button>
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
  </div>
</template>

<script setup>
  import { useRepositories, useDel, useToEditOrAdd, useChangePwd } from '@/views/user/composables'
  import { T } from '@/utils/i18n'
  import { DISABLE_STATUS, ENABLE_STATUS } from '@/utils/common_options'
  import { update } from '@/api/user'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { onMounted, watch } from 'vue'
  import { Edit, MoreFilled, Plus } from '@element-plus/icons-vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'
  import YjFilterBar from '@/components/yj/YjFilterBar.vue'
  import YjEmpty from '@/components/yj/YjEmpty.vue'
  import YjStatusDot from '@/components/yj/YjStatusDot.vue'
  //列表
  const {
    listRes,
    listQuery,
    handlerQuery,
    getList,
    getGroups,
    toExport,
  } = useRepositories()

  onMounted(getGroups)

  onMounted(getList)

  watch(() => listQuery.page, getList)
  watch(() => listQuery.page_size, handlerQuery)

  const onResetFilter = () => {
    listQuery.username = ''
    listQuery.status = ''
    handlerQuery()
  }

  const { toEdit, toAdd, toAddressBook, toTag } = useToEditOrAdd()

  const { changePass } = useChangePwd()

  //删除
  const { del } = useDel()
  const remove = async (row) => {
    const res = await del(row.id)
    if (res) {
      getList(listQuery)
    }
  }

  // 行内「更多」菜单：标签 / 地址簿 / 重置密码 / 删除
  const handleRowCommand = (cmd, row) => {
    if (cmd === 'tag') toTag(row)
    else if (cmd === 'ab') toAddressBook(row)
    else if (cmd === 'resetPwd') changePass(row)
    else if (cmd === 'delete') remove(row)
  }

  const changeStatus = async (row) => {
    /*const confirm = await ElMessageBox.confirm(T('Confirm?', { param: T('Update') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
    }).catch(_ => false)
    if (!confirm) {
      return false
    }*/
    const res = await update(row).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList(listQuery)
    }
  }

</script>

<style scoped lang="scss">
.yj-danger-text {
  color: var(--yj-danger);
}
</style>
