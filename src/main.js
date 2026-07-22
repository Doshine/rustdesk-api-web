import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import {
  ElAlert,
  ElAside,
  ElBadge,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElCard,
  ElCheckbox,
  ElCheckboxGroup,
  ElColorPicker,
  ElConfigProvider,
  ElContainer,
  ElDialog,
  ElDrawer,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElHeader,
  ElIcon,
  ElImage,
  ElInput,
  ElInputNumber,
  ElLink,
  ElLoading,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElPagination,
  ElProgress,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElScrollbar,
  ElSelect,
  ElSkeleton,
  ElStep,
  ElSteps,
  ElSubMenu,
  ElSwitch,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTag,
  ElText,
  ElTooltip,
  ElTree,
  ElUpload,
} from 'element-plus'
import { router } from '@/router'
import 'normalize.css/normalize.css'
import { pinia } from '@/store'
import '@/permission'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/style.scss'
// W5 主题层：必须在 Element Plus 样式（含 dark/css-vars）之后加载才能覆盖生效
import '@/styles/tokens.css'
import '@/styles/element-overrides.css'
// W5 页面级样式：必须在主题层之后
import '@/styles/pages.scss'
import { ArrowDown, Expand, Fold } from '@element-plus/icons-vue'

const app = createApp(App)
const elementComponents = [
  ElAlert,
  ElAside,
  ElBadge,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElCard,
  ElCheckbox,
  ElCheckboxGroup,
  ElColorPicker,
  ElConfigProvider,
  ElContainer,
  ElDialog,
  ElDrawer,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElHeader,
  ElIcon,
  ElImage,
  ElInput,
  ElInputNumber,
  ElLink,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElPagination,
  ElProgress,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElScrollbar,
  ElSelect,
  ElSkeleton,
  ElStep,
  ElSteps,
  ElSubMenu,
  ElSwitch,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTag,
  ElText,
  ElTooltip,
  ElTree,
  ElUpload,
]
elementComponents.forEach(component => app.use(component))
app.use(ElLoading)
app.use(pinia)
app.use(router)
// 模板中仅有三处全局图标标签；其余页面均按需导入，避免把整套图标打进入口包。
app.component('ElIconArrowDown', ArrowDown)
app.component('ElIconExpand', Expand)
app.component('ElIconFold', Fold)
app.mount('#app')
