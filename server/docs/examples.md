# API Examples (cURL)

Base URL:

- `http://localhost:3000/api/v1`

## Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

## Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Me

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Refresh

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

## Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

## Self update (allowed)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/<YOUR_USER_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"firstName":"Updated"}'
```

## Forbidden update (non-admin updating someone else)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/<OTHER_USER_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <NON_ADMIN_ACCESS_TOKEN>" \
  -d '{"firstName":"Hacker"}'
```

## Admin: change role

```bash
curl -X PATCH http://localhost:3000/api/v1/users/<USER_ID>/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -d '{"role":"ADMIN"}'
```

## Create tour

```bash
curl -X POST http://localhost:3000/api/v1/tours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"title":"Kazbegi Day Trip","price":199.99,"city":"Tbilisi","durationMinutes":480,"maxPeople":12}'
```

## Get public tour by id

```bash
curl -X GET http://localhost:3000/api/v1/tours/<TOUR_ID>
```

## List my tours

```bash
curl -X GET "http://localhost:3000/api/v1/me/tours?skip=0&take=20&includeInactive=true" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Update tour (owner or admin)

```bash
curl -X PATCH http://localhost:3000/api/v1/tours/<TOUR_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"title":"Updated title","price":250}'
```

## Delete tour (soft delete)

```bash
curl -X DELETE http://localhost:3000/api/v1/tours/<TOUR_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
