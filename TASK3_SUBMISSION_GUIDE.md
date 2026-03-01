# Task 3 Submission Guide

## 1) Frontend Features Implemented

The UI is available at:

- `http://localhost:8080/api/v1/index.html`

Implemented features:

- Display available facilities
- Select facility and view 30-minute availability slots
- Create bookings
- Display booking history
- Update booking status from history

Frontend files:

- `src/main/resources/static/index.html`
- `src/main/resources/static/styles.css`
- `src/main/resources/static/app.js`

## 2) Integration Validation Checklist

1. Start backend.
2. Open UI URL above.
3. Verify facilities render.
4. Select facility/date and check slots.
5. Create a booking.
6. Confirm new booking appears in history.
7. Change status and confirm it updates.

## 3) Deployment (Render example)

1. Push project to GitHub.
2. Create a PostgreSQL instance on Render.
3. Create a new Web Service from the repository.
4. Build command:
   - `./mvnw clean package -DskipTests`
5. Start command:
   - `java -jar target/facility-booking-0.0.1-SNAPSHOT.jar`
6. Set environment variables:
   - `DB_URL=jdbc:postgresql://<host>:<port>/<db>`
   - `DB_USERNAME=<username>`
   - `DB_PASSWORD=<password>`
7. Confirm app URL + `/api/v1/index.html` and `/api/v1/swagger-ui/index.html` work.

## 4) 3-Minute Demo Video Script

- 0:00–0:30: Project intro and MVC overview.
- 0:30–1:10: Show facility list and availability slots.
- 1:10–1:50: Create booking and explain conflict logic.
- 1:50–2:30: Show booking history and status updates.
- 2:30–3:00: Show Swagger docs and deployed URL.

## 5) Folder Packaging

Use required folder name format:

- `groupnumber_miniproject`

Include:

- source code
- hosted URL
- `API_DOCUMENTATION.md`
- demo video link/file
