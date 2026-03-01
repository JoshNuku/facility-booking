(() => {
    const pagePath = window.location.pathname;
    const basePath = pagePath.endsWith("/index.html") || pagePath.endsWith("/admin.html") || pagePath.endsWith("/login.html")
        ? pagePath.replace(/\/(index|admin|login)\.html$/, "")
        : pagePath.replace(/\/$/, "");

    const apiBase = `${window.location.origin}${basePath}`;

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

    function setButtonLoading(button, loading, loadingText = "Loading...") {
        if (!button) return;

        if (loading) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
            button.disabled = true;
        } else {
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
            button.disabled = false;
        }
    }

    function setBlockLoading(target, loading, message = "Loading...") {
        if (!target) return;

        if (loading) {
            target.dataset.previousHtml = target.innerHTML;
            target.innerHTML = `<div class="loading-inline">${message}</div>`;
        } else if (target.dataset.previousHtml !== undefined) {
            delete target.dataset.previousHtml;
        }
    }

    async function api(path, options = {}) {
        const mergedHeaders = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        const response = await fetch(`${apiBase}${path}`, {
            ...options,
            headers: mergedHeaders
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

    /* ── Auth helpers ── */
    function getSession() {
        try {
            return JSON.parse(localStorage.getItem("session") || "null");
        } catch {
            return null;
        }
    }

    function logout() {
        localStorage.removeItem("session");
        window.location.replace(basePath + "/login.html");
    }

    function initAuth() {
        const session = getSession();
        if (!session) {
            window.location.replace(basePath + "/login.html");
            return null;
        }

        const avatar = document.getElementById("user-avatar");
        const nameEl = document.getElementById("user-name");
        const logoutBtn = document.getElementById("logout-btn");

        if (avatar) {
            avatar.textContent = session.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (nameEl) {
            nameEl.textContent = session.name;
        }
        if (logoutBtn) {
            logoutBtn.addEventListener("click", logout);
        }

        if (session.role !== "ADMIN") {
            document.querySelectorAll(".admin-only").forEach((el) => (el.style.display = "none"));
        }

        return session;
    }

    /* ── Toast notifications ── */
    function showToast(message, type = "success", duration = 3500) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("removing");
            toast.addEventListener("animationend", () => toast.remove());
        }, duration);
    }

    /* ── Bottom nav scrolling ── */
    function initBottomNav() {
        document.querySelectorAll(".bottom-nav-item").forEach((item) => {
            item.addEventListener("click", () => {
                const sectionId = item.dataset.section;
                const section = document.getElementById(sectionId);
                if (section) {
                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                document.querySelectorAll(".bottom-nav-item").forEach((i) => i.classList.remove("active"));
                item.classList.add("active");
            });
        });
    }

    window.FacilityBookingApi = {
        API_BASE: apiBase,
        api,
        toIsoTime,
        addMinutesToTime,
        setButtonLoading,
        setBlockLoading,
        getSession,
        logout,
        initAuth,
        showToast,
        initBottomNav
    };

    /* ── Service Worker ── */
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register(basePath + "/sw.js").catch(() => {});
    }
})();
