#!/usr/bin/env bash
#only use if you are having the issues mentioned in README.md
set -e
cd ~/projects/practice-software-testing

docker compose up -d
sleep 10
docker compose up -d web   # restarts web if it lost the race
docker compose exec -u root laravel-api sh -c "chmod -R 777 storage bootstrap/cache"
docker compose exec laravel-api php artisan migrate:fresh --seed

until curl -sf http://localhost:8091/brands > /dev/null; do
  echo "Waiting for API..."; sleep 3
done
echo "API is ready"