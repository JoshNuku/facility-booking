const PAGE_PATH = window.location.pathname;
const BASE_PATH = PAGE_PATH.endsWith("/index.html")
    ? PAGE_PATH.replace(/\/index\.html$/, "")
    : PAGE_PATH.replace(/\/$/, "");
const API_BASE = `${window.location.origin}${BASE_PATH}`;

const facilitiesList = document.getElementById("facilities-list");
const availabilityFacility = document.getElementById("availability-facility");
const availabilityDate = document.getElementById("availability-date");
const checkAvailabilityBtn = document.getElementById("check-availability-btn");
const availabilityResults = document.getElementById("availability-results");

const bookingForm = document.getElementById("booking-form");
const bookingFacility = document.getElementById("booking-facility");
const bookingUser = document.getElementById("booking-user");
const bookingDate = document.getElementById("booking-date");
const bookingStartTime = document.getElementById("booking-start-time");
const bookingEndTime = document.getElementById("booking-end-time");
const bookingStatus = document.getElementById("booking-status");
const bookingFormMessage = document.getElementById("booking-form-message");

const bookingsBody = document.getElementById("bookings-body");
const refreshBookingsBtn = document.getElementById("refresh-bookings-btn");

const facilityAdminForm = document.getElementById("facility-admin-form");
const facilityAdminId = document.getElementById("facility-admin-id");
const facilityAdminName = document.getElementById("facility-admin-name");
const facilityAdminLocation = document.getElementById("facility-admin-location");
const facilityAdminCapacity = document.getElementById("facility-admin-capacity");
const facilityAdminMessage = document.getElementById("facility-admin-message");
const facilityAdminClear = document.getElementById("facility-admin-clear");
const facilityAdminBody = document.getElementById("facility-admin-body");

const userAdminForm = document.getElementById("user-admin-form");
const userAdminId = document.getElementById("user-admin-id");
const userAdminName = document.getElementById("user-admin-name");
const userAdminEmail = document.getElementById("user-admin-email");
const userAdminRole = document.getElementById("user-admin-role");
const userAdminMessage = document.getElementById("user-admin-message");
const userAdminClear = document.getElementById("user-admin-clear");
const userAdminBody = document.getElementById("user-admin-body");

let cachedBookings = [];
let cachedFacilities = [];
let cachedUsers = [];

function toIsoTime(value) {
    if (!value) return value;
    return value.length === 5 ? `${value}:00` : value;
}

function addMinutesToTime(time, minutesToAdd) {
    const [hours, minutes] = time.split(":").map(Number);
    const total = hours * 60 + minutes + minutesToAdd;
    const nextHours = Math.floor(total / 60);
    const nextMinutes = total % 60;
    return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}:00`;
}

async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;
        try {
            const data = await response.json();
            if (data.error) errorMessage = data.error;
        } catch (_) {
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function renderFacilities(facilities) {
    facilitiesList.innerHTML = facilities.map((facility) => `
        <article class="card">
            <h3>${facility.name}</h3>
            <p><strong>Location:</strong> ${facility.location}</p>
            <p><strong>Capacity:</strong> ${facility.capacity}</p>
            <p><strong>ID:</strong> ${facility.id}</p>
        </article>
    `).join("");
}

function populateFacilityOptions(facilities) {
    const options = facilities.map((facility) =>
        `<option value="${facility.id}">${facility.name} (ID: ${facility.id})</option>`
    ).join("");

    availabilityFacility.innerHTML = options;
    bookingFacility.innerHTML = options;
}

function populateUserOptions(users) {
    bookingUser.innerHTML = users.map((user) =>
        `<option value="${user.id}">${user.name} (${user.role})</option>`
    ).join("");
}

function renderAdminFacilities(facilities) {
    facilityAdminBody.innerHTML = facilities.map((facility) => `
        <tr>
            <td>${facility.id}</td>
            <td>${facility.name}</td>
            <td>${facility.location}</td>
            <td>${facility.capacity}</td>
            <td>
                <div class="actions">
                    <button type="button" onclick="editFacility(${facility.id})">Edit</button>
                    <button type="button" class="btn-danger" onclick="deleteFacility(${facility.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderAdminUsers(users) {
    userAdminBody.innerHTML = users.map((user) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <div class="actions">
                    <button type="button" onclick="editUser(${user.id})">Edit</button>
                    <button type="button" class="btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderBookings(bookings) {
    cachedBookings = bookings;

    bookingsBody.innerHTML = bookings.map((booking) => `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.facility?.name ?? "-"}</td>
            <td>${booking.user?.name ?? "-"}</td>
            <td>${booking.bookingDate}</td>
            <td>${booking.startTime} - ${booking.endTime}</td>
            <td><span class="status ${booking.status}">${booking.status}</span></td>
            <td>
                <select id="status-${booking.id}">
                    <option value="PENDING" ${booking.status === "PENDING" ? "selected" : ""}>PENDING</option>
                    <option value="CONFIRMED" ${booking.status === "CONFIRMED" ? "selected" : ""}>CONFIRMED</option>
                    <option value="CANCELLED" ${booking.status === "CANCELLED" ? "selected" : ""}>CANCELLED</option>
                </select>
                <button type="button" onclick="updateBookingStatus(${booking.id})">Save</button>
            </td>
        </tr>
    `).join("");
}

