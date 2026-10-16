# Playwright practice repo

Using the 'practice-software-testing' project and setting up a Playwright testing suite on it.

# Troubleshooting
API returned 500 on a fresh setup:
it was being caused by wrong container user permissions on the Laravel (api) container, fix it by running: 
```
docker compose exec -u root laravel-api sh -c "chmod -R 777 storage bootstrap/cache"
docker compose exec laravel-api php artisan migrate:fresh --seed
```

Api did not respond, "web" docker container exited:
nginx exited at startup because it couldn’t resolve the hostname phpmyadmin, so it was a startup-order problem
restarting the "web" container after the rest of the app solved it. At this point I set up a sh file to get the project to start just right on my setup