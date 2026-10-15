export function validPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15
}

export function inquiryValidation(fields: Record<string, string>) {
  if (['pickup', 'delivery', 'date', 'cargo', 'name', 'phone'].some(key => !fields[key]?.trim())) return 'Doplňte prosím všechna povinná pole.'
  if (!validPhone(fields.phone)) return 'Zkontrolujte prosím zadané telefonní číslo.'
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return 'Zkontrolujte prosím zadaný e-mail.'
  if (Object.values(fields).some(value => value.length > 3000) || fields.phone.length > 40 || fields.email.length > 254) return 'Některý z údajů je příliš dlouhý.'
  return null
}
