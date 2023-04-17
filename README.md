# About

This is a document versioning application made for a college course.

# Running

Currently backend and frontend are run separately:

First run
```sh
docker compose --profile all up -d
```
to start the database, file storage and backend server, then run
```sh
cd frontend
npm start
```

## Closing
Abort the frontend server process with CTRL+C, then run
```sh
cd ..
docker compose --profile all down
```

If you want to hard reset all data do
```sh
cd ..
docker compose --profile all down -v
```
instead

# Development

## Frontend

```sh
cd frontend
npm watch
```

## Backend

### Setup

```sh
docker compose --profile db up -d
cd backend
```

### Running

```sh
cargo run
```

### Teardown

```sh
cd ..
docker compose --profile db down -v
```

# API documentation

Because Rust webservers are young, there aren't many OpenAPI generators, most of them require boilerplate.
For that reason Postman is used and kept up to date in the `Apsi.postman_collection.json` file.

The simplest usage requires you to register, then login and copy JWT token into collection global variables.
Further usage is adequate.
