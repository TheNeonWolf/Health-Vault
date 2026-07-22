document.addEventListener("DOMContentLoaded", async () => {
    const dashboardMessage = document.getElementById("dashboardMessage");
    const logoutButton =document.getElementById("logoutBtn");

    logoutButton?.addEventListener("click", logout);

    const user = await requireAuth();

    if (!user) {
        return;
    }

    displayUserInformation(user);
    await loadDashboard();
});

const displayUserInformation = (user) => {
    const name =
        user.name ||
        user.username ||
        "Staff member";

    const welcomeHeading = document.getElementById("welcomeHeading");
    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarUserInitials = document.getElementById("sidebarUserInitials");

    if (welcomeHeading) {
        welcomeHeading.textContent =
            `Welcome back, ${name}`;
    }

    if (sidebarUserName) {
        sidebarUserName.textContent = name;
    }

    if (sidebarUserInitials) {
        sidebarUserInitials.textContent =
            getInitials(name);
    }
};

const loadDashboard = async () => {
    const dashboardMessage = document.getElementById("dashboardMessage");

    try {
        clearMessage(dashboardMessage);

        const response = await apiRequest("/dashboard");

        const dashboard =
            response?.data ||
            response?.dashboard ||
            response;

        updateDashboardStatistics(dashboard);
        renderRecentResidents(dashboard);
    } catch (error) {
        console.error(
            "Dashboard loading error:",
            error
        );

        if (error.status === 401) {
            window.location.href = "login.html";
            return;
        }

        showMessage(
            dashboardMessage,
            error.message ||
                "Unable to load the dashboard."
        );

        updateDashboardStatistics({});
        renderRecentResidents({});
    }
};

const updateDashboardStatistics = (dashboard) => {
    const statistics =
        dashboard?.statistics ||
        dashboard?.stats ||
        dashboard ||
        {};

    const totalResidents =
        statistics.totalResidents ??
        statistics.residentCount ??
        statistics.residents ??
        0;

    const totalRecords =
        statistics.totalRecords ??
        statistics.recordCount ??
        statistics.medicalRecords ??
        0;

    const activeMedications =
        statistics.activeMedications ??
        statistics.medicationCount ??
        statistics.medications ??
        0;

    const totalSummaries =
        statistics.totalSummaries ??
        statistics.summaryCount ??
        statistics.aiSummaries ??
        0;

    setTextContent(
        "totalResidents",
        totalResidents
    );

    setTextContent(
        "totalRecords",
        totalRecords
    );

    setTextContent(
        "activeMedications",
        activeMedications
    );

    setTextContent(
        "totalSummaries",
        totalSummaries
    );
};

const renderRecentResidents = (dashboard) => {
    const listElement = document.getElementById("recentResidentsList");

    if (!listElement) {
        return;
    }

    const residents =
        dashboard?.recentResidents ||
        dashboard?.residents ||
        dashboard?.recentActivity?.residents ||
        [];

    if (!Array.isArray(residents) || residents.length === 0) {
        listElement.innerHTML = `
            <p class="dashboard-empty-state">
                No residents have been added yet.
            </p>
        `;

        return;
    }

    listElement.innerHTML = residents
        .slice(0, 5)
        .map((resident) => {
            const id =
                resident._id ||
                resident.id ||
                "";

            const name =
                resident.name ||
                "Unnamed resident";

            const room =
                resident.roomNumber
                    ? `Room ${resident.roomNumber}`
                    : "Room not assigned";

            const age =
                resident.age !== undefined &&
                resident.age !== null
                    ? `${resident.age} years old`
                    : "Age not provided";

            const detailsUrl = id
                ? `resident-details.html?id=${encodeURIComponent(
                      id
                  )}`
                : "residents.html";

            return `
                <a
                    href="${detailsUrl}"
                    class="recent-resident-card"
                >
                    <div class="recent-resident-main">
                        <div
                            class="recent-resident-avatar"
                            aria-hidden="true"
                        >
                            ${escapeHtml(getInitials(name))}
                        </div>

                        <div class="recent-resident-info">
                            <h3>
                                ${escapeHtml(name)}
                            </h3>

                            <p>
                                ${escapeHtml(room)}
                                ·
                                ${escapeHtml(age)}
                            </p>
                        </div>
                    </div>

                    <span
                        class="recent-resident-arrow"
                        aria-hidden="true"
                    >
                        ›
                    </span>
                </a>
            `;
        })
        .join("");
};

const setTextContent = (elementId, value) => {
    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    const numericValue = Number(value);

    element.textContent =
        Number.isFinite(numericValue)
            ? numericValue.toLocaleString("en-SG")
            : "0";
};