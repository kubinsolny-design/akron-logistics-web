/** Stored rich text is plain JSON; no CMS SDK is required for its shape. */
export type TextBlock = {
  _type: 'block'; _key?: string; style?: string; listItem?: string; level?: number;
  children: { _type: string; _key?: string; text?: string; marks?: string[]; [key: string]: unknown }[];
  markDefs?: { _type: string; _key: string; href?: string; [key: string]: unknown }[];
}

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
export type CmsPage = { _id?: string; title?: string; slug?: { current?: string }; sections?: Section[]; body?: TextBlock[]; seoTitle?: string; seoDescription?: string; shareImage?: CmsImage }
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
