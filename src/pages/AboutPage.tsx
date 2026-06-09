import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <main className="content-page">
      <h1 className="content-page__title">À propos</h1>
      <p className="content-page__lead">
        <strong>yMigration</strong> est une application pour visualiser et raconter
        des parcours migratoires sur une carte du monde interactive.
      </p>

      <section className="content-page__section">
        <h2>À quoi ça sert ?</h2>
        <p>
          Chaque personne peut être associée à une série de déplacements dans le
          temps : lieux de naissance et de décès, récits, étapes successives avec
          leur mode de transport. La carte retrace ces trajets ; l&apos;animation
          les rejoue étape par étape pour mettre en lumière le temps qui passe et
          les distances parcourues.
        </p>
        <p>
          L&apos;application convient aux projets familiaux, pédagogiques ou de
          recherche locale, lorsque l&apos;on souhaite donner une dimension
          spatiale et narrative à des histoires de migration.
        </p>
      </section>

      <section className="content-page__section">
        <h2>Données et confidentialité</h2>
        <p>
          Les personnes et les trajets sont stockés localement dans une base
          SQLite sur le serveur qui fait tourner l&apos;application. Aucun compte
          ni service cloud n&apos;est requis : vos données restent sous votre
          contrôle.
        </p>
        <p>
          Vous pouvez à tout moment exporter une sauvegarde complète au format
          JSON depuis l&apos;administration, ou recharger les données
          d&apos;exemple fournies avec l&apos;application.
        </p>
      </section>

      <section className="content-page__section">
        <h2>Technologies</h2>
        <ul>
          <li>Interface : React, TypeScript, Leaflet</li>
          <li>Serveur : Express, SQLite</li>
          <li>
            Géocodage :{' '}
            <a
              href="https://nominatim.openstreetmap.org"
              target="_blank"
              rel="noreferrer"
            >
              Nominatim
            </a>{' '}
            (OpenStreetMap)
          </li>
          <li>Routes terrestres, maritimes et aériennes calculées à la volée</li>
        </ul>
      </section>

      <section className="content-page__section">
        <h2>Aller plus loin</h2>
        <p>
          Consultez le <Link to="/tutoriel">tutoriel</Link> pour un mode
          d&apos;emploi détaillé, ou ouvrez directement la{' '}
          <Link to="/">carte</Link> pour explorer les parcours.
        </p>
      </section>
    </main>
  )
}
