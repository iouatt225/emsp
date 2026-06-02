# Deployment Render

## Architecture cible

- `emsp-backend`: service web Django pour l'API, l'administration et le site public React buildé dans le meme service.
- `Supabase Postgres`: base de donnees persistante.
- `Supabase Storage`: stockage persistant des fichiers `ImageField` et `FileField`.

## Variables d'environnement du backend

```env
DEBUG=False
SECRET_KEY=<cle-django-longue-et-secrete>
DATABASE_URL=<chaine-de-connexion-postgres-supabase>
ALLOWED_HOSTS=.onrender.com
CSRF_TRUSTED_ORIGINS=https://*.onrender.com
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://<domaine-frontend-render>
CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.onrender\.com$
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

SUPABASE_STORAGE_BUCKET=<nom-du-bucket-public>
SUPABASE_STORAGE_ENDPOINT=https://<project-ref>.supabase.co/storage/v1/s3
SUPABASE_STORAGE_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public/<nom-du-bucket-public>
SUPABASE_STORAGE_ACCESS_KEY=<access-key>
SUPABASE_STORAGE_SECRET_KEY=<secret-key>
SUPABASE_STORAGE_REGION=eu-west-1
SUPABASE_STORAGE_LOCATION=media
```

### Bloc Render pret a coller

```env
ALLOWED_HOSTS=.onrender.com
CORS_ALLOWED_ORIGINS=https://emsp.onrender.com
CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.onrender\.com$
CORS_ALLOW_ALL_ORIGINS=False
CSRF_COOKIE_SECURE=True
CSRF_TRUSTED_ORIGINS=https://*.onrender.com
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
DEBUG=False
SECRET_KEY=<generate-a-new-django-secret>
SESSION_COOKIE_SECURE=True
SUPABASE_STORAGE_ACCESS_KEY=<supabase-storage-access-key>
SUPABASE_STORAGE_BUCKET=emsp1
SUPABASE_STORAGE_ENDPOINT=https://eymfvjdfeamexeuelutc.supabase.co/storage/v1/s3
SUPABASE_STORAGE_LOCATION=media
SUPABASE_STORAGE_PUBLIC_URL=https://eymfvjdfeamexeuelutc.supabase.co/storage/v1/object/public/emsp1
SUPABASE_STORAGE_REGION=eu-west-1
SUPABASE_STORAGE_SECRET_KEY=<supabase-storage-secret-key>
VITE_API_BASE_URL=https://emsp.onrender.com/api
```

### Remarques importantes

- `DATABASE_URL` ne doit pas pointer vers `db.sqlite3`. Render efface le disque local entre les deploiements.
- Le bucket Supabase doit etre public, sinon les URLs generees par Django ne seront pas lisibles dans le navigateur.
- Si tu veux aussi utiliser Render pour la base de donnees, remplace simplement `DATABASE_URL` par l'URL du service Postgres Render.
- Evite les guillemets autour des valeurs dans Render. Dans un vrai fichier `.env`, `env.list()` et `env.db()` peuvent parfois conserver les guillemets comme partie de la valeur.
- Si une valeur commence par `#`, comme ton `SECRET_KEY`, il faut la mettre entre guillemets dans un vrai fichier `.env`, par exemple `SECRET_KEY="#..."`. Sinon `#` est interprete comme un commentaire.
- Pour Supabase Storage, l'endpoint S3 doit ressembler a `https://<project-ref>.supabase.co/storage/v1/s3`.
- La variable `SUPABASE_STORAGE_PUBLIC_URL` doit inclure le bucket, par exemple `https://<project-ref>.supabase.co/storage/v1/object/public/emsp1`.
- Comme tu as partage un secret Supabase ici, considere le `SUPABASE_STORAGE_SECRET_KEY` comme a renouveler si ce fichier a ete expose ailleurs.

## Variables d'environnement du frontend

```env
VITE_API_BASE_URL=https://<nom-du-backend>.onrender.com/api
```

- Le frontend derive automatiquement les URLs `/media/...` et `/static/...` a partir de cette base.
- En local, tu peux laisser cette variable vide.

## Commandes Render

### Backend

- Build: `pip install -r requirements.txt && cd emsp2-frontend && npm ci && npm run build && cd .. && python manage.py collectstatic --noinput`
- Start: `python manage.py migrate && gunicorn emsp1.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --access-logfile -`

### Cas du template Python Render

- Si Render lance encore `gunicorn app:app`, le fichier [app.py](C:\Users\DEPS\emsp1\app.py) ajoute un point d'entree compatible pour que le service demarre quand meme.
- Pour conserver les WebSockets et le comportement ASGI complet, remplace ensuite la commande de demarrage par celle du backend ci-dessus.

### Frontend

- Utilise uniquement le build Vite integre dans le service web principal.

## Validation apres deploiement

1. Ouvrir le backend et verifier `/admin/` et `/api/`.
2. Ouvrir le frontend et verifier la connexion, les images et la mediatheque.
3. Creer un superutilisateur si la base Supabase est vide.
4. Uploader un fichier de test pour confirmer que Supabase Storage fonctionne.
