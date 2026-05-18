# Baronne Malia - Suivi de Croissance

Application de suivi de croissance pour Golden Retriever, avec courbes scientifiques, calculs nutritionnels FEDIAF/NRC et stockage cloud via Supabase.

## Stack Technique

- **Frontend** : React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Graphiques** : Chart.js
- **Backend/Cloud** : Supabase (PostgreSQL, Auth anonyme)
- **Hébergement** : GitHub Pages (gratuit)
- **Installation mobile** : PWA (Progressive Web App) via Chrome

## Données scientifiques intégrées

- Courbe de croissance Golden Retriever femelle (consolidée Pawlicy, Waggel, AKC)
- Calculs RER/MER selon FEDIAF 2024 / NRC 2006
- Recommandations nutritionnelles contextualisées (âge, poids, tendance)
- Score corporel (BCS 1-9)

## Fonctionnalités

- Saisie de poids datée avec BCS
- Visualisation de courbe de croissance avec fourchette idéale et projection
- Recommandation calorique quotidienne ajustée
- Conseils nutritionnels basés sur les données scientifiques
- Stockage local (hors-ligne) + synchronisation cloud Supabase
- Export/import JSON des données
- PWA installable sur Android/iOS

## Installation

### Prérequis

- Node.js 20+
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [GitHub](https://github.com) (gratuit)

### 1. Cloner et installer

```bash
git clone <repo-url>
cd baronne-malia
npm install --legacy-peer-deps
```

### 2. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **SQL Editor** → **New query**
3. Copiez-collez le contenu de `supabase_schema.sql`
4. Exécutez le script
5. Allez dans **Project Settings → API**
6. Copiez l'**URL** et la **anon public key**

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Remplissez le fichier `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

### 4. Lancer en local

```bash
npm run dev
```

### 5. Déployer sur GitHub Pages

1. Poussez le code sur GitHub
2. Allez dans **Settings → Pages**
3. Source : **GitHub Actions**
4. Le workflow `.github/workflows/deploy.yml` se déclenche automatiquement

L'app sera disponible sur `https://votre-username.github.io/baronne-malia/`

### 6. Installer sur mobile

1. Ouvrez l'URL dans Chrome (Android) ou Safari (iOS)
2. **Chrome** : Menu → "Ajouter à l'écran d'accueil"
3. **Safari** : Partager → "Sur l'écran d'accueil"

L'app fonctionne ensuite comme une application native, hors-ligne incluse.

## Structure du projet

```
src/
  components/       Composants UI partagés
  data/             Données scientifiques (courbes, conseils)
  hooks/            Hooks React (useSupabaseData)
  lib/              Client Supabase
  pages/            Pages principales (Home, Saisie, Courbe, Conseils)
  types/            Types TypeScript
  utils/            Calculs nutritionnels
```

## Licence

MIT
