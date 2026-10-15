/** Offline migration manifest. Resolves old identifiers, never contacts the old CMS. */
export const migratedMedia: Readonly<Record<string, string>> = {
  'image-06d7edd50ef549a74240ff63181648635e3b6487-875x280-svg': '/images/akron-black.svg',
  'image-6f85a8b43ac5b7d0aef16cb4dc042eab35a56f1b-875x280-svg': '/images/akron-white.svg',
  'image-7e2bac914f3b0268283f7854464c7916b6b5e0e7-1672x941-jpg': '/images/logistics-coordination.jpg',
  'image-96e4c65adab784362c4b490194aa0c7c5eda9cf0-2055x765-png': '/images/trucks-highway.png',
  'image-bc5eecffd2efc0c981063a12a94f04e79420042d-800x760-svg': '/images/europe-map.svg',
}

export function migratedMediaUrl(reference?: string) {
  return reference && Object.hasOwn(migratedMedia, reference) ? migratedMedia[reference] : undefined
}
