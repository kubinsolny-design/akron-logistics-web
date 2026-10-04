import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function brandIcon(size: number) {
  const svg = await readFile(join(process.cwd(), 'app/icon.svg'))
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#ff5a00' }}>
      <img src={`data:image/svg+xml;base64,${svg.toString('base64')}`} alt="" width={size} height={size} />
    </div>,
    { width: size, height: size },
  )
}
