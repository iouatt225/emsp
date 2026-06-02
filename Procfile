web: python manage.py migrate && gunicorn emsp1.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --access-logfile -
