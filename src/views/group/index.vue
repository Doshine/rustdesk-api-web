<template>
  <div class="control-page">
    <YjPageHeader
        eyebrow="ACCESS POLICIES"
        :title="T('GroupManage')"
        :description="T('GroupManageDescription')"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="toAdd">{{ T('AddGroup') }}</el-button>
      </template>
    </YjPageHeader>

    <el-card class="list-body" shadow="never">
      <div class="table-summary-bar">
        <span>{{ T('GroupSummary', { n: listRes.total }) }}</span>
      </div>
      <el-table :data="listRes.list" v-loading="listRes.loading">
        <el-table-column prop="id" label="ID" align="center" width="80" class-name="yj-mono"/>
        <el-table-column prop="name" :label="T('Name')" min-width="180" show-overflow-tooltip/>
        <el-table-column prop="type" :label="T('Type')" width="130">
          <template #default="{row}">
            <span class="neutral-chip">{{ row.type === 1 ? T('CommonGroup') : T('SharedGroup') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('NavigationPolicy')" min-width="260">
          <template #default="{row}">
            <div class="nav-policy-cell">
              <el-icon><Compass/></el-icon>
              <span>
                <strong>{{ navPolicyTitle(row) }}</strong>
                <small>{{ navPolicyMeta(row) }}</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="T('CreatedAt')" width="170" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column prop="updated_at" :label="T('UpdatedAt')" width="170" class-name="yj-mono" show-overflow-tooltip/>
        <el-table-column :label="T('Actions')" align="center" width="112" class-name="table-actions" fixed="right">
          <template #default="{row}">
            <el-tooltip :content="T('Edit')" placement="top">
              <el-button type="primary" circle :icon="Edit" :aria-label="T('Edit')" @click="toEdit(row)"/>
            </el-tooltip>
            <el-tooltip :content="T('Delete')" placement="top">
              <el-button type="danger" circle :icon="Delete" :aria-label="T('Delete')" @click="del(row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <YjEmpty>
            <template #action>
              <el-button type="primary" @click="toAdd">{{ T('AddGroup') }}</el-button>
            </template>
          </YjEmpty>
        </template>
      </el-table>
    </el-card>

    <el-card class="list-page" shadow="never">
      <el-pagination
          background
          layout="prev, pager, next, sizes, jumper"
          :page-sizes="[10,20,50,100]"
          v-model:page-size="listQuery.page_size"
          v-model:current-page="listQuery.page"
          :total="listRes.total"
      />
    </el-card>

    <el-dialog
        v-model="formVisible"
        class="policy-dialog"
        :title="!formData.id ? T('CreateGroup') : T('UpdateGroup')"
        width="760"
        top="4vh"
        destroy-on-close
    >
      <el-form class="group-form" ref="form" :model="formData" label-position="top">
        <section class="form-section">
          <div class="form-section__heading">
            <span class="form-section__index">01</span>
            <span>
              <strong>{{ T('GroupIdentity') }}</strong>
              <small>{{ T('GroupIdentityDescription') }}</small>
            </span>
          </div>
          <div class="group-form__grid">
            <el-form-item :label="T('Name')" prop="name" required>
              <el-input v-model="formData.name"/>
            </el-form-item>
            <el-form-item :label="T('Type')" prop="type" required>
              <el-select v-model="formData.type">
                <el-option
                    v-for="item in groupTypes"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <p class="group-type-note">{{ activeGroupTypeNote }}</p>
        </section>

        <section class="form-section">
          <div class="form-section__heading">
            <span class="form-section__index">02</span>
            <span>
              <strong>{{ T('NavigationPolicy') }}</strong>
              <small>{{ T('NavigationPolicyDescription') }}</small>
            </span>
          </div>

          <el-radio-group v-model="policyMode" class="policy-mode">
            <el-radio-button value="default">
              <span class="policy-mode__label">{{ T('DefaultNavigation') }}</span>
              <small>{{ T('DefaultNavigationDescription') }}</small>
            </el-radio-button>
            <el-radio-button value="custom">
              <span class="policy-mode__label">{{ T('CustomNavigation') }}</span>
              <small>{{ T('CustomNavigationDescription') }}</small>
            </el-radio-button>
          </el-radio-group>

          <div v-if="policyMode === 'custom'" class="navigation-editor">
            <div class="navigation-editor__toolbar">
              <span>{{ T('SelfServiceEntries') }}</span>
              <span>
                <el-button text @click="selectAllRoutes">{{ T('SelectAll') }}</el-button>
                <el-button text @click="clearRoutes">{{ T('ClearAll') }}</el-button>
              </span>
            </div>
            <el-checkbox-group v-model="formData.route_names" class="route-options">
              <el-checkbox
                  v-for="item in routeOptions"
                  :key="item.name"
                  :value="item.name"
                  class="route-option"
              >
                <span class="route-option__title">{{ item.title }}</span>
                <span class="route-option__code">{{ item.name }}</span>
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <div class="security-boundary-note">
            <el-icon><Lock/></el-icon>
            <span>{{ T('NavigationSecurityNote') }}</span>
          </div>
        </section>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ T('SavePolicy') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
  import { create, list, remove, update } from '@/api/group'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { T } from '@/utils/i18n'
  import { Compass, Delete, Edit, Lock, Plus } from '@element-plus/icons-vue'
  import { asyncRoutes } from '@/router'
  import YjEmpty from '@/components/yj/YjEmpty.vue'
  import YjPageHeader from '@/components/yj/YjPageHeader.vue'

  const listRes = reactive({ list: [], total: 0, loading: false })
  const listQuery = reactive({ page: 1, page_size: 10 })

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
    if (listQuery.page === 1) getList()
    else listQuery.page = 1
  }

  const del = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) return false

    const res = await remove({ id: row.id }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
    }
  }

  onMounted(getList)
  onActivated(getList)
  watch(() => listQuery.page, getList)
  watch(() => listQuery.page_size, handlerQuery)

  const groupTypes = computed(() => [
    { label: T('CommonGroup'), value: 1, note: T('CommonGroupNote') },
    { label: T('SharedGroup'), value: 2, note: T('SharedGroupNote') },
  ])

  // 组导航只开放后端默认允许的自助路由，避免把无接口权限的管理页面展示给普通用户。
  const selfServiceRouteNames = [
    'MyInfo',
    'MyPeer',
    'MyAddressBookCollection',
    'MyAddressBookList',
    'MyTagList',
    'MyShareRecordList',
    'MyLoginLog',
  ]
  const myRoute = asyncRoutes.find(route => route.name === 'My')
  const routeOptions = computed(() => (myRoute?.children || [])
    .filter(route => selfServiceRouteNames.includes(route.name))
    .map(route => ({ name: route.name, title: T(route.meta?.title || route.name) })))

  const parseRouteNames = (val) => {
    if (!val) return []
    try {
      const names = JSON.parse(val)
      return Array.isArray(names) ? names.filter(name => selfServiceRouteNames.includes(name)) : []
    } catch (_) {
      return []
    }
  }
  const navPolicyTitle = (row) => parseRouteNames(row.route_names).length
    ? T('CustomNavigation')
    : T('DefaultNavigation')
  const navPolicyMeta = (row) => {
    const count = parseRouteNames(row.route_names).length
    return count
      ? T('CustomNavigationCount', { n: count })
      : T('DefaultNavigationCount', { n: selfServiceRouteNames.length })
  }

  const formVisible = ref(false)
  const policyMode = ref('default')
  const formData = reactive({ id: 0, name: '', type: 1, route_names: [] })
  const activeGroupTypeNote = computed(() =>
    groupTypes.value.find(item => item.value === formData.type)?.note || '')

  const resetForm = () => {
    formData.id = 0
    formData.name = ''
    formData.type = 1
    formData.route_names = selfServiceRouteNames.slice()
    policyMode.value = 'default'
  }
  const toEdit = (row) => {
    const names = parseRouteNames(row.route_names)
    formData.id = row.id
    formData.name = row.name
    formData.type = row.type
    formData.route_names = names.length ? names : selfServiceRouteNames.slice()
    policyMode.value = names.length ? 'custom' : 'default'
    formVisible.value = true
  }
  const toAdd = () => {
    resetForm()
    formVisible.value = true
  }
  const selectAllRoutes = () => {
    formData.route_names = selfServiceRouteNames.slice()
  }
  const clearRoutes = () => {
    formData.route_names = []
  }
  const submit = async () => {
    if (!formData.name.trim()) {
      ElMessage.warning(T('ParamRequired', { param: T('Name') }))
      return false
    }
    if (policyMode.value === 'custom' && !formData.route_names.length) {
      ElMessage.warning(T('NavigationRequired'))
      return false
    }
    const routeNames = policyMode.value === 'default'
      ? ''
      : JSON.stringify(formData.route_names)
    const api = formData.id ? update : create
    const res = await api({ ...formData, route_names: routeNames }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      formVisible.value = false
      getList()
    }
  }
