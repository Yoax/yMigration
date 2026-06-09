import { useRef, useState, type ChangeEvent } from 'react'
import { api } from '../../api/client'

interface DataTransferPanelProps {
  onImported: () => Promise<void>
}

export function DataTransferPanel({ onImported }: DataTransferPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setBusy('export')
    setError(null)
    setMessage(null)
    try {
      await api.exportData()
      setMessage('Export téléchargé.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export impossible')
    } finally {
      setBusy(null)
    }
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Sélectionnez un fichier JSON à importer.')
      return
    }

    if (
      !confirm(
        'Remplacer toutes les données ? Les personnes et trajets actuels seront supprimés.',
      )
    ) {
      return
    }

    setBusy('import')
    setError(null)
    setMessage(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text) as unknown
      const result = await api.importData(data, 'replace')
      setMessage(
        `Import réussi (${result.persons} personne${result.persons > 1 ? 's' : ''}, ${result.journeys} trajet${result.journeys > 1 ? 's' : ''}).`,
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      await onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible')
    } finally {
      setBusy(null)
    }
  }

  function handleFileChange(_e: ChangeEvent<HTMLInputElement>) {
    setError(null)
    setMessage(null)
  }

  return (
    <section className="admin__section admin__section--transfer">
      <h2 className="admin__heading">Sauvegarde et import</h2>
      <p className="admin__transfer-desc">
        Exportez toutes les personnes et tous les trajets au format yMigration, ou
        réimportez une sauvegarde précédente.
      </p>

      {error && <p className="admin__status admin__status--error">{error}</p>}
      {message && <p className="admin__transfer-success">{message}</p>}

      <div className="admin__transfer-grid">
        <div className="admin__transfer-card">
          <h3 className="admin__transfer-title">Exporter</h3>
          <p className="admin__transfer-hint">
            Télécharge un fichier JSON contenant l&apos;ensemble des données.
          </p>
          <button
            type="button"
            className="admin__transfer-btn"
            onClick={handleExport}
            disabled={busy != null}
          >
            {busy === 'export' ? 'Export…' : 'Télécharger la sauvegarde'}
          </button>
        </div>

        <div className="admin__transfer-card">
          <h3 className="admin__transfer-title">Importer</h3>
          <p className="admin__transfer-hint">
            Charge un fichier exporté depuis yMigration. Les données actuelles
            seront remplacées.
          </p>

          <label className="admin__transfer-file">
            Fichier JSON
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
            />
          </label>

          <button
            type="button"
            className="admin__transfer-btn admin__transfer-btn--import"
            onClick={handleImport}
            disabled={busy != null}
          >
            {busy === 'import' ? 'Import…' : 'Importer'}
          </button>
        </div>
      </div>
    </section>
  )
}
