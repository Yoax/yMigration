# yMigration

Mappemonde interactive pour visualiser des parcours migratoires, avec back-end pour gérer les personnes et les trajets.

Dépôt : [github.com/Yoax/yMigration](https://github.com/Yoax/yMigration)

## Démarrage

```bash
npm install
npm run dev
```

- **Carte** : [http://localhost:5173](http://localhost:5173) — menu « Parcours animé » pour rejouer les trajets d'une personne étape par étape
- **Administration** : [http://localhost:5173/admin](http://localhost:5173/admin)
- **API** : [http://localhost:3001/api](http://localhost:3001/api)

La commande `npm run dev` lance en parallèle le serveur API (port 3001) et le front Vite (port 5173).

## Production

```bash
npm run build
npm start
```

Le serveur sert l'API et les fichiers statiques du dossier `dist` sur le port 3001.

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/persons` | Liste des personnes |
| POST | `/api/persons` | Créer une personne |
| PUT | `/api/persons/:id` | Modifier une personne |
| DELETE | `/api/persons/:id` | Supprimer une personne |
| GET | `/api/journeys` | Liste des trajets |
| GET | `/api/journeys/migrations` | Trajets au format carte |
| POST | `/api/journeys` | Créer un trajet |
| PUT | `/api/journeys/:id` | Modifier un trajet |
| DELETE | `/api/journeys/:id` | Supprimer un trajet |
| GET | `/api/data/export` | Exporter toutes les données (JSON) |
| POST | `/api/data/import` | Importer une sauvegarde |

## Données

Les données sont stockées dans SQLite (`data/ymigration.db`). Au premier lancement, la base est initialisée depuis [`src/data/seed.json`](src/data/seed.json) : **3 personnages** avec récits et **9 trajets** couvrant tous les modes de transport (marche, train, voiture, bateau, avion).

Si une ancienne base `data/carte-navarro.db` existe, elle est copiée automatiquement vers `ymigration.db`.

Pour recharger les données de démonstration :

```bash
npm run db:reseed
```

## Sauvegarde et import

Dans **Administration**, la section **Sauvegarde et import** permet de :

- **Exporter** : télécharge un fichier `ymigration-export-AAAA-MM-JJ.json`
- **Importer** : charge un fichier exporté et remplace toutes les données existantes

Format du fichier :

```json
{
  "format": "ymigration",
  "version": 1,
  "exportedAt": "2026-06-09T12:00:00.000Z",
  "persons": [ … ],
  "journeys": [ … ]
}
```

## Ajouter un trajet (interface)

1. Ouvrir **Administration**
2. Créer d'abord une **personne** (prénom obligatoire)
3. Ajouter un **trajet** : recherchez les villes de départ et d'arrivée (les coordonnées se remplissent automatiquement), puis renseignez l'année et le transport
4. Retourner sur **Carte** pour voir le résultat

La recherche de lieux utilise [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap) via `GET /api/geocode?q=…`.

Les tracés suivent le type de transport via `GET /api/route` : routes terrestres (OSRM) pour marche/train/voiture, routes maritimes ([searoute-js](https://github.com/johnx25bd/searoute) / réseau Eurostat) pour les bateaux, grand cercle pour les avions.

**Transport** : `bateau`, `avion`, `marche`, `train`, `voiture`.

## Stack

- Front : Vite, React, TypeScript, Leaflet
- Back : Express, SQLite (better-sqlite3)
