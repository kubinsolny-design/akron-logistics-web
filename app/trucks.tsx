type Props = { type: 'van' | 'box' | 'trailer' | 'tipper' | 'walking-floor'; label: string }

export function Truck({ type, label }: Props) {
  const body = type === 'van'
    ? <path d="M21 53V31c0-5 4-9 9-9h22v31H21Zm31 0V30h15c5 0 8 4 10 8l5 15H52Z" />
    : type === 'box'
      ? <path d="M13 53V21h49v32H13Zm49 0V31h18l10 13v9H62Z" />
      : type === 'tipper'
        ? <path d="M8 23h62l-8 25H18L8 23Zm55 30V32h19l12 13v8H63Z" />
        : <path d="M7 53V20h64v33H7Zm64 0V32h15l8 11v10H71Z" />
  return <div className={`truck truck-${type}`}><svg viewBox="0 0 102 74" role="img" aria-label={label}>{body}{type === 'walking-floor' ? <path className="truck-line" d="M16 26v20m9-20v20m9-20v20m9-20v20m9-20v20m9-20v20M12 49h54" /> : null}<path className="truck-line" d="M9 54h86"/><circle cx="26" cy="56" r="7"/><circle cx="80" cy="56" r="7"/></svg></div>
}
