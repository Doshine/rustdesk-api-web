<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <!--        <el-form-item label="名称">
                  <el-input v-model="listQuery.name"></el-input>
                </el-form-item>-->
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="danger" @click="toAdd">{{ T('Add') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <el-table :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" label="ID" align="center"></el-table-column>
        <el-table-column prop="name" :label="T('Name')" align="center"/>
        <el-table-column prop="type" :label="T('Type')" align="center">
          <template #default="{row}">
            <span v-if="row.type === 1">{{ T('CommonGroup') }}</span>
            <span v-else>{{ T('SharedGroup') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('NavVisibility')" align="center" width="140">
          <template #default="{row}">
            <span>{{ navVisibilityText(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center"/>
        <el-table-column prop="updated_at" :label="T('UpdatedAt')" align="center"/>
        <el-table-column :label="T('Actions')" align="center" width="120" class-name="table-actions">
          <template #default="{row}">
            <el-tooltip :content="T('Edit')" placement="top">
              <el-button circle :icon="Edit" @click="toEdit(row)"/>
            </el-tooltip>
            <el-tooltip :content="T('Delete')" placement="top">
              <el-button type="danger" circle :icon="Delete" @click="del(row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
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
    <el-dialog v-model="formVisible" :title="!formData.id?T('Create'):T('Update')" width="800">
      <el-form class="dialog-form" ref="form" :model="formData" label-width="120px">
        <el-form-item :label="T('Name')" prop="name" required>
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item :label="T('Type')" prop="type" required>
          <el-radio-group v-model="formData.type">
            <el-radio v-for="item in groupTypes" :key="item.value" :label="item.value" style="display: block">
              {{ item.label }}
              <span style="font-size: 12px;color: #999">{{ item.note }}</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="T('NavVisibility')">
          <div class="route-tree-wrap">
            <el-tree
                :key="treeKey"
                ref="routeTree"
                :data="routeTreeData"
                show-checkbox
                node-key="name"
                :props="{ label: 'title', children: 'children' }"
                :default-checked-keys="formData.route_names"
                default-expand-all
            />
            <p class="route-tree-note">{{ T('NavVisibilityNote') }}</p>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
          <el-button @click="submit" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
  import { onMounted, reactive, watch, ref, onActivated } from 'vue'
  import { list, create, update, detail, remove } from '@/api/group'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { T } from '@/utils/i18n'
  import { Delete, Edit } from '@element-plus/icons'

  const listRes = reactive({
    list: [], total: 0, loading: false,
  })
  const listQuery = reactive({
    page: 1,
    page_size: 10,
  })

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

  const groupTypes = [
    { label: T('CommonGroup'), value: 1, note: T('CommonGroupNote') },
    { label: T('SharedGroup'), value: 2, note: T('SharedGroupNote') },
  ]

  // 导航可见性：基于 asyncRoutes 的 route_names 勾选树（仅控制菜单可见性，空 = 默认全部）
  import { asyncRoutes } from '@/router'

  const buildRouteTree = (routes) => routes
    .filter(r => r.name && !r.meta?.hide)
    .map(r => ({
      name: r.name,
      title: T(r.meta?.title || r.name),
      children: r.children?.length ? buildRouteTree(r.children) : [],
    }))

  const routeTreeData = buildRouteTree(asyncRoutes)
  const allRouteNames = []
  const flattenNames = (nodes) => nodes.forEach(n => {
    allRouteNames.push(n.name)
    if (n.children?.length) flattenNames(n.children)
  })
  flattenNames(routeTreeData)

  const routeTree = ref(null)
  const treeKey = ref(0)

  const parseRouteNames = (val) => {
    if (!val) return []
    try {
      const arr = JSON.parse(val)
      return Array.isArray(arr) ? arr : []
    } catch (_) {
      return []
    }
  }
  const navVisibilityText = (row) => {
    const names = parseRouteNames(row.route_names)
    return names.length ? T('NavVisibilityCount', { n: names.length }) : T('NavVisibilityAll')
  }

  const formVisible = ref(false)
  const formData = reactive({
    id: 0,
    name: '',
    type: 1,
    route_names: [],
  })

  const toEdit = (row) => {
    formVisible.value = true
    formData.id = row.id
    formData.name = row.name
    formData.type = row.type
    formData.route_names = parseRouteNames(row.route_names)
    treeKey.value++
  }
  const toAdd = () => {
    formVisible.value = true
    formData.id = 0
    formData.name = ''
    formData.type = 1
    formData.route_names = allRouteNames.slice() // 新建默认全选 = 默认全部
    treeKey.value++
  }
  const submit = async () => {
    const checked = routeTree.value ? routeTree.value.getCheckedKeys() : formData.route_names
    const halfChecked = routeTree.value ? routeTree.value.getHalfCheckedKeys() : []
    const names = [...new Set([...checked, ...halfChecked])]
    // 全选等同于默认全部 → 存空字符串
    const routeNamesStr = names.length >= allRouteNames.length ? '' : JSON.stringify(names)
    const api = formData.id ? update : create
    const res = await api({ ...formData, route_names: routeNamesStr }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      formVisible.value = false
      getList()
    }
  }

</script>

<style scoped lang="scss">
.route-tree-wrap {
  width: 100%;
  padding: var(--yj-spacing-md) var(--yj-spacing-lg);
  border: 1px solid var(--yj-border);
  border-radius: var(--yj-radius-md);
  max-height: 320px;
  overflow: auto;
}

.route-tree-note {
  margin: var(--yj-spacing-sm) 0 0;
  font-size: var(--yj-font-size-sm);
  line-height: var(--yj-line-height-base);
  color: var(--yj-text-tertiary);
}
</style>
