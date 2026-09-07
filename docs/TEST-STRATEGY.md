# Strategie de tests VISTOAFRIKA

## Objectif

Valider les parcours publics, les permissions admin et le workflow de paiement de bout en bout sans utiliser de secrets de production.

## Commandes

Backend :

```powershell
cd backend
npm run prisma:generate
npm test
npm run build
```

Frontend :

```powershell
cd vistoafrica
npm test
npm run build
```

## Couverture minimale

### Frontend

- Navigation vers `/a-propos` et `/contact`.
- Formulaire contact : champs nom, email, telephone, objet et message.
- Validation des champs obligatoires et du format email.
- Selection d'une formation depuis les formations API.
- Creation du dossier d'inscription et conservation du jeton d'acces.
- Recapitulatif avant paiement.
- Declaration du paiement avec moyen et reference.
- Affichage des coordonnees SiteSetting.
- Responsive : mobile 390 px, tablette 768 px, desktop 1280 px.

### Backend

- Creation de l'etudiant et de l'inscription avec `PAYMENT_PENDING`.
- Recuperation des formations actives.
- Declaration authentifiee par le jeton prive d'inscription.
- Rejet d'un jeton ou d'un identifiant qui ne correspondent pas.
- Validation admin : `DECLARED -> VERIFIED` et inscription `-> CONFIRMED`.
- Rejet admin : paiement `-> REJECTED`, sans confirmation.
- Generation de facture et notification email apres confirmation.
- Authentification admin, expiration JWT et compte admin inexistant.
- Refus de toutes les routes `/admin/*` sans bearer token valide.
- Refus d'une declaration publique directe vers `VERIFIED`.
- Protection d'un PDF par authentification admin.

## Workflow critique

```text
INSCRIPTION
  -> PAYMENT_PENDING
  -> PAYMENT_DECLARED
  -> ADMIN VERIFY
  -> PAYMENT_VERIFIED
  -> REGISTRATION CONFIRMED
  -> FACTURE
  -> EMAIL
```

La machine de transitions est testee dans `backend/src/services/paymentWorkflow.test.ts`. Les tests d'integration HTTP doivent utiliser une base PostgreSQL dediee et un compte Resend de test ou un faux serveur HTTP ; ils ne doivent jamais utiliser `backend/.env` de production.

## Tests E2E recommandes

Installer Playwright dans un environnement CI dedie, demarrer backend et frontend sur des ports de test, puis couvrir :

1. Navigation public et redirection admin.
2. Inscription invalide puis valide.
3. Selection d'une formation API et verification du recapitulatif.
4. Declaration de paiement avec jeton valide.
5. Tentative avec un autre ID ou un autre jeton : `404`.
6. Connexion admin puis confirmation/rejet.
7. Telechargement PDF sans exposition de chemin interne.
8. Captures aux viewports mobile, tablette et desktop.

## Donnees de test

Utiliser des emails `@example.test`, une base PostgreSQL ephemere et des valeurs SiteSetting de test. Les secrets presents dans `.env` doivent rester hors des logs et etre renouveles s'ils ont ete exposes.
