# About

This is a document versioning application made for a college course.

# Requirements

Set environmental variable `DOCKER_BUILDKIT=1`

# Running

>This environment hosts the entire application on `localhost:3000`.

Start:
```sh
docker compose --profile all up -d --build
```

Stop:
```sh
docker compose --profile all down
```

Cleanup:
```sh
docker compose --profile all down -v
```

# Development

## Frontend

### Databse + Backend environment

>This environment has to be running during frontend development.

Start:
```sh
docker compose --profile backend up -d --build
```

Stop:
```sh
docker compose --profile backend down
```

Cleanup:
```sh
docker compose --profile backend down -v
```

### Frontend

Start:
```sh
npm run --prefix frontend start
```
`Ctrl-C` to quit.

## Backend

### Databse environment

>This environment has to be running during backend development.

Start:
```sh
docker compose --profile db up -d
```
(no `--build` because we are using pre-made images)

Stop:
```sh
docker compose --profile db down
```

Cleanup:
```sh
docker compose --profile db down -v
```

### Backend

Start:
```sh
cd backend
cargo run
cd ..
```

# API documentation

Because Rust webservers are young, there aren't many OpenAPI generators, most of them require boilerplate.  
For that reason Postman is used and kept up to date in the [`Apsi.postman_collection.json`](./Apsi.postman_collection.json) file.

The simplest usage requires you to register, then login and copy JWT token into collection global variables.  
Further usage is adequate.
