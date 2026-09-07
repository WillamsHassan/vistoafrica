# VISTOAFRIKA

Application de gestion des inscriptions et paiements, avec frontend React/Vite, API Node.js/Express et PostgreSQL via Prisma.

## 1. Installation

Prérequis : Node.js 20+, npm, PostgreSQL 15+ et Git.

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

Backend : `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM`, `EMAIL_TO` et `PDF_STORAGE_PATH` sont les variables principales. En production, `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` d'au moins 32 caractères, `ALLOWED_ORIGINS`, `EMAIL_USER` et `EMAIL_APP_PASSWORD` sont obligatoires.

Frontend : `VITE_API_URL` doit pointer vers l'URL publique de l'API, sans ajouter `/api` : par exemple `https://api.example.com`.

La base PostgreSQL de production fournie doit être placée uniquement dans `backend/.env` sur la machine de déploiement, sous `DATABASE_URL`. Elle n'est pas copiée ici et ne doit pas être ajoutée au dépôt.

## 3. Installation PostgreSQL

En local, créez une base et un utilisateur :

```sql
CREATE USER vistoafrica_user WITH PASSWORD 'mot-de-passe-local';
CREATE DATABASE vistoafrica OWNER vistoafrica_user;
```

Utilisez ensuite une URL de la forme :

```text
postgresql://vistoafrica_user:mot-de-passe-local@localhost:5432/vistoafrica?schema=public
```

Pour la base distante de production, configurez sa chaîne privée dans la variable `DATABASE_URL` du service backend. Ne la mettez ni dans ce README, ni dans un fichier suivi par Git.

## 4. Prisma

Depuis `backend` :

```powershell
npm run prisma:generate
```

Prisma lit `DATABASE_URL` depuis `backend/.env`. Les fichiers de migration sont versionnés, mais ils ne contiennent aucun secret.

## 5. Migrations

En développement, créez une migration après une modification du schéma :

```powershell
npm run prisma:migrate:dev -- --name nom_de_la_migration
```

En production, appliquez uniquement les migrations versionnées :

```powershell
npm run prisma:migrate:deploy
```

N'utilisez pas `prisma db push` en production sauf procédure exceptionnelle et validée.

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

1. Déployez PostgreSQL et conservez sa chaîne privée dans les variables sécurisées de l'hébergeur.
2. Déployez le backend avec `npm ci`, `npm run prisma:generate`, `npm run build`, `npm run prisma:migrate:deploy`, puis `npm start`.
3. Définissez `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS` et les variables email.
4. Déployez le frontend après avoir défini `VITE_API_URL` vers l'API publique, puis lancez `npm run build`.
5. Configurez le domaine frontend dans `ALLOWED_ORIGINS` et vérifiez `GET /health`.
6. Montez un volume persistant sur `PDF_STORAGE_PATH` ou remplacez le stockage local par un stockage objet avant un déploiement multi-instance. Les PDFs sont actuellement stockés sur disque local.
7. Activez TLS/HTTPS, les sauvegardes PostgreSQL, la rotation des secrets et la surveillance des logs.

### Sécurité et exploitation

- Helmet, CORS explicite, limitation globale et limitation renforcée de la connexion admin sont activés.
- Les erreurs internes sont journalisées côté serveur sans exposer leur détail au client.
- Les logs HTTP sont lisibles en développement et au format combiné en production.
- Le serveur gère `SIGTERM` et ferme Prisma proprement.
- Utilisez un mot de passe Gmail d'application SMTP, jamais le mot de passe principal.
- Vérifiez que `backend/.env` et `vistoafrica/.env` restent ignorés par Git avant chaque push.
