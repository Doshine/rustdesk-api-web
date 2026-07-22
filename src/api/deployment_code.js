import request from '@/utils/request'

export function list (params) {
  return request({ url: '/deployment_code/list', params })
}

export function create (data) {
  return request({ url: '/deployment_code/create', method: 'post', data })
}

export function revoke (data) {
  return request({ url: '/deployment_code/revoke', method: 'post', data })
}

export function rotate (data) {
  return request({ url: '/deployment_code/rotate', method: 'post', data })
}

export function audit (params) {
  return request({ url: '/deployment_code/audit', params })
}
