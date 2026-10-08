import { sharingImage } from '../sharing-image'
import { seoPages } from '../seo-pages'

export function GET() { return sharingImage(seoPages.home.card, seoPages.home.label) }
