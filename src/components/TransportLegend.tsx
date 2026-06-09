import { TRANSPORT_MODES, transportStyles } from '../utils/transport'

export function TransportLegend() {
  return (
    <ul className="transport-legend">
      {TRANSPORT_MODES.map((mode) => {
        const style = transportStyles[mode]
        return (
          <li key={mode} className="transport-legend__item">
            <span
              className="transport-legend__line"
              style={{
                backgroundColor: style.dashArray ? 'transparent' : style.color,
                borderTop: style.dashArray
                  ? `${style.weight}px dashed ${style.color}`
                  : undefined,
                height: style.dashArray ? 0 : style.weight,
              }}
              aria-hidden
            />
            <span className="transport-legend__icon" aria-hidden>
              {style.icon}
            </span>
            <span className="transport-legend__label">{style.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
