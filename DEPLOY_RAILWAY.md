# Feuille de route deploiement Railway

## 1. Preparer le depot

- Commiter les fichiers ajoutes/modifies pour Railway :
  - `requirements.txt`
  - `Procfile`
  - `nixpacks.toml`
  - `railway.json`
  - `runtime.txt`
  - `.dockerignore`
  - `.gitignore`
  - `emsp1/settings.py`
  - `emsp1/urls.py`
  - `apps/core/urls.py`
  - fichiers React modifies dans `emsp2-frontend/src`
- Ne jamais commiter `.env`, `db.sqlite3`, `.venv/`, `staticfiles/` ni `node_modules/`.
- S'assurer que `.dockerignore` exclut aussi `node_modules/`, `emsp2-frontend/node_modules/` et les artefacts locaux pour eviter qu'un environnement Windows ecrase les dependances Linux pendant le build Railway.

## 2. Creer le projet Railway

1. Creer un nouveau projet Railway.
2. Ajouter un service depuis le repo GitHub du projet.
3. Ajouter un service PostgreSQL dans le meme projet.
4. Dans le service web, configurer les variables d'environnement.

## 3. Variables d'environnement Railway

Variables minimales du service web :

```env
DEBUG=False
SECRET_KEY=<generer-une-cle-django-longue-et-secrete>
DATABASE_URL=${{Postgres.DATABASE_URL}}
ALLOWED_HOSTS=.up.railway.app,.railway.app,<ton-domaine-si-tu-en-as-un>
CSRF_TRUSTED_ORIGINS=https://*.up.railway.app,https://*.railway.app,https://<ton-domaine-si-tu-en-as-un>
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://<ton-domaine-railway>
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

Note frontend :

- Si le frontend React et Django sont servis par le meme service Railway, aucune variable `VITE_API_BASE_URL` n'est necessaire.
- Le frontend peut appeler l'API via `/api` sur le meme domaine.
- Ne definir `VITE_API_BASE_URL` que si l'API est hebergee sur un autre domaine.

Important pour `DATABASE_URL` :

- Utiliser de preference une reference Railway vers le service PostgreSQL du meme projet, par exemple `\${{Postgres.DATABASE_URL}}`.
- Ne pas copier manuellement une URL interne du type `postgres.railway.internal` depuis un autre projet ou un autre environnement.
- Si le service web et PostgreSQL ne sont pas dans le meme projet Railway, l'hostname interne Railway peut etre introuvable au runtime.
- En cas de doute, supprimer puis recreer la variable `DATABASE_URL` via la reference Railway du service PostgreSQL attache au projet courant.

Pour generer une cle Django :

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 4. Build et start

Railway utilisera `nixpacks.toml` :

- utilisation exclusive du provider Python de Nixpacks
- ajout de Node + bibliotheques systeme necessaires
- `pip install -r requirements.txt`
- `cd emsp2-frontend && npm ci`
- `cd emsp2-frontend && npm run build`
- `python manage.py collectstatic --noinput`

Commande de demarrage :

```bash
python manage.py migrate && gunicorn emsp1.wsgi:application --bind 0.0.0.0:$PORT
```

## 5. Apres premier deploiement

1. Generer le domaine public Railway dans l'onglet Networking.
2. Mettre a jour si besoin :
   - `ALLOWED_HOSTS`
   - `CSRF_TRUSTED_ORIGINS`
   - `CORS_ALLOWED_ORIGINS`
3. Redeployer le service.
4. Tester :
   - `/`
   - `/login`
   - `/actualites`
   - `/mediatheque`
   - `/admin/dashboard` ou `/dashboard/index.html`
   - APIs `/api/...`

## 6. Donnees et medias

- La base locale `db.sqlite3` ne sera pas utilisee sur Railway.
- PostgreSQL Railway sera vide au premier deploiement.
- Importer les donnees importantes via fixtures, admin Django, ou script de migration.
- Les fichiers dans `media/` existants dans le depot seront servis, a condition de ne pas exclure `media/` dans `.dockerignore`.
- Les futurs uploads utilisateurs sur Railway ne sont pas persistants sans volume ou stockage externe. Pour une vraie production, ajouter un volume Railway ou un stockage type S3/Cloudinary.

## 7. Verification locale avant push

```bash
npm --prefix emsp2-frontend run build
python manage.py check
python manage.py collectstatic --noinput
```

En mode proche production :

```bash
DEBUG=False DATABASE_URL=sqlite:///db.sqlite3 ALLOWED_HOSTS=localhost,127.0.0.1 python manage.py check
```