</script>

<style scoped lang="scss">
.nav-policy-cell {
  display: flex;
  align-items: center;
  gap: var(--yj-spacing-md);

  > .el-icon {
    flex: none;
    width: 30px;
    height: 30px;
    border: 1px solid var(--yj-border);
    border-radius: var(--yj-radius-md);
    background: var(--yj-surface-hover);
    color: var(--yj-primary);
  }

  span {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  strong {
    color: var(--yj-text-primary);
    font-size: var(--yj-font-size-base);
    font-weight: var(--yj-font-weight-medium);
  }

  small {
    color: var(--yj-text-tertiary);
    font-size: var(--yj-font-size-sm);
  }
}

.group-form {
  display: grid;
  gap: var(--yj-spacing-xl);

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(180px, .6fr);
    gap: var(--yj-spacing-lg);
  }
}

.form-section {
  padding: var(--yj-spacing-xl);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-lg);
  background: var(--yj-surface);

  &__heading {
    display: flex;
    align-items: flex-start;
    gap: var(--yj-spacing-md);
    margin-bottom: var(--yj-spacing-xl);

    > span:last-child {
      display: flex;
      flex-direction: column;
      gap: var(--yj-spacing-xs);
    }

    strong {
      color: var(--yj-text-primary);
      font-size: var(--yj-font-size-md);
      font-weight: var(--yj-font-weight-semibold);
    }

    small {
      color: var(--yj-text-tertiary);
      font-size: var(--yj-font-size-sm);
      line-height: var(--yj-line-height-base);
    }
  }

  &__index {
    color: var(--yj-primary);
    font-family: var(--yj-font-family-mono);
    font-size: var(--yj-font-size-sm);
    font-weight: var(--yj-font-weight-semibold);
    letter-spacing: .08em;
  }
}

