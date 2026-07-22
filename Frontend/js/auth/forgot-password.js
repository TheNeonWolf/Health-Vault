document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await redirectIfAuthenticated();

        const form = document.getElementById("forgotPasswordForm");
        const emailInput = document.getElementById("email");
        const submitButton = document.getElementById("forgotPasswordBtn");
        const messageElement = document.getElementById("forgotPasswordMessage");

        form?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                clearMessage(messageElement);
                const email = emailInput.value.trim().toLowerCase();

                if (!email) {
                    showMessage(
                        messageElement,
                        "Please enter your email address."
                    );

                    emailInput.focus();
                    return;
                }

                if (!emailInput.validity.valid) {
                    showMessage(
                        messageElement,
                        "Please enter a valid email address."
                    );

                    emailInput.focus();
                    return;
                }

                try {
                    setButtonLoading(
                        submitButton,
                        true,
                        "Sending..."
                    );

                    await apiRequest(
                        "/auth/forgot-password",
                        {
                            method: "POST",
                            body: {
                                email,
                            },
                        }
                    );

                    showMessage(
                        messageElement,
                        "If an account exists for that email, a password-reset link has been sent.",
                        "success"
                    );

                    form.reset();
                } catch (error) {
                    console.error(
                        "Forgot password error:",
                        error
                    );

                    showMessage(
                        messageElement,
                        error.message ||
                            "Unable to send the reset email. Please try again."
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