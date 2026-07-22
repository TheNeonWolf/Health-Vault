document.addEventListener(
    "DOMContentLoaded",
    () => {
        const form = document.getElementById("resetPasswordForm");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const showPasswordsCheckbox = document.getElementById("showPasswords");
        const submitButton = document.getElementById("resetPasswordBtn");
        const messageElement = document.getElementById("resetPasswordMessage");
        const token = getQueryParameter("token");

        if (!token) {
            showMessage(
                messageElement,
                "This password-reset link is missing its security token."
            );

            submitButton.disabled = true;
            return;
        }

        showPasswordsCheckbox?.addEventListener(
            "change",
            () => {
                const type =
                    showPasswordsCheckbox.checked
                        ? "text"
                        : "password";

                passwordInput.type = type;
                confirmPasswordInput.type = type;
            }
        );

        form?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                clearMessage(messageElement);

                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                if (
                    !password ||
                    !confirmPassword
                ) {
                    showMessage(
                        messageElement,
                        "Please complete both password fields."
                    );

                    return;
                }

                if (password.length < 8) {
                    showMessage(
                        messageElement,
                        "Your password must contain at least 8 characters."
                    );

                    passwordInput.focus();
                    return;
                }

                if (
                    password !==
                    confirmPassword
                ) {
                    showMessage(
                        messageElement,
                        "The passwords do not match."
                    );

                    confirmPasswordInput.focus();
                    return;
                }

                try {
                    setButtonLoading(
                        submitButton,
                        true,
                        "Resetting..."
                    );

                    await apiRequest(
                        `/auth/reset-password/${encodeURIComponent(
                            token
                        )}`,
                        {
                            method: "POST",
                            body: {
                                password,
                            },
                        }
                    );

                    showMessage(
                        messageElement,
                        "Your password has been reset successfully. Redirecting to login...",
                        "success"
                    );

                    form.reset();

                    window.setTimeout(() => {
                        window.location.href =
                            "login.html";
                    }, 1800);
                } catch (error) {
                    console.error(
                        "Reset password error:",
                        error
                    );

                    if (
                        error.status === 400 ||
                        error.status === 404
                    ) {
                        showMessage(
                            messageElement,
                            error.message ||
                                "This reset link is invalid or has expired."
                        );

                        return;
                    }

                    showMessage(
                        messageElement,
                        error.message ||
                            "Unable to reset your password. Please try again."
                    );
                } finally {
                    setButtonLoading(
                        submitButton,
                        false
                    );
                }
            }
        );
    }
);