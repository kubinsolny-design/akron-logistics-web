import Image from 'next/image'

export function EuropeMap() {
  return (
    <figure className="europe-map">
      <div className="map-art">
        <Image src="/images/europe-map.svg" alt="Mapa Evropy se zvýrazněným Českem" width={800} height={760} sizes="(max-width: 750px) 100vw, 50vw" />
      </div>
      <figcaption>Přepravy po Česku i napříč Evropou. Konkrétní trasu ověříme podle vaší poptávky.</figcaption>
    </figure>
  )
}
