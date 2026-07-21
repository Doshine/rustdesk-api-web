import request from '@/utils/request'

// 中继节点管理（后端契约并行开发，按此对接）
// GET  /api/admin/relay-nodes/list?name=&page=&page_size=
// POST /api/admin/relay-nodes/create | update（全字段）
// POST /api/admin/relay-nodes/delete {row_ids}
// POST /api/admin/relay-nodes/test {row_id} 或 {host,port} → data {ok,latency_ms,error}

export function listRelayNodes (params) {
  return request({
    url: '/relay-nodes/list',
    params,
  })
}

export function createRelayNode (data) {
  return request({
    url: '/relay-nodes/create',
    method: 'post',
    data,
  })
}

export function updateRelayNode (data) {
  return request({
    url: '/relay-nodes/update',
    method: 'post',
    data,
  })
}

export function deleteRelayNodes (data) {
  return request({
    url: '/relay-nodes/delete',
    method: 'post',
    data,
  })
}

// 测试连通性：失败结果在按钮/行内展示，跳过全局错误 toast
export function testRelayNode (data) {
  return request({
    url: '/relay-nodes/test',
    method: 'post',
    data,
    hideErrorMessage: true,
  })
}
