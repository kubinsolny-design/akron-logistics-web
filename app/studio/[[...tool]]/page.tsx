import { redirect } from 'next/navigation'

// Old bookmarks lead to our own administration; no external Studio is loaded.
export default function RetiredStudio() { redirect('/admin') }
