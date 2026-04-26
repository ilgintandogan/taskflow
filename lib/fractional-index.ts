import { generateKeyBetween } from 'fractional-indexing'

export function keyBetween(a: string | null, b: string | null): string {
  return generateKeyBetween(a, b)
}

export function initialKey(): string {
  return generateKeyBetween(null, null)
}

export function keyAfter(a: string): string {
  return generateKeyBetween(a, null)
}

export function keyBefore(b: string): string {
  return generateKeyBetween(null, b)
}
