# 🏛️ Campus Facility Booking System

A full-stack web application for managing campus facility reservations, built with **Spring Boot** and a **PWA-ready** vanilla JavaScript frontend.

## Features

- **Authentication** — Sign up / sign in with role-based access (Student, Staff, Admin)
- **Facility Browsing** — View all bookable spaces with location and capacity details
- **Availability Checker** — See real-time slot availability for any facility on any date
- **Booking Management** — Create, view, and cancel your own reservations
- **Admin Dashboard** — Manage facilities, users, and bookings with live stats
- **PWA Support** — Installable app with service worker, offline caching, and responsive mobile UI

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Java 25, Spring Boot 3.5            |
| Database   | PostgreSQL (Neon cloud)             |
| ORM        | Spring Data JPA / Hibernate         |
| Frontend   | Vanilla JS, HTML5, CSS3             |
| Build      | Maven                               |

## Project Structure

```
src/main/java/com/group5/facility_booking/
├── controller/       # REST endpoints (Auth, Booking, Facility, User, Availability)
├── dto/              # Request/response DTOs
├── exception/        # Custom exceptions + global handler
├── model/            # JPA entities (User, Facility, Booking)
├── repository/       # Spring Data repositories
├── service/          # Business logic layer
├── DataSeeder.java   # Seeds default admin account on startup
└── FacilityBookingApplication.java

src/main/resources/
├── static/           # Frontend (HTML, JS, CSS, PWA assets)
└── application.properties
```

## Getting Started

### Prerequisites

- **Java 25** (or compatible JDK)
- **Maven** (or use the included `mvnw` wrapper)
- **PostgreSQL** database (local or cloud)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoshNuku/facility-booking.git
   cd facility-booking
   ```

2. **Configure the database** — Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://<host>:<port>/<database>
   spring.datasource.username=<username>
   spring.datasource.password=<password>
   ```

3. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```

4. **Open in browser** — Navigate to `http://localhost:8080/api/v1/login.html`

### Default Admin Credentials

| Email              | Password  |
|--------------------|-----------|
| admin@campus.edu   | admin123  |

> The admin account is automatically seeded on first startup.

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| POST   | `/auth/signup`                    | Register a new user          |
| POST   | `/auth/login`                     | Sign in                      |
| GET    | `/facilities`                     | List all facilities          |
| POST   | `/facilities`                     | Create a facility            |
| PUT    | `/facilities/{id}`                | Update a facility            |
| DELETE | `/facilities/{id}`                | Delete a facility            |
| GET    | `/bookings`                       | List all bookings            |
| GET    | `/bookings/user/{userId}`         | List bookings for a user     |
| POST   | `/bookings`                       | Create a booking             |
| PUT    | `/bookings/{id}`                  | Update a booking             |
| PUT    | `/bookings/{id}/status`           | Update booking status        |
| GET    | `/availability/{facilityId}`      | Check facility availability  |
| GET    | `/users`                          | List all users               |
| POST   | `/users`                          | Create a user                |
| PUT    | `/users/{id}`                     | Update a user                |
| DELETE | `/users/{id}`                     | Delete a user                |

## Screenshots

The app features a modern PWA interface with:
- Frosted glass app bar with user avatar
- Card-based facility and booking views
- Mobile bottom navigation
- Admin dashboard with stats cards and collapsible form drawers

## Group 5

Web and Mobile Architecture — Mini Project
