const {
    api: apiRequest,
    toIsoTime,
    addMinutesToTime,
    setButtonLoading,
    setBlockLoading,
    initAuth,
    showToast,
    initBottomNav
} = window.FacilityBookingApi;

/* ── Auth guard ── */
const session = initAuth();
if (!session) throw new Error("Not authenticated");
initBottomNav();

/* ── Hide user picker for non-admins (they book as themselves) ── */
if (session.role !== "ADMIN") {
    const userLabel = document.getElementById("booking-user-label");
    if (userLabel) userLabel.style.display = "none";
}

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
const bookingFormMessage = document.getElementById("booking-form-message");

const bookingsBody = document.getElementById("bookings-body");
const refreshBookingsBtn = document.getElementById("refresh-bookings-btn");

let cachedBookings = [];

/* ── Populate time dropdowns with 30-min slots ── */
function buildTimeOptions(selectEl, startHour = 8, endHour = 22) {
    selectEl.innerHTML = "";
    for (let h = startHour; h < endHour; h++) {
        for (const m of [0, 30]) {
            const hh = String(h).padStart(2, "0");
            const mm = String(m).padStart(2, "0");
            const label12 = formatTime12(h, m);
            const opt = document.createElement("option");
            opt.value = `${hh}:${mm}:00`;
            opt.textContent = label12;
            selectEl.appendChild(opt);
        }
    }
}

function formatTime12(h, m) {
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function initTimeDropdowns() {
    buildTimeOptions(bookingStartTime, 8, 22);
    buildTimeOptions(bookingEndTime, 8, 22);

    // Default: start 09:00, end 09:30
    bookingStartTime.value = "09:00:00";
    bookingEndTime.value = "09:30:00";

    // Disable past times when date is today
    function disablePastTimes() {
        const today = new Date().toISOString().slice(0, 10);
        const isToday = bookingDate.value === today;
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        [...bookingStartTime.options].forEach((opt) => {
            const [h, m] = opt.value.split(":").map(Number);
            opt.disabled = isToday && h * 60 + m < nowMinutes;
        });

        [...bookingEndTime.options].forEach((opt) => {
            const [h, m] = opt.value.split(":").map(Number);
            opt.disabled = isToday && h * 60 + m <= nowMinutes;
        });

        // If current selection is now disabled, jump to first available
        if (bookingStartTime.selectedOptions[0]?.disabled) {
            const first = [...bookingStartTime.options].find((o) => !o.disabled);
            if (first) bookingStartTime.value = first.value;
        }
        if (bookingEndTime.selectedOptions[0]?.disabled) {
            const first = [...bookingEndTime.options].find((o) => !o.disabled);
            if (first) bookingEndTime.value = first.value;
        }
    }

    bookingDate.addEventListener("change", disablePastTimes);
    disablePastTimes();

    // Auto-advance end time when start changes
    bookingStartTime.addEventListener("change", () => {
        const start = bookingStartTime.value;
        const [hh, mm] = start.split(":").map(Number);
        const totalMin = hh * 60 + mm + 30;
        const nextH = String(Math.floor(totalMin / 60)).padStart(2, "0");
        const nextM = String(totalMin % 60).padStart(2, "0");
        const nextVal = `${nextH}:${nextM}:00`;

        // Set end to start + 30 min if valid, otherwise leave
        const endOpt = [...bookingEndTime.options].find(o => o.value === nextVal && !o.disabled);
        if (endOpt) bookingEndTime.value = nextVal;
    });
}

function renderFacilities(facilities) {
    facilitiesList.innerHTML = facilities.map((facility) => `
        <article class="card facility-card">
            <div class="facility-card-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            </div>
            <div class="facility-card-body">
                <h3>${facility.name}</h3>
                <div class="facility-card-meta">
                    <span class="facility-meta-item">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        ${facility.location}
                    </span>
                </div>
            </div>
            <div class="facility-card-badge">
                <span class="capacity-badge">${facility.capacity}</span>
                <span class="capacity-label">seats</span>
            </div>
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
                ${booking.status !== "CANCELLED" ? `<button type="button" class="btn-danger" onclick="cancelUserBooking(${booking.id})">Cancel</button>` : "—"}
            </td>
        </tr>
    `).join("");
}

async function loadFacilities() {
    setBlockLoading(facilitiesList, true, "Loading facilities...");
    const facilities = await apiRequest("/facilities");
    renderFacilities(facilities);
    populateFacilityOptions(facilities);
}

async function loadUsers() {
    const users = await apiRequest("/users");
    populateUserOptions(users);
}

async function loadBookings() {
    setBlockLoading(bookingsBody, true, "Loading bookings...");
    const bookings = await apiRequest(`/bookings/user/${session.id}`);
    renderBookings(bookings);
}

async function checkAvailability() {
    const facilityId = availabilityFacility.value;
    const date = availabilityDate.value;

    if (!facilityId || !date) {
        availabilityResults.innerHTML = "<p>Please select facility and date.</p>";
        return;
    }

    setButtonLoading(checkAvailabilityBtn, true, "Checking...");
    setBlockLoading(availabilityResults, true, "Checking 30-minute slots...");

    try {
        const startTimes = [];
        for (let hour = 8; hour < 18; hour++) {
            startTimes.push(`${String(hour).padStart(2, "0")}:00:00`);
            startTimes.push(`${String(hour).padStart(2, "0")}:30:00`);
        }

        const checks = startTimes.map(async (startTime) => {
            const endTime = addMinutesToTime(startTime.slice(0, 5), 30);
            const query = `/availability?facilityId=${facilityId}&bookingDate=${date}&startTime=${startTime}&endTime=${endTime}`;
            const result = await apiRequest(query);
            return {
                startTime,
                endTime,
                available: result.available
            };
        });

        const results = await Promise.all(checks);

        const today = new Date().toISOString().slice(0, 10);
        const isToday = date === today;
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        availabilityResults.innerHTML = results.map((slot) => {
            const [sh, sm] = slot.endTime.split(":").map(Number);
            const slotEndMin = sh * 60 + sm;
            const isPast = isToday && slotEndMin <= nowMinutes;
            const cls = isPast ? "past" : slot.available ? "available" : "unavailable";
            const label = isPast ? "Past" : slot.available ? "Available" : "Booked";
            return `<div class="slot ${cls}">
                ${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}<br/>
                <strong>${label}</strong>
            </div>`;
        }).join("");
    } finally {
        setButtonLoading(checkAvailabilityBtn, false);
    }
}

bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    bookingFormMessage.textContent = "";

    const startVal = bookingStartTime.value;
    const endVal = bookingEndTime.value;

    if (startVal >= endVal) {
        bookingFormMessage.textContent = "End time must be after start time.";
        return;
    }

    const payload = {
        facilityId: Number(bookingFacility.value),
        userId: session.role === "ADMIN" ? Number(bookingUser.value) : session.id,
        bookingDate: bookingDate.value,
        startTime: startVal,
        endTime: endVal
    };

    const submitButton = bookingForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true, "Creating...");

    try {
        await apiRequest("/bookings", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        bookingFormMessage.textContent = "Booking created successfully.";
        await loadBookings();
        await checkAvailability();
    } catch (error) {
        bookingFormMessage.textContent = error.message;
    } finally {
        setButtonLoading(submitButton, false);
    }
});

