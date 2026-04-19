import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

export function formatDate(timestamp: number) {
  if (!timestamp) return '—'
  return new Date(timestamp * 1000).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  })
}
