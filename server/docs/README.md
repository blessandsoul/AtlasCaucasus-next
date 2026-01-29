# Tourism Server API Docs

Base URL:

- `http://localhost:3000/api/v1`

## Response Format

All endpoints return one of the following shapes.

### Success

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Modules

- Auth: see `./auth.md`
- Users: see `./users.md`
- Tours: see `./tours.md`
- Examples: see `./examples.md`

## Local Setup

- Setup: see `./setup.md`
