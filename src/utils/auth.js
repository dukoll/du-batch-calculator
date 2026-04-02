const SALT = 'formcalc_v1'

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(SALT + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password, storedHash) {
  const hash = await hashPassword(password)
  return hash === storedHash
}

export const DEFAULT_PERMISSIONS = {
  calculator: false,
  rawMaterials: false,
  formulations: false,
}

export const ADMIN_PERMISSIONS = {
  calculator: true,
  rawMaterials: true,
  formulations: true,
}