.group-type-note {
  margin: calc(var(--yj-spacing-sm) * -1) 0 0;
  color: var(--yj-text-tertiary);
  font-size: var(--yj-font-size-sm);
}

.policy-mode {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;

  :deep(.el-radio-button__inner) {
    display: flex;
    align-items: flex-start;
    min-height: 76px;
    padding: var(--yj-spacing-lg);
    flex-direction: column;
    gap: var(--yj-spacing-xs);
    width: 100%;
    border-color: var(--yj-border);
    border-radius: 0;
    box-shadow: none;
    text-align: left;
    white-space: normal;
  }

  :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: var(--yj-radius-md) 0 0 var(--yj-radius-md);
  }

  :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 var(--yj-radius-md) var(--yj-radius-md) 0;
  }

  :deep(.el-radio-button.is-active .el-radio-button__inner) {
    border-color: var(--yj-primary);
    background: var(--yj-surface-selected);
    color: var(--yj-text-primary);
  }

  &__label {
    font-weight: var(--yj-font-weight-semibold);
  }

  small {
    color: var(--yj-text-tertiary);
    font-size: var(--yj-font-size-sm);
    line-height: var(--yj-line-height-base);
  }
}

.navigation-editor {
  margin-top: var(--yj-spacing-lg);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-md);
  overflow: hidden;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 0 var(--yj-spacing-lg);
    border-bottom: 1px solid var(--yj-divider);
    background: var(--yj-surface-hover);
    color: var(--yj-text-secondary);
    font-size: var(--yj-font-size-sm);
    font-weight: var(--yj-font-weight-medium);
  }
}

.route-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  padding: var(--yj-spacing-sm);
}

.route-option {
  display: flex;
  align-items: flex-start;
  min-height: 58px;
  margin: 0 !important;
  padding: var(--yj-spacing-md);
  border-radius: var(--yj-radius-md);

  &:hover {
    background: var(--yj-surface-hover);
  }

  :deep(.el-checkbox__label) {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--yj-spacing-xxs);
  }

  &__title {
    color: var(--yj-text-primary);
    font-size: var(--yj-font-size-base);
  }

  &__code {
    color: var(--yj-text-tertiary);
    font-family: var(--yj-font-family-mono);
    font-size: var(--yj-font-size-xs);
  }
}

.security-boundary-note {
  display: flex;
  align-items: flex-start;
  gap: var(--yj-spacing-sm);
  margin-top: var(--yj-spacing-lg);
  padding: var(--yj-spacing-md) var(--yj-spacing-lg);
  border-left: 2px solid var(--yj-primary);
  background: var(--yj-surface-hover);
  color: var(--yj-text-secondary);
  font-size: var(--yj-font-size-sm);
  line-height: var(--yj-line-height-base);

  .el-icon {
    flex: none;
    margin-top: 2px;
    color: var(--yj-primary);
  }
}

@media (max-width: 768px) {
  .group-form__grid,
  .policy-mode,
  .route-options {
    grid-template-columns: 1fr;
  }

  .policy-mode {
    gap: var(--yj-spacing-sm);

    :deep(.el-radio-button__inner),
    :deep(.el-radio-button:first-child .el-radio-button__inner),
    :deep(.el-radio-button:last-child .el-radio-button__inner) {
      border: 1px solid var(--yj-border);
      border-radius: var(--yj-radius-md);
    }
  }

  .form-section {
    padding: var(--yj-spacing-lg);
  }
}

:global(.policy-dialog) {
  display: flex;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  flex-direction: column;
}

:global(.policy-dialog .el-dialog__header),
:global(.policy-dialog .el-dialog__footer) {
  flex: none;
}

:global(.policy-dialog .el-dialog__body) {
  min-height: 0;
  overflow-y: auto;
}
</style>
