const base64UrlToBytes = (value) => {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = window.atob(padded)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

const bytesToBase64Url = (value) => {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value || [])
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const publicKeyOptions = (payload) => payload?.publicKey || payload?.public_key?.publicKey || payload?.public_key || payload

export const isPasskeySupported = () => Boolean(window.PublicKeyCredential && navigator.credentials?.create && navigator.credentials?.get)

export const decodeCreationOptions = (payload) => {
  const options = publicKeyOptions(payload)
  if (!options) return null
  return {
    ...options,
    challenge: base64UrlToBytes(options.challenge),
    user: options.user ? { ...options.user, id: base64UrlToBytes(options.user.id) } : options.user,
    excludeCredentials: (options.excludeCredentials || []).map(item => ({ ...item, id: base64UrlToBytes(item.id) })),
  }
}

export const decodeRequestOptions = (payload) => {
  const options = publicKeyOptions(payload)
  if (!options) return null
  return {
    ...options,
    challenge: base64UrlToBytes(options.challenge),
    allowCredentials: (options.allowCredentials || []).map(item => ({ ...item, id: base64UrlToBytes(item.id) })),
  }
}

export const serializeCredential = (credential) => {
  if (!credential) return null
  const response = credential.response || {}
  const result = {
    id: credential.id,
    rawId: bytesToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bytesToBase64Url(response.clientDataJSON),
      authenticatorData: response.authenticatorData ? bytesToBase64Url(response.authenticatorData) : undefined,
      attestationObject: response.attestationObject ? bytesToBase64Url(response.attestationObject) : undefined,
      signature: response.signature ? bytesToBase64Url(response.signature) : undefined,
      userHandle: response.userHandle ? bytesToBase64Url(response.userHandle) : undefined,
      transports: typeof response.getTransports === 'function' ? response.getTransports() : undefined,
    },
    clientExtensionResults: typeof credential.getClientExtensionResults === 'function'
      ? credential.getClientExtensionResults()
      : {},
    authenticatorAttachment: credential.authenticatorAttachment || undefined,
  }
  Object.keys(result.response).forEach(key => {
    if (result.response[key] === undefined) delete result.response[key]
  })
  return result
}

export const createPasskey = async (payload) => {
  if (!isPasskeySupported()) throw new Error('PasskeyUnsupported')
  const options = decodeCreationOptions(payload)
  if (!options) throw new Error('PasskeyInvalidOptions')
  return serializeCredential(await navigator.credentials.create({ publicKey: options }))
}

export const getPasskey = async (payload) => {
  if (!isPasskeySupported()) throw new Error('PasskeyUnsupported')
  const options = decodeRequestOptions(payload)
  if (!options) throw new Error('PasskeyInvalidOptions')
  return serializeCredential(await navigator.credentials.get({ publicKey: options }))
}
