/**
 * src/lib/crypto.ts
 *
 * Todas as operações criptográficas ocorrem no browser via Web Crypto API nativa.
 * NUNCA importar em Server Components ou rotas de API.
 *
 * Primitivas:
 *   - PBKDF2-SHA256 (600.000 iter) para derivação de Master Key
 *   - AES-GCM 256 bits para criptografia de conteúdo e Project Keys
 *   - RSA-OAEP 4096 bits para compartilhamento de chaves entre colaboradoras
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 600_000
const AES_ALGORITHM = { name: 'AES-GCM', length: 256 } as const
const RSA_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
} as const

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string // base64
  iv: string         // base64, 12 bytes para AES-GCM
}

// ─── Master Key (derivada da senha) ──────────────────────────────────────────

/**
 * Deriva a Master Key a partir da senha usando PBKDF2.
 * A Master Key NUNCA sai do browser e NUNCA é enviada ao servidor.
 * O salt é baseado no userId para que senhas iguais em contas diferentes
 * gerem Master Keys diferentes.
 */
export async function deriveMasterKey(
  password: string,
  userId: string
): Promise<CryptoKey> {
  const enc = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(`trama:${userId}`),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    AES_ALGORITHM,
    false,   // não exportável — permanece só na memória
    ['encrypt', 'decrypt']
  )
}

// ─── Project Key (AES-GCM, gerada aleatoriamente) ────────────────────────────

export async function generateProjectKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(AES_ALGORITHM, true, ['encrypt', 'decrypt'])
}

export async function exportProjectKeyRaw(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key)
}

export async function importProjectKeyRaw(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, AES_ALGORITHM, true, ['encrypt', 'decrypt'])
}

// ─── Criptografia de conteúdo (AES-GCM) ──────────────────────────────────────

/**
 * Criptografa uma string com a Project Key.
 * Gera IV único a cada chamada — nunca reutilizar IV com a mesma chave.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96 bits para AES-GCM

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  )

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
  }
}

/**
 * Descriptografa um payload AES-GCM.
 * Lança erro se o conteúdo foi adulterado (AES-GCM é autenticado).
 */
export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const dec = new TextDecoder()

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) as unknown as ArrayBuffer },
    key,
    fromBase64(payload.ciphertext) as unknown as ArrayBuffer
  )

  return dec.decode(plaintext)
}

// ─── Criptografia de Project Key com Master Key ───────────────────────────────

export async function encryptProjectKey(
  projectKey: CryptoKey,
  masterKey: CryptoKey
): Promise<EncryptedPayload> {
  const raw = await crypto.subtle.exportKey('raw', projectKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    raw
  )

  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
  }
}

export async function decryptProjectKey(
  payload: EncryptedPayload,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) as unknown as ArrayBuffer },
    masterKey,
    fromBase64(payload.ciphertext) as unknown as ArrayBuffer
  )

  return crypto.subtle.importKey('raw', raw, AES_ALGORITHM, true, ['encrypt', 'decrypt'])
}

// ─── Par de chaves RSA-OAEP (para compartilhamento) ──────────────────────────

export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(RSA_ALGORITHM, true, ['encrypt', 'decrypt'])
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', key)
  return toBase64(new Uint8Array(spki))
}

export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    fromBase64(spkiBase64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  )
}

export async function exportPrivateKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('pkcs8', key)
}

export async function importPrivateKey(pkcs8: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  )
}

/**
 * Criptografa a Project Key com a chave pública RSA da colaboradora.
 * Apenas a colaboradora (com sua chave privada RSA) poderá descriptografar.
 */
export async function encryptProjectKeyForCollaborator(
  projectKey: CryptoKey,
  collaboratorPublicKey: CryptoKey
): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', projectKey)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    collaboratorPublicKey,
    raw
  )
  return toBase64(new Uint8Array(encrypted))
}

export async function decryptProjectKeyWithPrivateKey(
  encryptedBase64: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  const raw = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    fromBase64(encryptedBase64)
  )
  return crypto.subtle.importKey('raw', raw, AES_ALGORITHM, true, ['encrypt', 'decrypt'])
}

// ─── Criptografia da chave privada RSA para armazenamento ────────────────────

/**
 * Criptografa a chave privada RSA com a Master Key para armazenamento seguro no servidor.
 * A chave privada NUNCA é enviada em plaintext.
 */
export async function encryptPrivateKey(
  privateKey: CryptoKey,
  masterKey: CryptoKey
): Promise<EncryptedPayload> {
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    pkcs8
  )

  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
  }
}

export async function decryptPrivateKey(
  payload: EncryptedPayload,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  const pkcs8 = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) as unknown as ArrayBuffer },
    masterKey,
    fromBase64(payload.ciphertext) as unknown as ArrayBuffer
  )
  return importPrivateKey(pkcs8)
}

// ─── Hash de integridade ──────────────────────────────────────────────────────

export async function hashContent(plaintext: string): Promise<string> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(plaintext))
  return toBase64(new Uint8Array(hash))
}

// ─── Utilitários base64 ───────────────────────────────────────────────────────

export function toBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}
function fromBase64(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return buffer
}

