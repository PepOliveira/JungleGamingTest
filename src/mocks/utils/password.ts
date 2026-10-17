import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'

export function hashPassword(password: string, salt: string) {
  return bytesToHex(sha256(utf8ToBytes(`${salt}:${password}`)))
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  return hashPassword(password, salt) === expectedHash
}
