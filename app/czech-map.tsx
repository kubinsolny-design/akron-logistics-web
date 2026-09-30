import Image from 'next/image'

export function CzechMap() {
  return (
    <figure className="czech-map">
      <div className="map-art">
        <Image src="/images/czech-neighbors-map.png" alt="Česko a sousední státy: Německo, Polsko, Rakousko a Slovensko" width={1536} height={1024} sizes="(max-width: 750px) 100vw, 50vw" />
        <span className="country-label label-germany">Německo</span><span className="country-label label-poland">Polsko</span><span className="country-label label-austria">Rakousko</span><span className="country-label label-slovakia">Slovensko</span><span className="country-label label-czech">Česko</span>
        <span className="city-label city-prague">Praha</span><span className="city-label city-brno">Brno</span>
      </div>
      <figcaption>Česko uprostřed. Přepravy po republice i do Evropy.</figcaption>
    </figure>
  )
}
