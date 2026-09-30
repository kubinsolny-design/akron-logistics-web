import { ImageResponse } from 'next/og'

export const alt = 'AKRON Logistics — silniční přeprava a spedice'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#152236', color: '#f2f2f2', padding: '74px 78px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.9 }}><span style={{ fontSize: 70, fontWeight: 900, letterSpacing: '-5px' }}>AKRON</span><span style={{ marginTop: 16, marginLeft: 4, fontSize: 17, fontWeight: 700, letterSpacing: '9px' }}>LOGISTICS</span></div>
      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', maxWidth: 760, fontSize: 55, fontWeight: 700, lineHeight: 1.02, letterSpacing: '-2px' }}>Přeprava od poptávky po doručení.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span style={{ display: 'flex', width: 22, height: 22, borderRadius: 99, background: '#ff5a00' }} /><span style={{ display: 'flex', width: 135, height: 4, background: '#ff5a00' }} /><span style={{ display: 'flex', width: 22, height: 22, borderRadius: 99, border: '4px solid #ff5a00' }} /></div>
      </div>
    </div>,
    size,
  )
}
