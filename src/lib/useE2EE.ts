/**
 * src/lib/useE2EE.ts
 *
 * Hook e funções para inicialização e uso de E2EE no TRAMA.
 *
 * Fluxo:
 *   1. No login: initializeE2EE(password, userId) → deriva Master Key
 *   2. Ao abrir projeto: useE2EE(projectId) → busca e descriptografa Project Key
 *   3. No logout: keyStore.clear()
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  deriveMasterKey,
  decryptProjectKey,
  decryptProjectKeyWithPrivateKey,
  generateRSAKeyPair,
  exportPublicKey,
  encryptPrivateKey,
  decryptPrivateKey,
  encryptProjectKey,
  generateProjectKey,
} from './crypto'
import { keyStore } from './keyStore'

// ─── Inicialização no login ───────────────────────────────────────────────────

/**
 * Chamar imediatamente após login bem-sucedido, antes de redirecionar.
 * Deriva a Master Key e inicializa as chaves RSA.
 */
export async function initializeE2EE(
  password: string,
  userId: string
): Promise<void> {
  // 1. Derivar Master Key
  const masterKey = await deriveMasterKey(password, userId)
  keyStore.setMasterKey(masterKey)

  // 2. Buscar chave privada RSA do servidor (criptografada)
  try {
    const res = await fetch('/api/e2ee/keys')
    if (res.ok) {
      const { encryptedPrivateKey, privateKeyIv, publicKey } = await res.json()

      if (encryptedPrivateKey) {
        // Descriptografar chave privada RSA com Master Key
        const privateKey = await decryptPrivateKey(
          { ciphertext: encryptedPrivateKey, iv: privateKeyIv },
          masterKey
        )
        const pubKey = await importPublicKeyFromSpki(publicKey)
        keyStore.setRSAKeyPair(privateKey, pubKey)
      } else {
        // Primeiro uso: gerar par RSA e salvar no servidor
        await initializeRSAKeys(masterKey, userId)
      }
    }
  } catch (err) {
    // RSA opcional — E2EE básico funciona sem ele (sem compartilhamento)
    console.warn('[E2EE] Não foi possível carregar chaves RSA:', err)
  }
}

async function importPublicKeyFromSpki(spkiBase64: string): Promise<CryptoKey> {
  const { importPublicKey } = await import('./crypto')
  return importPublicKey(spkiBase64)
}

async function initializeRSAKeys(masterKey: CryptoKey, userId: string): Promise<void> {
  const { generateRSAKeyPair, exportPublicKey, encryptPrivateKey } = await import('./crypto')

  const keyPair = await generateRSAKeyPair()
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey)
  const encryptedPrivate = await encryptPrivateKey(keyPair.privateKey, masterKey)

  await fetch('/api/e2ee/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publicKey: publicKeyBase64,
      encryptedPrivateKey: encryptedPrivate.ciphertext,
      privateKeyIv: encryptedPrivate.iv,
    }),
  })

  keyStore.setRSAKeyPair(keyPair.privateKey, keyPair.publicKey)
}

// ─── Hook por projeto ─────────────────────────────────────────────────────────

interface E2EEState {
  ready: boolean
  loading: boolean
  error: string | null
  unlock: (password: string) => Promise<boolean>
  encrypt: (plaintext: string) => Promise<{ ciphertext: string; iv: string }>
  decrypt: (ciphertext: string, iv: string) => Promise<string>
}

export function useE2EE(projectId: string, isEncrypted: boolean): E2EEState {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEncrypted) {
      setReady(true)
      return
    }

    // Já tem a chave deste projeto na memória
    if (keyStore.hasProjectKey(projectId)) {
      setReady(true)
      return
    }

    // Tentar desbloquear automaticamente se já tem Master Key
    if (keyStore.hasMasterKey()) {
      unlockWithStoredKey()
    }
  }, [projectId, isEncrypted])

  async function unlockWithStoredKey(): Promise<void> {
    setLoading(true)
    try {
      await loadProjectKey(projectId)
      setReady(true)
      setError(null)
    } catch (e) {
      setError('Não foi possível descriptografar este projeto.')
    } finally {
      setLoading(false)
    }
  }

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      // Re-derivar Master Key com a senha fornecida
      const session = await fetch('/api/auth/session').then(r => r.json())
      const userId = session?.user?.id
      if (!userId) throw new Error('Sessão inválida')

      const masterKey = await deriveMasterKey(password, userId)
      keyStore.setMasterKey(masterKey)

      await loadProjectKey(projectId)
      setReady(true)
      return true
    } catch (e) {
      setError('Senha incorreta ou projeto corrompido.')
      return false
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const encryptFn = useCallback(async (plaintext: string) => {
    const key = keyStore.getProjectKey(projectId)
    if (!key) throw new Error('Chave do projeto não disponível')
    const { encrypt } = await import('./crypto')
    return encrypt(plaintext, key)
  }, [projectId])

  const decryptFn = useCallback(async (ciphertext: string, iv: string) => {
    const key = keyStore.getProjectKey(projectId)
    if (!key) throw new Error('Chave do projeto não disponível')
    const { decrypt } = await import('./crypto')
    return decrypt({ ciphertext, iv }, key)
  }, [projectId])

  return { ready, loading, error, unlock, encrypt: encryptFn, decrypt: decryptFn }
}

