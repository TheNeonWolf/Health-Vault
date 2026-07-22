const apiRequest = async (endpoint, options = {}) => {
    const requestOptions = {
        method: options.method || "GET",
        credentials: "include",
        headers: {
            ...options.headers,
        },
    };

    if (options.body instanceof FormData) {
        requestOptions.body = options.body;
    } else if (options.body !== undefined) {
        requestOptions.headers["Content-Type"] =
            "application/json";

        requestOptions.body = JSON.stringify(
            options.body
        );
    }

    try {
        const response = await fetch(
            `${API_URL}${endpoint}`,
            requestOptions
        );

        const contentType =
            response.headers.get("content-type");

        let data = null;

        if (
            contentType &&
            contentType.includes("application/json")
        ) {
            data = await response.json();
        }

        if (!response.ok) {
            const error = new Error(
                data?.message ||
                    "Something went wrong"
            );

            error.status = response.status;
            error.data = data;

            throw error;
        }

        return data;
    } catch (error) {
        if (error.name === "TypeError") {
            throw new Error(
                "Could not connect to the server. Please try again later."
            );
        }

        throw error;
    }
};

const showMessage = (
    element,
    message,
    type = "error"
) => {
    if (!element) return;

    element.textContent = message;
    element.className = `alert alert-${type}`;
    element.hidden = false;
};

const clearMessage = (element) => {
    if (!element) return;

    element.textContent = "";
    element.className = "alert";
    element.hidden = true;
};

const getQueryParameter = (name) => {
    const params = new URLSearchParams(
        window.location.search
    );

    return params.get(name);
};

const formatDate = (dateValue) => {
    if (!dateValue) {
        return "Not provided";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleDateString("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (dateValue) => {
    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleString("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getCurrentUser = async () => {
    try {
        return await apiRequest("/auth/me");
    } catch (error) {
        return null;
    }
};

const requireAuth = async () => {
    const userData = await getCurrentUser();

    if (!userData) {
        window.location.href = "login.html";
        return null;
    }

    return userData.user || userData;
};

const redirectIfAuthenticated = async () => {
    const userData = await getCurrentUser();

    if (userData) {
        window.location.href = "dashboard.html";
    }
};

const logout = async () => {
    try {
        await apiRequest("/auth/logout", {
            method: "POST",
        });
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        window.location.href = "login.html";
    }
};

const setButtonLoading = (
    button,
    isLoading,
    loadingText = "Please wait..."
) => {
    if (!button) return;

    if (isLoading) {
        button.dataset.originalText =
            button.textContent;

        button.textContent = loadingText;
        button.disabled = true;
        return;
    }

    button.textContent =
        button.dataset.originalText ||
        button.textContent;

    button.disabled = false;
};

const getInitials = (name) => {
    if (!name) {
        return "HV";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
};

const escapeHtml = (value) => {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
};