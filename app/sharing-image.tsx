import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Trusted, versioned local assets only. Never fetch private CMS or remote image URLs.
const assets = Promise.all([
    readFile(join(process.cwd(), 'public/images/akron-white.svg')),
    readFile(join(process.cwd(), 'app/fonts/static/Poppins-Bold.ttf')),
    readFile(join(process.cwd(), 'public/images/trucks-highway.png')),
    readFile(join(process.cwd(), 'public/images/logistics-coordination.jpg')),
])

export async function sharingImage(heading: string, label: string, photo: 'highway' | 'coordination' = 'highway') {
  const [logo, font, highway, coordination] = await assets
  const photoSrc = photo === 'coordination' ? `data:image/jpeg;base64,${coordination.toString('base64')}` : `data:image/png;base64,${highway.toString('base64')}`
  return new ImageResponse(
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', background: '#152236', color: '#f2f2f2', fontFamily: 'Poppins', borderBottom: '14px solid #ff5a00', overflow: 'hidden' }}>
      {/* ImageResponse rasterizes local assets; next/image is not supported here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoSrc} alt="" width={600} height={616} style={{ position: 'absolute', right: 0, top: 0, objectFit: 'cover', objectPosition: photo === 'coordination' ? '65% center' : '62% center' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', backgroundImage: 'linear-gradient(90deg, #152236 35%, rgba(21,34,54,0.9) 53%, rgba(21,34,54,0.12) 100%)' }} />
      <div style={{ position: 'relative', width: '100%', height: '100%', padding: '44px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml;base64,${logo.toString('base64')}`} alt="AKRON Logistics" width={275} height={88} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 650 }}>
          <div style={{ display: 'flex', color: '#ff7433', fontSize: 18, letterSpacing: 2 }}>{label}</div>
          <div style={{ display: 'flex', fontSize: heading.length > 65 ? 49 : 62, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-2px' }}>{heading.slice(0, 110)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, color: '#e0e5ec' }}>
          <div style={{ display: 'flex' }}>Silniční přeprava a spedice</div>
          <div style={{ display: 'flex' }}>akronlogistics.cz</div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Poppins', data: font, weight: 700, style: 'normal' }] },
  )
}
