import type { PortableTextBlock } from 'sanity'

export type CmsImage = { asset?: { _ref?: string }; alt?: string; url?: string }
export type Action = { _key?: string; label?: string; href?: string }
export type Card = { _key?: string; anchor?: string; title?: string; description?: string; vehicle?: string; image?: CmsImage; action?: Action }
export type Section = {
  _key?: string; editorLabel?: string; layout: string; visible?: boolean; anchor?: string;
  eyebrow?: string; heading?: string; highlight?: string; description?: string;
  image?: CmsImage; imagePath?: string; caption?: string; theme?: string;
  actions?: Action[]; cards?: Card[]; questions?: { _key?: string; question?: string; answer?: string }[];
  cardStyle?: 'rail' | 'list';
}
export type CmsPage = { _id?: string; title?: string; slug?: { current?: string }; sections?: Section[]; body?: PortableTextBlock[]; seoTitle?: string; seoDescription?: string; shareImage?: CmsImage }
export type Settings = {
  name: string; contactName: string; email: string; phone: string; phoneHref: string;
  registrationNumber: string; street: string; city: string; about?: string; portrait?: CmsImage;
  logo?: CmsImage; lightLogo?: CmsImage; accentColor?: string; darkColor?: string;
  backgroundColor?: string; textColor?: string; font?: string; navigation: Action[];
  footerText?: string; inquiryEmail?: string; formHeading?: string; formDescription?: string;
  submitLabel?: string; successMessage?: string;
  headerAction?: Action; footerAction?: Action; footerContactLabel?: string; footerTagline?: string;
  formText?: Record<string,string>; siteText?: Record<string,string>; cookieText?:Record<string,string>;
}
