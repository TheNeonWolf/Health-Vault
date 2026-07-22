document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await redirectIfAuthenticated();

        const registerForm = document.getElementById("registerForm");
        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const showPasswordsCheckbox = document.getElementById("showPasswords");
        const registerButton = document.getElementById("registerBtn");
        const registerMessage = document.getElementById("registerMessage");

        showPasswordsCheckbox?.addEventListener(
            "change",
            () => {
                const inputType =
                    showPasswordsCheckbox.checked
                        ? "text"
                        : "password";

                passwordInput.type = inputType;
                confirmPasswordInput.type =
                    inputType;
            }
        );

        registerForm?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                clearMessage(registerMessage);

                const name =nameInput.value.trim();
                const email = emailInput.value.trim().toLowerCase();
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                if (
                    !name ||
                    !email ||
                    !password ||
                    !confirmPassword
                ) {
                    showMessage(
                        registerMessage,
                        "Please complete all fields."
                    );

                    return;
                }

                if (name.length < 2) {
                    showMessage(
                        registerMessage,
                        "Your name must contain at least 2 characters."
                    );

                    nameInput.focus();
                    return;
                }

                if (!emailInput.validity.valid) {
                    showMessage(
                        registerMessage,
                        "Please enter a valid email address."
                    );

                    emailInput.focus();
                    return;
                }

                if (password.length < 8) {
                    showMessage(
                        registerMessage,
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
                        registerMessage,
                        "The passwords do not match."
                    );

                    confirmPasswordInput.focus();
                    return;
                }

                try {
                    setButtonLoading(
                        registerButton,
                        true,
                        "Creating account..."
                    );

                    await apiRequest(
                        "/auth/register",
                        {
                            method: "POST",

                            body: {
                                name,
                                email,
                                password,
                            },
                        }
                    );

                    showMessage(
                        registerMessage,
                        "Account created successfully. Please check your email to verify your account.",
                        "success"
                    );

                    registerForm.reset();

                    window.setTimeout(() => {
                        window.location.href =
                            "login.html";
                    }, 2500);
                } catch (error) {
                    console.error(
                        "Registration error:",
                        error
                    );

                    if (error.status === 409) {
                        showMessage(
                            registerMessage,
                            error.message ||
                                "An account with that email already exists."
                        );

                        return;
                    }

                    showMessage(
                        registerMessage,
                        error.message ||
                            "Registration failed. Please try again."
                    );
                } finally {
                    setButtonLoading(
                        registerButton,
                        false
                    );
                }
            }
        );
    }
);