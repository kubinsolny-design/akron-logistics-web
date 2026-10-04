import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'AKRON Logistics — silniční přeprava a spedice'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const [logo, font] = await Promise.all([
    readFile(join(process.cwd(), 'public/images/akron-white.svg')),
    readFile(join(process.cwd(), 'app/fonts/static/Poppins-Bold.ttf')),
  ])
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#152236', color: '#f2f2f2', padding: '74px 78px', fontFamily: 'Poppins' }}>
      {/* The same supplied artwork is used in shared-link previews. */}
      <img src={`data:image/svg+xml;base64,${logo.toString('base64')}`} alt="" width={350} height={112} />
      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', maxWidth: 760, fontSize: 55, fontWeight: 700, lineHeight: 1.02, letterSpacing: '-2px' }}>Přeprava od poptávky po doručení.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span style={{ display: 'flex', width: 22, height: 22, borderRadius: 99, background: '#ff5a00' }} /><span style={{ display: 'flex', width: 135, height: 4, background: '#ff5a00' }} /><span style={{ display: 'flex', width: 22, height: 22, borderRadius: 99, border: '4px solid #ff5a00' }} /></div>
      </div>
    </div>,
    { ...size, fonts: [{ name: 'Poppins', data: font, weight: 700, style: 'normal' }] },
  )
}
