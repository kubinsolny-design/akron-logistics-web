'use client'

import { usePathname } from 'next/navigation'

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return pathname === '/studio' || pathname.startsWith('/studio/')
    || pathname === '/admin' || pathname.startsWith('/admin/') ? null : children
}
