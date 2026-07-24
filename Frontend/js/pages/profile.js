let currentProfileUser = null;

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        setupProfileEvents();

        const user =
            await requireAuth();

        if (!user) {
            return;
        }

        currentProfileUser = user;
        renderProfile(user);
    }
);

const setupProfileEvents = () => {
    [
        "logoutBtn",
        "profileLogoutBtn",
    ].forEach((id) => {
        document
            .getElementById(id)
            ?.addEventListener(
                "click",
                logout
            );
    });

    document
        .getElementById(
            "openEditNameBtn"
        )
        ?.addEventListener(
            "click",
            openEditNameModal
        );

    document
        .getElementById(
            "closeEditNameModalBtn"
        )
        ?.addEventListener(
            "click",
            closeEditNameModal
        );

    document
        .getElementById(
            "cancelEditNameBtn"
        )
        ?.addEventListener(
            "click",
            closeEditNameModal
        );

    document
        .getElementById(
            "editNameForm"
        )
        ?.addEventListener(
            "submit",
            updateProfileName
        );

    document
        .getElementById(
            "openChangePasswordBtn"
        )
        ?.addEventListener(
            "click",
            openChangePasswordModal
        );

    document
        .getElementById(
            "closeChangePasswordModalBtn"
        )
        ?.addEventListener(
            "click",
            closeChangePasswordModal
        );

    document
        .getElementById(
            "cancelChangePasswordBtn"
        )
        ?.addEventListener(
            "click",
            closeChangePasswordModal
        );

    document
        .getElementById(
            "changePasswordForm"
        )
        ?.addEventListener(
            "submit",
            changeProfilePassword
        );

    document
        .getElementById(
            "showProfilePasswords"
        )
        ?.addEventListener(
            "change",
            toggleProfilePasswords
        );

    document
        .getElementById(
            "openDeleteAccountBtn"
        )
        ?.addEventListener(
            "click",
            openDeleteAccountModal
        );

    document
        .getElementById(
            "cancelDeleteAccountBtn"
        )
        ?.addEventListener(
            "click",
            closeDeleteAccountModal
        );

    document
        .getElementById(
            "deleteAccountForm"
        )
        ?.addEventListener(
            "submit",
            deleteProfileAccount
        );

    setupProfileOutsideClose(
        "editNameModal",
        closeEditNameModal
    );

    setupProfileOutsideClose(
        "changePasswordModal",
        closeChangePasswordModal
    );

    setupProfileOutsideClose(
        "deleteAccountModal",
        closeDeleteAccountModal
    );
};

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
        user.createdAt
            ? formatDate(
                  user.createdAt
              )
            : "Not available"
    );

    updateProfileStatus(
        isVerified
    );
};

const openEditNameModal = () => {
    clearMessage(
        document.getElementById(
            "editNameMessage"
        )
    );

    const input =
        document.getElementById(
            "editProfileName"
        );

    if (input) {
        input.value =
            currentProfileUser?.name ||
            "";
    }

    openProfileModal(
        "editNameModal"
    );

    input?.focus();
};

const closeEditNameModal = () => {
    closeProfileModal(
        "editNameModal"
    );
};

const updateProfileName = async (
    event
) => {
    event.preventDefault();

    const input =
        document.getElementById(
            "editProfileName"
        );

    const messageElement =
        document.getElementById(
            "editNameMessage"
        );

    const saveButton =
        document.getElementById(
            "saveNameBtn"
        );

    clearMessage(messageElement);

    const name =
        input?.value.trim() || "";

    if (name.length < 2) {
        showMessage(
            messageElement,
            "Name must contain at least 2 characters."
        );

        return;
    }

    try {
        setButtonLoading(
            saveButton,
            true,
            "Saving..."
        );

        const response =
            await apiRequest(
                "/auth/profile/name",
                {
                    method: "PUT",
                    body: {
                        name,
                    },
                }
            );

        const user =
            response?.user ||
            response?.data ||
            {
                ...currentProfileUser,
                name,
            };

        currentProfileUser = {
            ...currentProfileUser,
            ...user,
            name,
        };

        renderProfile(
            currentProfileUser
        );

        closeEditNameModal();

        showMessage(
            document.getElementById(
                "profileMessage"
            ),
            "Name updated successfully.",
            "success"
        );
    } catch (error) {
        showMessage(
            messageElement,
            error.data?.message ||
                error.message ||
                "Unable to update your name."
        );
    } finally {
        setButtonLoading(
            saveButton,
            false
        );
    }
};

