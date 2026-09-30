export function CzechMap() {
  return (
    <figure className="czech-map" aria-labelledby="map-title map-description">
      <svg viewBox="0 0 720 460" role="img">
        <title id="map-title">Česko a sousední státy</title>
        <desc id="map-description">Mapa se státy Německo, Polsko, Slovensko, Rakousko a Českem uprostřed.</desc>
        <path className="country country-germany" d="M44 93 199 54l86 64-30 75 10 111-87 61-95-39-34-92z" />
        <path className="country country-poland" d="m285 118 151-61 183 34 59 91-72 86-116-21-89 39-146-93z" />
        <path className="country country-austria" d="m179 365 105-61 165 9 101 69-77 50-195-3z" />
        <path className="country country-slovakia" d="m449 313 157-66 95 53-79 80-148 2z" />
        <path className="country country-czech" d="m249 174 74-50 116 11 77 54-14 74-82 54-111-8-72-54z" />
        <path className="border-route" d="M272 241 349 213 437 236" />
        <circle className="city-dot" cx="300" cy="221" r="6" /><text className="city-label" x="313" y="217">Praha</text>
        <circle className="city-dot" cx="414" cy="269" r="6" /><text className="city-label" x="427" y="265">Brno</text>
        <text className="country-label label-germany" x="112" y="222">Německo</text>
        <text className="country-label label-poland" x="499" y="151">Polsko</text>
        <text className="country-label label-austria" x="290" y="395">Rakousko</text>
        <text className="country-label label-slovakia" x="572" y="337">Slovensko</text>
        <text className="country-label label-czech" x="346" y="227">Česko</text>
      </svg>
      <figcaption>Česko uprostřed. Přepravy po republice i do Evropy.</figcaption>
    </figure>
  )
}
