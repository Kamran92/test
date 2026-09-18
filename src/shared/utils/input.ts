export function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max)
}