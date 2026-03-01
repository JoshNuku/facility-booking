const { api: apiRequest, setButtonLoading } = window.FacilityBookingApi;

/* ── Redirect away if already signed in ── */
const session = JSON.parse(localStorage.getItem("session") || "null");
if (session) {
    window.location.replace(
        session.role === "ADMIN" ? "/api/v1/admin.html" : "/api/v1/index.html"
    );
}

/* ── Tab switching ── */
const tabs = document.querySelectorAll(".auth-tab");
const signinForm = document.getElementById("signin-form");
const signupForm = document.getElementById("signup-form");

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        if (tab.dataset.tab === "signin") {
            signinForm.hidden = false;
            signupForm.hidden = true;
        } else {
            signinForm.hidden = true;
            signupForm.hidden = false;
        }
    });
});

/* ── Sign In ── */
signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("signin-message");
    message.textContent = "";
    message.className = "auth-message";

    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;

    const btn = signinForm.querySelector("button[type='submit']");
    setButtonLoading(btn, true, "Signing in…");

    try {
        const user = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem("session", JSON.stringify(user));
        window.location.href = user.role === "ADMIN"
            ? "/api/v1/admin.html"
            : "/api/v1/index.html";
    } catch (error) {
        message.textContent = error.message;
        message.className = "auth-message error";
    } finally {
        setButtonLoading(btn, false);
    }
});

/* ── Sign Up ── */
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("signup-message");
    message.textContent = "";
    message.className = "auth-message";

    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const role = document.getElementById("signup-role").value;

    const btn = signupForm.querySelector("button[type='submit']");
    setButtonLoading(btn, true, "Creating account…");

    try {
        const user = await apiRequest("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ name, email, password, role })
        });

        localStorage.setItem("session", JSON.stringify(user));
        window.location.href = "/api/v1/index.html";
    } catch (error) {
        message.textContent = error.message;
        message.className = "auth-message error";
    } finally {
        setButtonLoading(btn, false);
    }
});