window.cancelUserBooking = async (bookingId) => {
    const confirmed = await showCancelModal(bookingId);
    if (!confirmed) return;
    try {
        await apiRequest(`/bookings/${bookingId}`, { method: "DELETE" });
        await loadBookings();
        await checkAvailability();
    } catch (error) {
        alert(error.message);
    }
};

function showCancelModal(bookingId) {
    return new Promise((resolve) => {
        const overlay = document.getElementById("cancel-modal");
        const idLabel = document.getElementById("cancel-modal-id");
        const yesBtn = document.getElementById("cancel-modal-yes");
        const noBtn = document.getElementById("cancel-modal-no");

        idLabel.textContent = `#${bookingId}`;
        overlay.hidden = false;

        function cleanup(result) {
            overlay.hidden = true;
            yesBtn.removeEventListener("click", onYes);
            noBtn.removeEventListener("click", onNo);
            overlay.removeEventListener("click", onBackdrop);
            document.removeEventListener("keydown", onEsc);
            resolve(result);
        }

        function onYes() { cleanup(true); }
        function onNo()  { cleanup(false); }
        function onBackdrop(e) { if (e.target === overlay) cleanup(false); }
        function onEsc(e) { if (e.key === "Escape") cleanup(false); }

        yesBtn.addEventListener("click", onYes);
        noBtn.addEventListener("click", onNo);
        overlay.addEventListener("click", onBackdrop);
        document.addEventListener("keydown", onEsc);
    });
}

refreshBookingsBtn.addEventListener("click", loadBookings);
checkAvailabilityBtn.addEventListener("click", checkAvailability);

async function init() {
    const today = new Date().toISOString().slice(0, 10);
    availabilityDate.value = today;
    bookingDate.value = today;
    initTimeDropdowns();

    try {
        await Promise.all([loadFacilities(), loadUsers(), loadBookings()]);
        await checkAvailability();
    } catch (error) {
        bookingFormMessage.textContent = error.message;
    }

    setInterval(loadBookings, 15000);
}

init();
