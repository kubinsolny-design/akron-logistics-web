import { PageStructuredData } from '../page-structured-data'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><PageStructuredData slug="moznosti" />{children}</>
}
