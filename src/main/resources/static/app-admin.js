const {
    api: apiRequest,
    setButtonLoading,
    setBlockLoading,
    initAuth,
    showToast,
    initBottomNav
} = window.FacilityBookingApi;

/* ── Auth guard (admin only) ── */
const session = initAuth();
if (!session || session.role !== "ADMIN") {
    window.location.replace("/api/v1/index.html");
    throw new Error("Not authorized");
}
initBottomNav();

/* ── DOM references ── */
const facilityAdminForm = document.getElementById("facility-admin-form");
const facilityAdminId = document.getElementById("facility-admin-id");
const facilityAdminName = document.getElementById("facility-admin-name");
const facilityAdminLocation = document.getElementById("facility-admin-location");
const facilityAdminCapacity = document.getElementById("facility-admin-capacity");
const facilityAdminMessage = document.getElementById("facility-admin-message");
const facilityAdminClear = document.getElementById("facility-admin-clear");
const facilityCardsContainer = document.getElementById("facility-admin-cards");
const facilityFormDrawer = document.getElementById("facility-form-drawer");
const toggleFacilityFormBtn = document.getElementById("toggle-facility-form");

const userAdminForm = document.getElementById("user-admin-form");
const userAdminId = document.getElementById("user-admin-id");
const userAdminName = document.getElementById("user-admin-name");
const userAdminEmail = document.getElementById("user-admin-email");
const userAdminRole = document.getElementById("user-admin-role");
const userAdminMessage = document.getElementById("user-admin-message");
const userAdminClear = document.getElementById("user-admin-clear");
const userCardsContainer = document.getElementById("user-admin-cards");
const userFormDrawer = document.getElementById("user-form-drawer");
const toggleUserFormBtn = document.getElementById("toggle-user-form");

const bookingsContainer = document.getElementById("admin-bookings-cards");
const refreshAdminBookingsBtn = document.getElementById("refresh-admin-bookings-btn");

let cachedFacilities = [];
let cachedUsers = [];
let cachedBookings = [];

/* ── Form drawer toggles ── */
function toggleDrawer(drawer, btn) {
    const isHidden = drawer.hidden;
    drawer.hidden = !isHidden;
    btn.classList.toggle("active", isHidden);
}

toggleFacilityFormBtn.addEventListener("click", () => {
    clearFacilityAdminForm();
    toggleDrawer(facilityFormDrawer, toggleFacilityFormBtn);
});

toggleUserFormBtn.addEventListener("click", () => {
    clearUserAdminForm();
    toggleDrawer(userFormDrawer, toggleUserFormBtn);
});