const openChangePasswordModal =
    () => {
        document
            .getElementById(
                "changePasswordForm"
            )
            ?.reset();

        clearMessage(
            document.getElementById(
                "changePasswordMessage"
            )
        );

        setPasswordInputTypes(
            "password"
        );

        openProfileModal(
            "changePasswordModal"
        );

        document
            .getElementById(
                "currentPassword"
            )
            ?.focus();
    };

const closeChangePasswordModal =
    () => {
        closeProfileModal(
            "changePasswordModal"
        );

        document
            .getElementById(
                "changePasswordForm"
            )
            ?.reset();

        setPasswordInputTypes(
            "password"
        );
    };

const toggleProfilePasswords = (
    event
) => {
    setPasswordInputTypes(
        event.target.checked
            ? "text"
            : "password"
    );
};

const setPasswordInputTypes = (
    type
) => {
    [
        "currentPassword",
        "newPassword",
        "confirmNewPassword",
    ].forEach((id) => {
        const input =
            document.getElementById(
                id
            );

        if (input) {
            input.type = type;
        }
    });
};

const changeProfilePassword =
    async (event) => {
        event.preventDefault();

        const messageElement =
            document.getElementById(
                "changePasswordMessage"
            );

        const saveButton =
            document.getElementById(
                "savePasswordBtn"
            );

        clearMessage(messageElement);

        const currentPassword =
            document.getElementById(
                "currentPassword"
            )?.value || "";

        const newPassword =
            document.getElementById(
                "newPassword"
            )?.value || "";

        const confirmPassword =
            document.getElementById(
                "confirmNewPassword"
            )?.value || "";

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            showMessage(
                messageElement,
                "Please complete all password fields."
            );

            return;
        }

        if (
            newPassword.length < 8
        ) {
            showMessage(
                messageElement,
                "The new password must contain at least 8 characters."
            );

            return;
        }

        if (
            newPassword !==
            confirmPassword
        ) {
            showMessage(
                messageElement,
                "The new passwords do not match."
            );

            return;
        }

        try {
            setButtonLoading(
                saveButton,
                true,
                "Changing..."
            );

            await apiRequest(
                "/auth/profile/password",
                {
                    method: "PUT",
                    body: {
                        currentPassword,
                        newPassword,
                    },
                }
            );

            closeChangePasswordModal();

            showMessage(
                document.getElementById(
                    "profileMessage"
                ),
                "Password changed successfully.",
                "success"
            );
        } catch (error) {
            showMessage(
                messageElement,
                error.data?.message ||
                    error.message ||
                    "Unable to change your password."
            );
        } finally {
            setButtonLoading(
                saveButton,
                false
            );
        }
    };

const openDeleteAccountModal =
    () => {
        document
            .getElementById(
                "deleteAccountForm"
            )
            ?.reset();

        clearMessage(
            document.getElementById(
                "deleteAccountMessage"
            )
        );

        openProfileModal(
            "deleteAccountModal"
        );

        document
            .getElementById(
                "deleteAccountPassword"
            )
            ?.focus();
    };

const closeDeleteAccountModal =
    () => {
        closeProfileModal(
            "deleteAccountModal"
        );
    };

const deleteProfileAccount =
    async (event) => {
        event.preventDefault();

        const password =
            document.getElementById(
                "deleteAccountPassword"
            )?.value || "";

        const messageElement =
            document.getElementById(
                "deleteAccountMessage"
            );

        const deleteButton =
            document.getElementById(
                "confirmDeleteAccountBtn"
            );

        clearMessage(messageElement);

        if (!password) {
            showMessage(
                messageElement,
                "Enter your password to confirm account deletion."
            );

            return;
        }

        try {
            setButtonLoading(
                deleteButton,
                true,
                "Deleting..."
            );

            await apiRequest(
                "/auth/profile",
                {
                    method: "DELETE",
                    body: {
                        password,
                    },
                }
            );

            window.location.href =
                "index.html";
        } catch (error) {
            showMessage(
                messageElement,
                error.data?.message ||
                    error.message ||
                    "Unable to delete your account."
            );
        } finally {
            setButtonLoading(
                deleteButton,
                false
            );
        }
    };

const openProfileModal = (
    modalId
) => {
    document
        .getElementById(modalId)
        ?.classList.add("active");

    document.body.style.overflow =
        "hidden";
};

const closeProfileModal = (
    modalId
) => {
    document
        .getElementById(modalId)
        ?.classList.remove("active");

    document.body.style.overflow =
        "";
};

const setupProfileOutsideClose = (
    modalId,
    closeFunction
) => {
    const modal =
        document.getElementById(
            modalId
        );

    modal?.addEventListener(
        "click",
        (event) => {
            if (
                event.target === modal
            ) {
                closeFunction();
            }
        }
    );
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