async function loadFacilities() {
    const facilities = await api("/facilities");
    cachedFacilities = facilities;
    renderFacilities(facilities);
    renderAdminFacilities(facilities);
    populateFacilityOptions(facilities);
}

async function loadUsers() {
    const users = await api("/users");
    cachedUsers = users;
    renderAdminUsers(users);
    populateUserOptions(users);
}

async function loadBookings() {
    const bookings = await api("/bookings");
    renderBookings(bookings);
}

async function checkAvailability() {
    const facilityId = availabilityFacility.value;
    const date = availabilityDate.value;

    if (!facilityId || !date) {
        availabilityResults.innerHTML = "<p>Please select facility and date.</p>";
        return;
    }

    availabilityResults.innerHTML = "<p>Checking slots...</p>";

    const startTimes = [];
    for (let hour = 8; hour < 18; hour++) {
        startTimes.push(`${String(hour).padStart(2, "0")}:00:00`);
        startTimes.push(`${String(hour).padStart(2, "0")}:30:00`);
    }

    const checks = startTimes.map(async (startTime) => {
        const endTime = addMinutesToTime(startTime.slice(0, 5), 30);
        const query = `/availability?facilityId=${facilityId}&bookingDate=${date}&startTime=${startTime}&endTime=${endTime}`;
        const result = await api(query);
        return {
            startTime,
            endTime,
            available: result.available
        };
    });

    const results = await Promise.all(checks);

    availabilityResults.innerHTML = results.map((slot) => `
        <div class="slot ${slot.available ? "available" : "unavailable"}">
            ${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}<br/>
            <strong>${slot.available ? "Available" : "Booked"}</strong>
        </div>
    `).join("");
}

bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    bookingFormMessage.textContent = "";

    const payload = {
        facilityId: Number(bookingFacility.value),
        userId: Number(bookingUser.value),
        bookingDate: bookingDate.value,
        startTime: toIsoTime(bookingStartTime.value),
        endTime: toIsoTime(bookingEndTime.value),
        status: bookingStatus.value
    };

    try {
        await api("/bookings", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        bookingFormMessage.textContent = "Booking created successfully.";
        await loadBookings();
        await checkAvailability();
    } catch (error) {
        bookingFormMessage.textContent = error.message;
    }
});

