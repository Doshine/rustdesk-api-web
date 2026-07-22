const TokenKey = 'access_token'
const OidcCode = 'oidc_code'
const OidcCodeExpiry = 'oidc_code_expiry';

export function getToken () {
  // Remove credentials persisted by older releases before reading the tab-scoped copy.
  localStorage.removeItem(TokenKey)
  localStorage.removeItem('wc-option:local:access_token')
  return sessionStorage.getItem(TokenKey)
}

export function setToken (token) {
  localStorage.removeItem(TokenKey)
  localStorage.removeItem('wc-option:local:access_token')
  return sessionStorage.setItem(TokenKey, token)
}

export function removeToken () {
  localStorage.removeItem(TokenKey)
  localStorage.removeItem('wc-option:local:access_token')
  return sessionStorage.removeItem(TokenKey)
}

// 设置 code，并存储当前时间戳（单位：毫秒）
export function setCode(code) {
  const now = Date.now(); // 当前时间戳（毫秒）
  const expiry = now + 60 * 1000; // 60 秒后过期

  sessionStorage.setItem(OidcCode, code)
  sessionStorage.setItem(OidcCodeExpiry, expiry)
}

// 获取 code，如果已过期则删除并返回 null
export function getCode() {
  const expiry = sessionStorage.getItem(OidcCodeExpiry)
  const now = Date.now(); // 当前时间戳

  if (expiry && now > parseInt(expiry)) {
    // 如果已过期，删除 code 和过期时间
    removeCode();
    return null;
  }
  return sessionStorage.getItem(OidcCode)
}

// 删除 code 和过期时间
export function removeCode() {
  localStorage.removeItem(OidcCode)
  localStorage.removeItem(OidcCodeExpiry)
  sessionStorage.removeItem(OidcCode)
  sessionStorage.removeItem(OidcCodeExpiry)
}
