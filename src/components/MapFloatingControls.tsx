import { AnimationMenu } from './AnimationMenu'
import { PersonFilterMenu } from './PersonFilterMenu'

export function MapFloatingControls() {
  return (
    <div className="map-floating-controls" aria-label="Outils carte">
      <PersonFilterMenu />
      <AnimationMenu />
    </div>
  )
}
