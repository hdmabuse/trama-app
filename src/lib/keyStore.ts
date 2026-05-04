/**
 * src/lib/keyStore.ts
 *
 * Store em memória para chaves criptográficas descriptografadas.
 * NUNCA persiste em localStorage, sessionStorage ou cookies.
 * Limpo automaticamente no logout e ao recarregar a página.
 *
 * Uso:
 *   import { keyStore } from '@/lib/keyStore'
 *   keyStore.setMasterKey(key)
 *   keyStore.getProjectKey(projectId)
 */

type ProjectId = string

class InMemoryKeyStore {
  private masterKey: CryptoKey | null = null
  private projectKeys = new Map<ProjectId, CryptoKey>()
  private rsaPrivateKey: CryptoKey | null = null
  private rsaPublicKey: CryptoKey | null = null
  private initialized = false

  // ─── Master Key ─────────────────────────────────────────────────────────────

  setMasterKey(key: CryptoKey): void {
    this.masterKey = key
    this.initialized = true
  }

  getMasterKey(): CryptoKey | null {
    return this.masterKey
  }

  hasMasterKey(): boolean {
    return this.masterKey !== null
  }

  // ─── Project Keys ────────────────────────────────────────────────────────────

  setProjectKey(projectId: ProjectId, key: CryptoKey): void {
    this.projectKeys.set(projectId, key)
  }

  getProjectKey(projectId: ProjectId): CryptoKey | null {
    return this.projectKeys.get(projectId) ?? null
  }

  hasProjectKey(projectId: ProjectId): boolean {
    return this.projectKeys.has(projectId)
  }

  removeProjectKey(projectId: ProjectId): void {
    this.projectKeys.delete(projectId)
  }

  // ─── RSA Keys (para compartilhamento entre colaboradoras) ────────────────────

  setRSAKeyPair(privateKey: CryptoKey, publicKey: CryptoKey): void {
    this.rsaPrivateKey = privateKey
    this.rsaPublicKey = publicKey
  }

  getRSAPrivateKey(): CryptoKey | null {
    return this.rsaPrivateKey
  }

  getRSAPublicKey(): CryptoKey | null {
    return this.rsaPublicKey
  }

  hasRSAKeys(): boolean {
    return this.rsaPrivateKey !== null && this.rsaPublicKey !== null
  }

  // ─── Estado ──────────────────────────────────────────────────────────────────

  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Limpar todas as chaves da memória.
   * Chamar no logout e quando a sessão expirar.
   */
  clear(): void {
    this.masterKey = null
    this.projectKeys.clear()
    this.rsaPrivateKey = null
    this.rsaPublicKey = null
    this.initialized = false
  }
}

// Singleton — uma instância por tab do browser
export const keyStore = new InMemoryKeyStore()

// Limpar ao fechar/recarregar a tab
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => keyStore.clear())
}
