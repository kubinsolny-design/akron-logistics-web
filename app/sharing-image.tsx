import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function sharingImage(heading: string, label: string) {
  const [logo, font] = await Promise.all([
    readFile(join(process.cwd(), 'public/images/akron-white.svg')),
    readFile(join(process.cwd(), 'app/fonts/static/Poppins-Bold.ttf')),
  ])
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#152236', color: '#f2f2f2', padding: '58px 72px', fontFamily: 'Poppins', borderBottom: '16px solid #ff5a00' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* ImageResponse rasterizes the SVG directly; next/image is not supported here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml;base64,${logo.toString('base64')}`} alt="" width={310} height={99} />
        <div style={{ display: 'flex', color: '#ff5a00', fontSize: 18, letterSpacing: 2 }}>{label}</div>
      </div>
      <div style={{ display: 'flex', maxWidth: 980, fontSize: heading.length > 65 ? 47 : 64, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-2px' }}>{heading.slice(0, 110)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 21, color: '#b6c1ce' }}>
        <div style={{ display: 'flex' }}>Silniční přeprava · Spedice · Osobní komunikace</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 16, height: 16, borderRadius: 50, background: '#ff5a00' }} /><div style={{ width: 75, height: 3, background: '#ff5a00' }} /><div style={{ width: 16, height: 16, borderRadius: 50, border: '3px solid #ff5a00' }} /></div>
      </div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Poppins', data: font, weight: 700, style: 'normal' }] },
  )
}
