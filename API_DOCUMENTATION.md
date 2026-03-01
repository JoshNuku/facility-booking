# Campus Facility Booking API Documentation

## Base URL

`http://localhost:8080/api/v1`

## Data Types

- `bookingDate`: `YYYY-MM-DD`
- `startTime`, `endTime`: `HH:mm:ss`
- `role`: `STUDENT | ADMIN | STAFF`
- `status`: `PENDING | CONFIRMED | CANCELLED`

---

## Facilities

### GET /facilities

Returns all facilities.

**Response 200**

```json
[
  {
    "id": 1,
    "name": "Main Lab",
    "location": "Engineering Block A",
    "capacity": 50
  }
]
```

### GET /facilities/{id}

Returns a facility by ID.

### POST /facilities

Creates a facility.

**Request**

```json
{
  "name": "Conference Room B",
  "location": "Engineering Block C",
  "capacity": 30
}
```

**Response 201**

```json
{
  "id": 2,
  "name": "Conference Room B",
  "location": "Engineering Block C",
  "capacity": 30
}
```

### PUT /facilities/{id}

Updates a facility.

### DELETE /facilities/{id}

Deletes a facility.

---

## Users

### GET /users

Returns all users.

### GET /users/{id}

Returns a user by ID.

### POST /users

Creates a user.

**Request**

```json
{
  "name": "Ama Mensah",
  "email": "ama@st.ug.edu.gh",
  "role": "STUDENT"
}
```

### PUT /users/{id}

Updates a user.

### DELETE /users/{id}

Deletes a user.

---

## Bookings

### GET /bookings

Returns booking history.

### GET /bookings/{id}

Returns one booking.

### POST /bookings

Creates a booking with conflict validation.

**Request**

```json
{
  "facilityId": 1,
  "userId": 1,
  "bookingDate": "2026-02-20",
  "startTime": "11:00:00",
  "endTime": "12:00:00",
  "status": "PENDING"
}
```

**Response 201**

```json
{
  "id": 3,
  "facility": {
    "id": 1,
    "name": "Main Lab",
    "location": "Engineering Block A",
    "capacity": 50
  },
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@st.ug.edu.gh",
    "role": "STUDENT"
  },
  "bookingDate": "2026-02-20",
  "startTime": "11:00:00",
  "endTime": "12:00:00",
  "status": "PENDING"
}
```

### PUT /bookings/{id}

Updates booking fields (including status).

### DELETE /bookings/{id}

Cancels a booking (sets status to `CANCELLED`).

---

## Availability

### GET /availability

Checks a facility slot.

**Query Params**

- `facilityId` (int)
- `bookingDate` (YYYY-MM-DD)
- `startTime` (HH:mm:ss)
- `endTime` (HH:mm:ss)

**Example**
`GET /availability?facilityId=1&bookingDate=2026-02-20&startTime=09:00:00&endTime=09:30:00`

**Response 200**

```json
{
  "facilityId": 1,
  "bookingDate": "2026-02-20",
  "startTime": "09:00:00",
  "endTime": "09:30:00",
  "available": false
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request payload"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```
