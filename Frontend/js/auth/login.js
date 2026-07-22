document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await redirectIfAuthenticated();

        const loginForm = document.getElementById("loginForm");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const showPasswordCheckbox = document.getElementById("showPassword");
        const loginButton = document.getElementById("loginBtn");
        const loginMessage = document.getElementById("loginMessage");

        showPasswordCheckbox?.addEventListener(
            "change",
            () => {
                passwordInput.type =
                    showPasswordCheckbox.checked
                        ? "text"
                        : "password";
            }
        );

        loginForm?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                clearMessage(loginMessage);

                const email =
                    emailInput.value
                        .trim()
                        .toLowerCase();

                const password =
                    passwordInput.value;

                if (!email || !password) {
                    showMessage(
                        loginMessage,
                        "Please enter your email and password."
                    );

                    return;
                }

                if (!emailInput.validity.valid) {
                    showMessage(
                        loginMessage,
                        "Please enter a valid email address."
                    );

                    emailInput.focus();
                    return;
                }

                try {
                    setButtonLoading(
                        loginButton,
                        true,
                        "Signing in..."
                    );

                    await apiRequest(
                        "/auth/login",
                        {
                            method: "POST",

                            body: {
                                email,
                                password,
                            },
                        }
                    );

                    showMessage(
                        loginMessage,
                        "Login successful. Redirecting...",
                        "success"
                    );

                    window.setTimeout(() => {
                        window.location.href =
                            "dashboard.html";
                    }, 500);
                } catch (error) {
                    console.error(
                        "Login error:",
                        error
                    );

                    if (error.status === 401) {
                        showMessage(
                            loginMessage,
                            "Incorrect email or password."
                        );

                        return;
                    }

                    if (error.status === 403) {
                        showMessage(
                            loginMessage,
                            error.message ||
                                "Please verify your email before signing in."
                        );

                        return;
                    }

                    showMessage(
                        loginMessage,
                        error.message ||
                            "Login failed. Please try again."
                    );
                } finally {
                    setButtonLoading(
                        loginButton,
                        false
                    );
                }
            }
        );
    }
);