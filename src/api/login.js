import request from '@/utils/request'

export function loginOptions () {
  return request({
    url: '/login-options',
    method: 'get',
    hideErrorMessage: true,
  })
}

export function oidcAuth (data) {
  return request({
    url: '/oidc/auth',
    method: 'post',
    data,
  })
}

export function oidcQuery (params) {
  return request({
    url: '/oidc/auth-query',
    method: 'get',
    params,
  })
}

export function captcha () {
  return request({
    url: '/captcha',
    method: 'get',
    hideErrorMessage: true,
  })
}

export function smsCode (data) {
  return request({
    url: '/sms-code',
    method: 'post',
    data,
    hideErrorMessage: true,
  })
}