// ─── Carregar Project Key do servidor ────────────────────────────────────────

async function loadProjectKey(projectId: string): Promise<void> {
  const res = await fetch(`/api/projetos/${projectId}/key`)
  if (!res.ok) throw new Error('Chave não encontrada')

  const data = await res.json()
  const { encrypt: _e, decrypt: _d, ...cryptoFns } = await import('./crypto')

  if (data.type === 'owner') {
    const masterKey = keyStore.getMasterKey()
    if (!masterKey) throw new Error('Master Key não disponível')

    const projectKey = await cryptoFns.decryptProjectKey(
      { ciphertext: data.encryptedKey, iv: data.keyIv },
      masterKey
    )
    keyStore.setProjectKey(projectId, projectKey)

  } else if (data.type === 'collaborator') {
    const privateKey = keyStore.getRSAPrivateKey()
    if (!privateKey) throw new Error('Chave privada RSA não disponível')

    const projectKey = await cryptoFns.decryptProjectKeyWithPrivateKey(
      data.encryptedKey,
      privateKey
    )
    keyStore.setProjectKey(projectId, projectKey)
  }
}

// ─── Criar Project Key (ao criar projeto E2EE) ───────────────────────────────

export async function createProjectKey(projectId: string): Promise<void> {
  const masterKey = keyStore.getMasterKey()
  if (!masterKey) throw new Error('Master Key não disponível. Faça login novamente.')

  const projectKey = await generateProjectKey()
  const encrypted = await encryptProjectKey(projectKey, masterKey)

  const res = await fetch(`/api/projetos/${projectId}/key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      encryptedKey: encrypted.ciphertext,
      keyIv: encrypted.iv,
    }),
  })

  if (!res.ok) throw new Error('Erro ao salvar chave do projeto')
  keyStore.setProjectKey(projectId, projectKey)
}

// ─── Compartilhar Project Key com colaboradora ────────────────────────────────

export async function shareProjectKey(
  projectId: string,
  collaboratorUserId: string
): Promise<void> {
  const projectKey = keyStore.getProjectKey(projectId)
  if (!projectKey) throw new Error('Chave do projeto não carregada')

  // Buscar chave pública RSA da colaboradora
  const res = await fetch(`/api/e2ee/keys/${collaboratorUserId}`)
  if (!res.ok) throw new Error('Colaboradora não tem chave E2EE configurada')

  const { publicKey: publicKeyBase64 } = await res.json()
  const { importPublicKey, encryptProjectKeyForCollaborator } = await import('./crypto')

  const collaboratorPublicKey = await importPublicKey(publicKeyBase64)
  const encryptedKey = await encryptProjectKeyForCollaborator(projectKey, collaboratorPublicKey)

  await fetch(`/api/projetos/${projectId}/key/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collaboratorUserId, encryptedKey }),
  })
}

// ─── Mudança de senha: re-criptografar Project Keys ───────────────────────────

export async function reEncryptAllProjectKeys(
  oldPassword: string,
  newPassword: string,
  userId: string,
  projectIds: string[]
): Promise<void> {
  const oldMasterKey = await deriveMasterKey(oldPassword, userId)
  const newMasterKey = await deriveMasterKey(newPassword, userId)

  for (const projectId of projectIds) {
    // Buscar e descriptografar com chave antiga
    const res = await fetch(`/api/projetos/${projectId}/key`)
    if (!res.ok) continue

    const data = await res.json()
    if (data.type !== 'owner') continue

    const { decryptProjectKey, encryptProjectKey } = await import('./crypto')
    const projectKey = await decryptProjectKey(
      { ciphertext: data.encryptedKey, iv: data.keyIv },
      oldMasterKey
    )

    // Re-criptografar com nova Master Key
    const newEncrypted = await encryptProjectKey(projectKey, newMasterKey)

    await fetch(`/api/projetos/${projectId}/key`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encryptedKey: newEncrypted.ciphertext,
        keyIv: newEncrypted.iv,
      }),
    })
  }

  // Atualizar Master Key na memória
  keyStore.setMasterKey(newMasterKey)
}
