import { useState } from 'react'
import { api } from '../../api/client'

interface StartMyJourneyPanelProps {
  onReset: () => Promise<void>
}

export function StartMyJourneyPanel({ onReset }: StartMyJourneyPanelProps) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    if (
      !confirm(
        'Effacer toutes les données ? Les personnes et trajets d\'exemple seront supprimés. Cette action est irréversible.',
      )
    ) {
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      await api.resetData()
      setMessage('Données effacées. Vous pouvez maintenant créer votre parcours.')
      await onReset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Réinitialisation impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin__section admin__section--start">
      <h2 className="admin__heading">Commencer mon parcours</h2>
      <p className="admin__start-desc">
        Supprimez les données d&apos;exemple pour repartir de zéro et saisir
        votre propre histoire migratoire.
      </p>

      {error && <p className="admin__status admin__status--error">{error}</p>}
      {message && <p className="admin__start-success">{message}</p>}

      <button
        type="button"
        className="admin__start-btn"
        onClick={handleReset}
        disabled={busy}
      >
        {busy ? 'Effacement…' : 'Commencer mon parcours'}
      </button>
    </section>
  )
}
