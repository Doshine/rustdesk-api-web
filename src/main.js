import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { router } from '@/router'
import 'normalize.css/normalize.css'
import { pinia } from '@/store'
import '@/permission'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/style.scss'
// W5 主题层：必须在 Element Plus 样式（含 dark/css-vars）之后加载才能覆盖生效
import '@/styles/tokens.css'
import '@/styles/element-overrides.css'
import * as ElementIcons from '@element-plus/icons'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(pinia)
app.use(router)
for (let icon in ElementIcons){
  app.component("ElIcon" +icon ,ElementIcons[icon])
}
app.mount('#app')
