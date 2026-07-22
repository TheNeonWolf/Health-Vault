const ACCESSIBILITY_STORAGE_KEY = "healthVaultAccessibility";

const defaultAccessibilitySettings = {
    highContrast: false,
    fontScale: 1,
};

const getAccessibilitySettings = () => {
    try {
        const savedSettings = JSON.parse(
            localStorage.getItem(
                ACCESSIBILITY_STORAGE_KEY
            )
        );

        return {
            ...defaultAccessibilitySettings,
            ...savedSettings,
        };
    } catch (error) {
        return {
            ...defaultAccessibilitySettings,
        };
    }
};

const saveAccessibilitySettings = (settings) => {
    localStorage.setItem(
        ACCESSIBILITY_STORAGE_KEY,
        JSON.stringify(settings)
    );
};

const applyAccessibilitySettings = () => {
    const settings = getAccessibilitySettings();

    document.body.classList.toggle(
        "high-contrast",
        settings.highContrast
    );

    document.documentElement.style.fontSize =
        `${14 * settings.fontScale}px`;

    const fontSizeOutput = document.getElementById("fontSizeOutput");

    if (fontSizeOutput) {
        fontSizeOutput.textContent =
            `${Math.round(
                settings.fontScale * 100
            )}%`;
    }

    const contrastButton =
        document.getElementById(
            "contrastToggleBtn"
        );

    if (contrastButton) {
        contrastButton.textContent =
            settings.highContrast
                ? "Disable"
                : "Enable";

        contrastButton.setAttribute(
            "aria-pressed",
            String(settings.highContrast)
        );
    }
};

const toggleHighContrast = () => {
    const settings = getAccessibilitySettings();

    settings.highContrast = !settings.highContrast;

    saveAccessibilitySettings(settings);
    applyAccessibilitySettings();
};

const increaseTextSize = () => {
    const settings = getAccessibilitySettings();

    settings.fontScale = Math.min(
        1.4,
        Number(
            (
                settings.fontScale + 0.1
            ).toFixed(1)
        )
    );

    saveAccessibilitySettings(settings);
    applyAccessibilitySettings();
};

const decreaseTextSize = () => {
    const settings = getAccessibilitySettings();

    settings.fontScale = Math.max(
        0.8,
        Number(
            (
                settings.fontScale - 0.1
            ).toFixed(1)
        )
    );

    saveAccessibilitySettings(settings);
    applyAccessibilitySettings();
};

const resetAccessibility = () => {
    saveAccessibilitySettings({
        ...defaultAccessibilitySettings,
    });

    applyAccessibilitySettings();
};

const toggleAccessibilityMenu = () => {
    const menu = document.getElementById("accessibilityMenu");
    const trigger = document.getElementById("accessibilityTrigger");

    if (!menu || !trigger) return;

    const isOpen = menu.classList.toggle("active");

    trigger.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
};

document.addEventListener(
    "DOMContentLoaded",
    () => {
        applyAccessibilitySettings();

        document
            .getElementById(
                "accessibilityTrigger"
            )
            ?.addEventListener(
                "click",
                toggleAccessibilityMenu
            );

        document
            .getElementById(
                "contrastToggleBtn"
            )
            ?.addEventListener(
                "click",
                toggleHighContrast
            );

        document
            .getElementById(
                "increaseTextBtn"
            )
            ?.addEventListener(
                "click",
                increaseTextSize
            );

        document
            .getElementById(
                "decreaseTextBtn"
            )
            ?.addEventListener(
                "click",
                decreaseTextSize
            );

        document
            .getElementById(
                "resetAccessibilityBtn"
            )
            ?.addEventListener(
                "click",
                resetAccessibility
            );

        const accessibilityWidget =
            document.querySelector(
            ".accessibility-widget"
        );

        const accessibilityMenu =
            document.getElementById(
                "accessibilityMenu"
            );

        const accessibilityTrigger =
            document.getElementById(
                "accessibilityTrigger"
            );

        const openAccessibilityButton =
            document.getElementById(
                "openAccessibilityBtn"
            );

        document.addEventListener(
            "click",
            (event) => {
                if (
                    !accessibilityMenu ||
                    !accessibilityTrigger
                ) {
                    return;
                }

                const clickedInsideWidget =
                    accessibilityWidget?.contains(
                        event.target
                    );

                const clickedSectionButton =
                    openAccessibilityButton?.contains(
                        event.target
                    );

                if (
                    accessibilityMenu.classList.contains(
                        "active"
                    ) &&
                    !clickedInsideWidget &&
                    !clickedSectionButton
                ) {
                    accessibilityMenu.classList.remove(
                        "active"
                    );

                    accessibilityTrigger.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            }
        );
    }
);