/* ── Helpers ── */
function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime12(t) {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function formatDate(d) {
    if (!d) return "";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function roleColor(role) {
    switch (role) {
        case "ADMIN": return "var(--danger)";
        case "STAFF": return "var(--warning)";
        default: return "var(--primary)";
    }
}

/* ── Stats ── */
function updateStats() {
    document.getElementById("stat-facilities").textContent = cachedFacilities.length;
    document.getElementById("stat-users").textContent = cachedUsers.length;
    document.getElementById("stat-bookings").textContent = cachedBookings.length;
    document.getElementById("stat-pending").textContent = cachedBookings.filter(b => b.status === "PENDING").length;
}

/* ── Clear forms ── */
function clearFacilityAdminForm() {
    facilityAdminId.value = "";
    facilityAdminName.value = "";
    facilityAdminLocation.value = "";
    facilityAdminCapacity.value = "";
    facilityAdminMessage.textContent = "";
    document.getElementById("facility-admin-submit").innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Save Facility`;
}

function clearUserAdminForm() {
    userAdminId.value = "";
    userAdminName.value = "";
    userAdminEmail.value = "";
    userAdminRole.value = "STUDENT";
    userAdminMessage.textContent = "";
    document.getElementById("user-admin-submit").innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Save User`;
}

/* ── Render Facilities (cards) ── */
function renderAdminFacilities(facilities) {
    if (!facilities.length) {
        facilityCardsContainer.innerHTML = `<div class="admin-empty">
            <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            <p>No facilities yet</p>
        </div>`;
        return;
    }
    facilityCardsContainer.innerHTML = facilities.map(f => `
        <div class="admin-item-card">
            <div class="admin-item-icon facilities-accent">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            </div>
            <div class="admin-item-body">
                <div class="admin-item-name">${f.name}</div>
                <div class="admin-item-meta">
                    <span class="admin-meta-tag">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        ${f.location}
                    </span>
                    <span class="admin-meta-tag">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        ${f.capacity} seats
                    </span>
                </div>
            </div>
            <div class="admin-item-actions">
                <button type="button" class="btn-admin-action btn-edit" onclick="editFacility(${f.id})" title="Edit">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button type="button" class="btn-admin-action btn-delete" onclick="deleteFacility(${f.id})" title="Delete">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        </div>
    `).join("");
}

/* ── Render Users (cards) ── */
function renderAdminUsers(users) {
    if (!users.length) {
        userCardsContainer.innerHTML = `<div class="admin-empty">
            <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <p>No users yet</p>
        </div>`;
        return;
    }
    userCardsContainer.innerHTML = users.map(u => `
        <div class="admin-item-card">
            <div class="admin-item-avatar" style="background:${roleColor(u.role)}">${getInitials(u.name)}</div>
            <div class="admin-item-body">
                <div class="admin-item-name">${u.name}</div>
                <div class="admin-item-meta">
                    <span class="admin-meta-tag">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                        ${u.email}
                    </span>
                    <span class="role-badge role-${u.role}">${u.role}</span>
                </div>
            </div>
            <div class="admin-item-actions">
                <button type="button" class="btn-admin-action btn-edit" onclick="editUser(${u.id})" title="Edit">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button type="button" class="btn-admin-action btn-delete" onclick="deleteUser(${u.id})" title="Delete">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        </div>
    `).join("");
}

/* ── Render Bookings (cards) ── */
function renderBookings(bookings) {
    cachedBookings = bookings;
    updateStats();
    if (!bookings.length) {
        bookingsContainer.innerHTML = `<div class="admin-empty">
            <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            <p>No bookings yet</p>
        </div>`;
        return;
    }
    bookingsContainer.innerHTML = bookings.map(b => `
        <div class="admin-booking-card">
            <div class="booking-card-top">
                <div class="booking-card-facility">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                    <span>${b.facility?.name ?? "Unknown"}</span>
                </div>
                <span class="status ${b.status}">${b.status}</span>
            </div>
            <div class="booking-card-details">
                <div class="booking-detail">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <span>${b.user?.name ?? "Unknown"}</span>
                </div>
                <div class="booking-detail">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
                    <span>${formatDate(b.bookingDate)}</span>
                </div>
                <div class="booking-detail">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    <span>${formatTime12(b.startTime)} – ${formatTime12(b.endTime)}</span>
                </div>
            </div>
            <div class="booking-card-actions">
                <select id="admin-status-${b.id}" class="booking-status-select">
                    <option value="PENDING" ${b.status === "PENDING" ? "selected" : ""}>Pending</option>
                    <option value="CONFIRMED" ${b.status === "CONFIRMED" ? "selected" : ""}>Confirmed</option>
                </select>
                <button type="button" class="btn-save-status" onclick="saveAdminBookingStatus(${b.id})">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Update
                </button>
            </div>
        </div>
    `).join("");
}

/* ── Data loading ── */
async function loadFacilities() {
    facilityCardsContainer.innerHTML = `<div class="admin-loading">Loading facilities...</div>`;
    const facilities = await apiRequest("/facilities");
    cachedFacilities = facilities;
    renderAdminFacilities(facilities);
    updateStats();
}

async function loadUsers() {
    userCardsContainer.innerHTML = `<div class="admin-loading">Loading users...</div>`;
    const users = await apiRequest("/users");
    cachedUsers = users;
    renderAdminUsers(users);
    updateStats();
}

async function loadBookings() {
    bookingsContainer.innerHTML = `<div class="admin-loading">Loading bookings...</div>`;
    const bookings = await apiRequest("/bookings");
    renderBookings(bookings);
}

/* ── CRUD actions ── */
window.editFacility = (id) => {
    const facility = cachedFacilities.find((entry) => entry.id === id);
    if (!facility) return;
    facilityAdminId.value = facility.id;
    facilityAdminName.value = facility.name;
    facilityAdminLocation.value = facility.location;
    facilityAdminCapacity.value = facility.capacity;
    facilityAdminMessage.textContent = `Editing facility #${facility.id}`;
    document.getElementById("facility-admin-submit").innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Update Facility`;
    facilityFormDrawer.hidden = false;
    toggleFacilityFormBtn.classList.add("active");
    facilityAdminName.focus();
};

window.deleteFacility = async (id) => {
    if (!confirm(`Delete facility #${id}?`)) return;
    try {
        await apiRequest(`/facilities/${id}`, { method: "DELETE" });
        showToast("Facility deleted", "success");
        await Promise.all([loadFacilities(), loadBookings()]);
    } catch (error) {
        showToast(error.message, "error");
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
    document.getElementById("user-admin-submit").innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Update User`;
    userFormDrawer.hidden = false;
    toggleUserFormBtn.classList.add("active");
    userAdminName.focus();
};

window.deleteUser = async (id) => {
    if (!confirm(`Delete user #${id}?`)) return;
    try {
        await apiRequest(`/users/${id}`, { method: "DELETE" });
        showToast("User deleted", "success");
        await Promise.all([loadUsers(), loadBookings()]);
    } catch (error) {
        showToast(error.message, "error");
    }
};

window.saveAdminBookingStatus = async (bookingId) => {
    const booking = cachedBookings.find((entry) => entry.id === bookingId);
    if (!booking) return;

    const nextStatus = document.getElementById(`admin-status-${bookingId}`).value;
    const payload = { status: nextStatus };

    try {
        await apiRequest(`/bookings/${bookingId}/status`, {
            method: "PUT",
            headers: { "X-USER-ROLE": "ADMIN" },
            body: JSON.stringify(payload)
        });
        showToast("Booking status updated", "success");
        await loadBookings();
    } catch (error) {
        if (String(error.message).includes("404")) {
            const legacyPayload = {
                facilityId: booking.facility.id,
                userId: booking.user.id,
                bookingDate: booking.bookingDate,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: nextStatus
            };

            try {
                await apiRequest(`/bookings/${bookingId}`, {
                    method: "PUT",
                    headers: { "X-USER-ROLE": "ADMIN" },
                    body: JSON.stringify(legacyPayload)
                });
                showToast("Booking status updated", "success");
                await loadBookings();
                return;
            } catch (legacyError) {
                showToast(legacyError.message, "error");
                return;
            }
        }

        showToast(error.message, "error");
    }
};

/* ── Form submissions ── */
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

    const submitButton = facilityAdminForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true, id ? "Updating..." : "Creating...");

    try {
        await apiRequest(path, { method, body: JSON.stringify(payload) });
        showToast(id ? "Facility updated" : "Facility created", "success");
        clearFacilityAdminForm();
        facilityFormDrawer.hidden = true;
        toggleFacilityFormBtn.classList.remove("active");
        await loadFacilities();
    } catch (error) {
        showToast(error.message, "error");
        facilityAdminMessage.textContent = error.message;
    } finally {
        setButtonLoading(submitButton, false);
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

    const submitButton = userAdminForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true, id ? "Updating..." : "Creating...");

    try {
        await apiRequest(path, { method, body: JSON.stringify(payload) });
        showToast(id ? "User updated" : "User created", "success");
        clearUserAdminForm();
        userFormDrawer.hidden = true;
        toggleUserFormBtn.classList.remove("active");
        await loadUsers();
    } catch (error) {
        showToast(error.message, "error");
        userAdminMessage.textContent = error.message;
    } finally {
        setButtonLoading(submitButton, false);
    }
});

facilityAdminClear.addEventListener("click", () => {
    clearFacilityAdminForm();
    facilityFormDrawer.hidden = true;
    toggleFacilityFormBtn.classList.remove("active");
});

userAdminClear.addEventListener("click", () => {
    clearUserAdminForm();
    userFormDrawer.hidden = true;
    toggleUserFormBtn.classList.remove("active");
});

refreshAdminBookingsBtn.addEventListener("click", loadBookings);

/* ── Init ── */
async function init() {
    clearFacilityAdminForm();
    clearUserAdminForm();
    await Promise.all([loadFacilities(), loadUsers(), loadBookings()]);
}

init().catch((error) => {
    showToast(error.message, "error");
});
