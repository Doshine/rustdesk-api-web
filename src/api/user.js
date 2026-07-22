import request from '@/utils/request'

export function login (data) {
  return request({
    url: '/login',
    method: 'post',
    data,
    hideErrorMessage: true,
  })
}

export function loginSms (data) {
  return request({
    url: '/login-sms',
    method: 'post',
    data,
    hideErrorMessage: true,
  })
}

export function current () {
  return request({
    url: '/user/current',
    method: 'get',
  })
}

export function list (params) {
  return request({
    url: '/user/list',
    params,
  })
}

export function detail (id) {
  return request({
    url: `/user/detail/${id}`,
  })
}

export function create (data) {
  return request({
    url: '/user/create',
    method: 'post',
    data,
  })
}

export function update (data) {
  return request({
    url: '/user/update',
    method: 'post',
    data,
  })
}

export function remove (data) {
  return request({
    url: '/user/delete',
    method: 'post',
    data,
  })
}

export function changePwd (data) {
  return request({
    url: '/user/changePwd',
    method: 'post',
    data,
  })
}

export function changeCurPwd (data) {
  return request({
    url: '/user/changeCurPwd',
    method: 'post',
    data,
  })
}

export function mfaEnroll () {
  return request({
    url: '/user/mfa/enroll',
    method: 'post',
  })
}

export function mfaEnable (data) {
  return request({
    url: '/user/mfa/enable',
    method: 'post',
    data,
  })
}

export function mfaDisable (data) {
  return request({
    url: '/user/mfa/disable',
    method: 'post',
    data,
  })
}

export function mfaBootstrapBegin (data) {
  return request({
    url: '/mfa/bootstrap/begin',
    method: 'post',
    data,
    hideErrorMessage: true,
  })
}

export function mfaBootstrapComplete (data) {
  return request({
    url: '/mfa/bootstrap/complete',
    method: 'post',
    data,
    hideErrorMessage: true,
  })
}

export function passkeyRegisterBegin () {
  return request({ url: '/user/passkeys/register/begin', method: 'post', data: {}, hideErrorMessage: true })
}

export function passkeyRegisterComplete (data) {
  return request({ url: '/user/passkeys/register/complete', method: 'post', data, hideErrorMessage: true })
}

export function passkeyList () {
  return request({ url: '/user/passkeys', method: 'get', hideErrorMessage: true })
}

export function passkeyRevoke (id, data = {}) {
  return request({ url: `/user/passkeys/${id}`, method: 'delete', data, hideErrorMessage: true })
}

export function myOauth () {
  return request({
    url: '/user/myOauth',
    method: 'post',
  })
}

export function myPeer (params) {
  return request({
    url: '/user/myPeer',
    params,
  })
}

export function groupUsers (data) {
  return request({
    url: '/user/groupUsers',
    method: 'post',
    data,
  })
}

export function register (data) {
  return request({
    url: '/user/register',
    method: 'post',
    data,
  })
}
