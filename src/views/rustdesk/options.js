import { ElMessageBox } from 'element-plus'
import { T } from '@/utils/i18n'

export const ID_TARGET = '21115'

export const RELAY_TARGET = '21117'

/**
 * 设置中心左侧二级导航分组（规范 v2.1 §2.3-D：安全 / 网络 / 用量）
 * key 同时作为 URL query（?panel=xxx）直达标识
 */
export const SETTINGS_NAV = [
  {
    key: 'security',
    label: '安全',
    items: [
      { key: 'blacklist', label: 'IP 黑名单', risk: true },
      { key: 'blocklist', label: '封禁列表', risk: true },
      { key: 'must_login', label: '强制登录', risk: true },
    ],
  },
  {
    key: 'network',
    label: '网络',
    items: [
      { key: 'always_use_relay', label: '强制中继', risk: true },
      { key: 'relay_nodes', label: 'RelayNodes', risk: false },
      { key: 'control', label: '命令控制台', risk: false },
    ],
  },
  {
    key: 'usage',
    label: '用量',
    items: [
      { key: 'usage', label: '流量统计', risk: false },
    ],
  },
]

/**
 * 高风险修改确认框文案（规范 v2.1 §2.3-D：明确影响范围与回滚方式）
 */
export const RISK_CONFIRM = {
  relay_apply: {
    title: '确认应用节点配置到服务器？',
    impact: '应用后 ID 服务器的中继列表将被节点表中的启用节点覆盖，全部在线会话将中断并按新列表重连。',
    rollback: '调整节点表（启用/停用/编辑节点）后再次点击「应用到服务器」即可恢复。',
  },
  always_use_relay: {
    title: '确认修改强制中继策略？',
    impact: '开启后所有新连接强制走中继服务器（不再尝试 P2P 直连），在线会话将中断重连，可能增加延迟。',
    rollback: '将开关改回原状态并保存即可恢复；保存后会自动重存中继服务器列表以防被重置。',
  },
  must_login: {
    title: '确认修改强制登录策略？',
    impact: '开启后未登录账号的客户端将无法通过本服务建立连接，在线的未登录会话可能被中断。',
    rollback: '将开关改回原状态并保存即可恢复。',
  },
  blacklist_add: {
    title: '确认添加 IP 黑名单？',
    impact: '命中 IP 的客户端将被中继服务器拒绝服务，相关在线连接会立即中断。',
    rollback: '在黑名单中删除对应 IP 即可恢复（删除全部填 all）。',
  },
  blacklist_remove: {
    title: '确认删除黑名单条目？',
    impact: '解除后这些 IP 可重新使用中继服务建立连接。',
    rollback: '重新添加对应 IP 即可恢复。',
  },
  blocklist_add: {
    title: '确认添加封禁条目？',
    impact: '命中对象将被阻止建立或继续连接，在线会话会立即中断。',
    rollback: '在封禁列表中删除对应条目即可恢复（删除全部填 all）。',
  },
  blocklist_remove: {
    title: '确认删除封禁条目？',
    impact: '解除后这些对象可重新通过中继建立连接。',
    rollback: '重新添加对应条目即可恢复。',
  },
  relay_node_delete: {
    title: '确认删除中继节点？',
    impact: '删除后，新分发的客户端配置将不再包含该节点；正在使用该节点的连接在下次重连时会切换到其他可用中继。',
    rollback: '重新添加相同 host:port 的节点并启用即可恢复。',
  },
}

/**
 * 高风险操作确认对话框，用户确认 resolve(true)，取消 resolve(false)
 * @param {keyof typeof RISK_CONFIRM} key
 * @returns {Promise<boolean>}
 */
export function confirmRisk (key) {
  const c = RISK_CONFIRM[key]
  if (!c) {
    return Promise.resolve(true)
  }
  return ElMessageBox.confirm(
    `<div class="yj-risk-confirm"><p><strong>影响范围</strong>：${c.impact}</p><p><strong>回滚方式</strong>：${c.rollback}</p></div>`,
    c.title,
    {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
      dangerouslyUseHTMLString: true,
    },
  ).then(() => true).catch(() => false)
}

/**
 * 密钥/密码类字段脱敏：仅显示末四位（规范 v2.1 §2.3-D）
 * 匹配 key= / token= / secret= / password= / pwd= 形式
 * @param {string} str
 * @returns {string}
 */
export function maskSecrets (str) {
  if (!str) {
    return str
  }
  return String(str).replace(/((?:key|token|secret|password|pwd)\s*[=:]\s*)([^\s,;|]+)/gi, (m, prefix, val) => {
    if (val.length <= 4) {
      return `${prefix}••••`
    }
    return `${prefix}••••${val.slice(-4)}`
  })
}
