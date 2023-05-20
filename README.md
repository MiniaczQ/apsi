# About

This is a document versioning application made for a college course.

# Running

Currently backend and frontend are run separately.

## Starting

### Backend

Run

```sh
docker compose --profile all up -d
```

to start the database, file storage and backend server.

If there were any changes to project since last run, execute

```sh
docker compose --profile all up -d --build
```

instead to rebuild the server image.

### Frontend

Run

```sh
npm run --prefix frontend start
```

to start frontend development server.

## Closing

### Frontend

Quit the frontend server process with Ctrl-C.

### Backend

Run

```sh
docker compose --profile all down
```

If you want to wipe all project-related storage data (created documents, versions, users, etc.), do

```sh
docker compose --profile all down -v
```

instead.

# Development

## Frontend

The following commands start the development server.

```sh
npm run --prefix frontend start
```

## Backend

### Setup

```sh
docker compose --profile db up -d
```

### Running

```sh
cargo run --manifest-path=backend/Cargo.toml
```

### Teardown

```sh
docker compose --profile db down -v
```

# API documentation

Because Rust webservers are young, there aren't many OpenAPI generators, most of them require boilerplate.  
For that reason Postman is used and kept up to date in the [`Apsi.postman_collection.json`](./Apsi.postman_collection.json) file.

The simplest usage requires you to register, then login and copy JWT token into collection global variables.  
Further usage is adequate.
