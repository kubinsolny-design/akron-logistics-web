import { brandIcon } from '../brand-icon'

export const dynamic = 'force-static'
export async function GET() { return brandIcon(48) }