window.updateBookingStatus = async (bookingId) => {
    const booking = cachedBookings.find((entry) => entry.id === bookingId);
    if (!booking) return;

    const nextStatus = document.getElementById(`status-${bookingId}`).value;

    const payload = {
        facilityId: booking.facility.id,
        userId: booking.user.id,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: nextStatus
    };

    try {
        await api(`/bookings/${bookingId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        await loadBookings();
        if (availabilityDate.value && availabilityFacility.value) {
            await checkAvailability();
        }
    } catch (error) {
        alert(error.message);
    }
};

function clearFacilityAdminForm() {
    facilityAdminId.value = "";
    facilityAdminName.value = "";
    facilityAdminLocation.value = "";
    facilityAdminCapacity.value = "";
}

function clearUserAdminForm() {
    userAdminId.value = "";
    userAdminName.value = "";
    userAdminEmail.value = "";
    userAdminRole.value = "STUDENT";
}

window.editFacility = (id) => {
    const facility = cachedFacilities.find((entry) => entry.id === id);
    if (!facility) return;
    facilityAdminId.value = facility.id;
    facilityAdminName.value = facility.name;
    facilityAdminLocation.value = facility.location;
    facilityAdminCapacity.value = facility.capacity;
    facilityAdminMessage.textContent = `Editing facility #${facility.id}`;
};

window.deleteFacility = async (id) => {
    if (!confirm(`Delete facility #${id}?`)) return;
    try {
        await api(`/facilities/${id}`, { method: "DELETE" });
        facilityAdminMessage.textContent = "Facility deleted.";
        await Promise.all([loadFacilities(), loadBookings()]);
    } catch (error) {
        facilityAdminMessage.textContent = error.message;
    }
};

window.editUser = (id) => {
    const user = cachedUsers.find((entry) => entry.id === id);
    if (!user) return;
    userAdminId.value = user.id;
    userAdminName.value = user.name;
    userAdminEmail.value = user.email;
    userAdminRole.value = user.role;
    userAdminMessage.textContent = `Editing user #${user.id}`;
};

window.deleteUser = async (id) => {
    if (!confirm(`Delete user #${id}?`)) return;
    try {
        await api(`/users/${id}`, { method: "DELETE" });
        userAdminMessage.textContent = "User deleted.";
        await Promise.all([loadUsers(), loadBookings()]);
    } catch (error) {
        userAdminMessage.textContent = error.message;
    }
};

facilityAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    facilityAdminMessage.textContent = "";

    const payload = {
        name: facilityAdminName.value,
        location: facilityAdminLocation.value,
        capacity: Number(facilityAdminCapacity.value)
    };

    const id = facilityAdminId.value;
    const path = id ? `/facilities/${id}` : "/facilities";
    const method = id ? "PUT" : "POST";

    try {
        await api(path, { method, body: JSON.stringify(payload) });
        facilityAdminMessage.textContent = id ? "Facility updated." : "Facility created.";
        clearFacilityAdminForm();
        await loadFacilities();
    } catch (error) {
        facilityAdminMessage.textContent = error.message;
    }
});

userAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    userAdminMessage.textContent = "";

    const payload = {
        name: userAdminName.value,
        email: userAdminEmail.value,
        role: userAdminRole.value
    };

    const id = userAdminId.value;
    const path = id ? `/users/${id}` : "/users";
    const method = id ? "PUT" : "POST";

    try {
        await api(path, { method, body: JSON.stringify(payload) });
        userAdminMessage.textContent = id ? "User updated." : "User created.";
        clearUserAdminForm();
        await loadUsers();
    } catch (error) {
        userAdminMessage.textContent = error.message;
    }
});

facilityAdminClear.addEventListener("click", clearFacilityAdminForm);
userAdminClear.addEventListener("click", clearUserAdminForm);

refreshBookingsBtn.addEventListener("click", loadBookings);
checkAvailabilityBtn.addEventListener("click", checkAvailability);

async function init() {
    const today = new Date().toISOString().slice(0, 10);
    availabilityDate.value = today;
    bookingDate.value = today;

    try {
        await Promise.all([loadFacilities(), loadUsers(), loadBookings()]);
        await checkAvailability();
        clearFacilityAdminForm();
        clearUserAdminForm();
    } catch (error) {
        bookingFormMessage.textContent = error.message;
    }

    setInterval(loadBookings, 15000);
}

init();
