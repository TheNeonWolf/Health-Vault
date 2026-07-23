document.addEventListener("DOMContentLoaded", async () => {
    const logoutButtons = [
        "logoutBtn",
        "profileLogoutBtn",
    ];

    logoutButtons.forEach((id) => {
        document
            .getElementById(id)
            ?.addEventListener(
                "click",
                logout
            );
    });

    const user = await requireAuth();

    if (!user) {
        return;
    }

    renderProfile(user);
});

const renderProfile = (user) => {
    const name =
        user.name ||
        user.username ||
        "Staff member";

    const email =
        user.email ||
        "Email not available";

    const isVerified =
        Boolean(
            user.isVerified ??
            user.isEmailVerified
        );

    const createdAt =
        user.createdAt ||
        user.created_at ||
        null;

    setProfileText(
        "sidebarUserName",
        name
    );

    setProfileText(
        "sidebarUserInitials",
        getInitials(name)
    );

    setProfileText(
        "profileInitials",
        getInitials(name)
    );

    setProfileText(
        "profileName",
        name
    );

    setProfileText(
        "profileEmail",
        email
    );

    setProfileText(
        "profileFullName",
        name
    );

    setProfileText(
        "profileEmailDetail",
        email
    );

    setProfileText(
        "profileVerificationStatus",
        isVerified
            ? "Verified"
            : "Not verified"
    );

    setProfileText(
        "profileMemberSince",
        createdAt
            ? formatDate(createdAt)
            : "Not available"
    );

    updateProfileStatus(isVerified);
};

const updateProfileStatus = (
    isVerified
) => {
    const pill =
        document.getElementById(
            "profileStatusPill"
        );

    const description =
        document.getElementById(
            "profileStatusDescription"
        );

    if (!pill || !description) {
        return;
    }

    if (isVerified) {
        pill.textContent =
            "Verified account";

        pill.classList.add(
            "verified"
        );

        description.textContent =
            "Your email has been verified and your account is active.";

        return;
    }

    pill.textContent =
        "Verification required";

    pill.classList.remove(
        "verified"
    );

    description.textContent =
        "Please verify your email to access all HealthVault features.";
};

const setProfileText = (
    elementId,
    value
) => {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.textContent =
            String(value ?? "");
    }
};