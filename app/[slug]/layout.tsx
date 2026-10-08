import { PageStructuredData } from '../page-structured-data'

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <><PageStructuredData slug={slug} />{children}</>
}
