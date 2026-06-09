import { Link } from 'react-router-dom'
import { getTransportStyle, TRANSPORT_MODES } from '../utils/transport'

export function TutorialPage() {
  return (
    <main className="content-page">
      <h1 className="content-page__title">Tutoriel</h1>
      <p className="content-page__lead">
        Ce guide vous accompagne pas à pas pour explorer des parcours migratoires
        sur la carte, les animer et les enrichir dans l&apos;administration.
      </p>

      <section className="content-page__section">
        <h2>La carte</h2>
        <p>
          La page <Link to="/">Carte</Link> affiche tous les trajets des personnes
          sélectionnées. Cliquez sur une route ou un lieu pour ouvrir une fenêtre
          avec les détails du voyage.
        </p>
        <p>
          Utilisez la molette pour zoomer et faites glisser la carte pour vous
          déplacer. Les tracés suivent le mode de transport : routes terrestres,
          lignes maritimes ou grand cercle pour les avions.
        </p>
      </section>

      <section className="content-page__section">
        <h2>Filtrer les personnes</h2>
        <p>
          Dans le bandeau sous l&apos;en-tête, ouvrez le menu{' '}
          <strong>Personnes</strong> et cochez les personnes à afficher. Seuls
          les trajets des personnes cochées apparaissent sur la carte.
        </p>
      </section>

      <section className="content-page__section">
        <h2>Parcours animé</h2>
        <ol className="content-page__steps">
          <li>
            Ouvrez le menu <strong>Parcours animé</strong> et choisissez une
            personne dans la liste.
          </li>
          <li>
            Cliquez sur <strong>Commencer</strong> : l&apos;année, le récit et les
            informations de naissance s&apos;affichent au centre de la carte.
          </li>
          <li>
            Avancez avec <strong>Étape suivante</strong> (bouton central sur la
            carte) : chaque clic lance le trajet, marque l&apos;arrivée, puis
            fait défiler le temps jusqu&apos;au prochain voyage.
          </li>
          <li>
            Pendant le déplacement, vous pouvez mettre en pause. À la fin du
            parcours, le total des kilomètres parcourus est affiché.
          </li>
        </ol>
        <p>
          Pendant l&apos;animation, la légende et le panneau détaillé du menu
          sont masqués pour laisser place aux contrôles centraux.
        </p>
      </section>

      <section className="content-page__section">
        <h2>Mon parcours</h2>
        <p>
          La page <Link to="/admin">Mon parcours</Link> permet de gérer les
          données :
        </p>
        <ul>
          <li>
            <strong>Personnes</strong> — prénom, nom, naissance et décès (lieu et
            année), récit affiché pendant l&apos;animation.
          </li>
          <li>
            <strong>Trajets</strong> — recherche des villes de départ et
            d&apos;arrivée, année, transport, contexte du voyage.
          </li>
          <li>
            <strong>Sauvegarde et import</strong> — exportez toutes les données
            en JSON ou réimportez une sauvegarde (les données actuelles sont
            alors remplacées).
          </li>
        </ul>
      </section>

      <section className="content-page__section">
        <h2>Modes de transport</h2>
        <ul className="content-page__transport-list">
          {TRANSPORT_MODES.map((mode) => {
            const style = getTransportStyle(mode)
            return (
              <li key={mode}>
                <span aria-hidden>{style.icon}</span> {style.label}
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
