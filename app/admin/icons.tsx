type IconName = 'home' | 'pages' | 'settings' | 'inquiries' | 'users' | 'activity' | 'arrow' | 'check' | 'external' | 'shield' | 'files' | 'analytics' | 'logout' | 'upload'

const paths: Record<IconName, string> = {
  files: 'M3 7V5h6l2 2h10v13H3V7Zm0 3h18',
  analytics: 'M4 3v18h17M8 17v-5m5 5V8m5 9V4',
  logout: 'M9 3H3v18h6m5-13 4 4-4 4m-5-4h12',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',
  home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  pages: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z',
  inquiries: 'M4 4h16v16H4V4Zm0 10h5l1 3h4l1-3h5M8 8h8',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 0a4 4 0 0 1 0 8M18 15a4 4 0 0 1 4 4v2',
  activity: 'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 4v5l3 2',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  check: 'm5 12 4 4L19 6',
  external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
}

export function AdminIcon({ name }: { name: IconName }) {
  return <svg className="admin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
