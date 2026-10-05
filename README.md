# VISTOAFRIKA

Application de gestion des inscriptions et paiements, avec frontend React/Vite, API Node.js/Express et MongoDB Atlas via Prisma. PostgreSQL n'est conservé que comme source éventuelle de la migration de données.

## 1. Installation

Prérequis : Node.js 20+, npm, une base MongoDB (Atlas en production) et Git. PostgreSQL est requis uniquement pour exécuter la migration historique, si nécessaire.

```powershell
cd backend
npm install
npx prisma generate
cd ../vistoafrica
npm install
```

Ne committez jamais `.env`, les mots de passe, les clés JWT ou les mots de passe d'application email.

## 2. Variables d'environnement

Copiez les modèles puis renseignez des valeurs locales :

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item vistoafrica/.env.example vistoafrica/.env
```

Backend : `MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM`, `EMAIL_TO` et `PDF_STORAGE_PATH` sont les variables principales. En production, `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` d'au moins 32 caractères, `ALLOWED_ORIGINS`, `EMAIL_USER` et `EMAIL_APP_PASSWORD` sont obligatoires. `POSTGRESQL_SOURCE_URL` est facultatif et réservé au script de migration historique.

Frontend : `VITE_API_URL` doit pointer vers l'URL publique de l'API, sans ajouter `/api` : par exemple `https://api.example.com`.

La chaîne MongoDB Atlas est un secret : renseignez `MONGODB_URI` dans l'environnement local ou dans le gestionnaire de variables sécurisé de l'hébergeur. Ne la publiez pas et ne la commitez pas. `DATABASE_URL` PostgreSQL ne remplace pas cette variable pour l'exécution du backend.

## 3. Connexion MongoDB

Pour MongoDB Atlas, créez un utilisateur de base de données, autorisez l'adresse IP du service dans Network Access, puis fournissez une URI avec le nom de base après l'hôte :

```text
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/vistoafrica?retryWrites=true&w=majority
```

En local, utilisez MongoDB local avec un chemin de base explicite, par exemple :

```text
mongodb://127.0.0.1:27017/vistoafrica
```

Dans Render, définissez `MONGODB_URI` dans **Service → Environment**, puis redéployez le backend. Une variable `DATABASE_URL` contenant une URL PostgreSQL ne suffit pas.

## 4. Prisma

Depuis `backend` :

```powershell
npm run prisma:generate
```

Prisma lit `MONGODB_URI` depuis `backend/.env`. Le client est régénéré automatiquement avant `npm run build`.

## 5. Migrations

Le connecteur MongoDB n'utilise pas les migrations SQL Prisma. Après une modification validée du schéma, synchronisez explicitement la base cible :

```powershell
npm run prisma:generate
npm run prisma:push
```

Ne lancez pas `prisma db push` automatiquement au démarrage de production. Vérifiez la sauvegarde et le schéma cible avant toute synchronisation.

## 6. Seed administrateur

Définissez `SUPER_ADMIN_EMAIL` et `SUPER_ADMIN_PASSWORD` dans `backend/.env`, puis exécutez :

```powershell
npm run seed:admin
```

Le seed est idempotent : il crée l'administrateur ou met à jour son mot de passe si nécessaire. Utilisez un mot de passe unique et fort en production.

## 7. Lancement frontend

```powershell
cd vistoafrica
npm run dev
```

Le frontend est disponible sur `http://localhost:5173`.

## 8. Lancement backend

```powershell
cd backend
npm run dev
```

L'API est disponible sur `http://localhost:5000`. Le health check est `GET /health` et vérifie la connexion PostgreSQL.

## 9. Build production

Frontend :

```powershell
cd vistoafrica
npm run build
npm run preview
```

Backend :

```powershell
cd backend
npm run build
npm run prisma:migrate:deploy
npm run seed:admin
npm start
```

Le backend démarre avec `dist/server.js`. Le dossier frontend à publier est `vistoafrica/dist`.

## 10. Déploiement

1. Déployez ou vérifiez MongoDB Atlas et son accès réseau/utilisateur.
2. Dans Render → **Service → Environment**, définissez `MONGODB_URI` ainsi que `NODE_ENV=production`, `PORT`, `JWT_SECRET`, `ALLOWED_ORIGINS` et les variables email. `MONGODB_URI` doit inclure le nom de base, par exemple `/vistoafrica`, avant les options `?`.
3. Déployez le backend avec le répertoire racine `backend`, `npm ci`, `npm run build` (le script pré-build génère Prisma), puis `npm start`. Ne configurez pas PostgreSQL `DATABASE_URL` à la place de `MONGODB_URI`.
4. Déployez le frontend après avoir défini `VITE_API_URL` vers l'API publique, puis lancez `npm run build`.
5. Configurez le domaine frontend dans `ALLOWED_ORIGINS` et vérifiez `GET /health`.
6. Montez un volume persistant sur `PDF_STORAGE_PATH` ou remplacez le stockage local par un stockage objet avant un déploiement multi-instance. Les PDFs sont actuellement stockés sur disque local.
7. Activez TLS/HTTPS, les sauvegardes Atlas, la rotation des secrets et la surveillance des logs.

### Sécurité et exploitation

- Helmet, CORS explicite, limitation globale et limitation renforcée de la connexion admin sont activés.
- Les erreurs internes sont journalisées côté serveur sans exposer leur détail au client.
- Les logs HTTP sont lisibles en développement et au format combiné en production.
- Le serveur gère `SIGTERM` et ferme Prisma proprement.
- Utilisez un mot de passe Gmail d'application SMTP, jamais le mot de passe principal.
- Vérifiez que `backend/.env` et `vistoafrica/.env` restent ignorés par Git avant chaque push.
