let residents = [];
let selectedResidentId = null;

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const logoutButton = document.getElementById("logoutBtn");

        logoutButton?.addEventListener(
            "click",
            logout
        );

        const user = await requireAuth();

        if (!user) {
            return;
        }

        displaySidebarUser(user);
        setupResidentEvents();

        await loadResidents();

        const params = new URLSearchParams(
            window.location.search
        );

        if (params.get("action") === "add") {
            openAddResidentModal();
        }
    }
);

const displaySidebarUser = (user) => {
    const name =
        user.name ||
        user.username ||
        "Staff member";

    const nameElement = document.getElementById("sidebarUserName");
    const initialsElement = document.getElementById("sidebarUserInitials");

    if (nameElement) {
        nameElement.textContent = name;
    }

    if (initialsElement) {
        initialsElement.textContent =
            getInitials(name);
    }
};

const setupResidentEvents = () => {
    document
        .getElementById(
            "openAddResidentBtn"
        )
        ?.addEventListener(
            "click",
            openAddResidentModal
        );

    document
        .getElementById(
            "closeResidentModalBtn"
        )
        ?.addEventListener(
            "click",
            closeResidentModal
        );

    document
        .getElementById(
            "cancelResidentBtn"
        )
        ?.addEventListener(
            "click",
            closeResidentModal
        );

    document
        .getElementById(
            "residentForm"
        )
        ?.addEventListener(
            "submit",
            handleResidentSubmit
        );

    document
        .getElementById(
            "residentSearchInput"
        )
        ?.addEventListener(
            "input",
            applyResidentFilters
        );

    document
        .getElementById(
            "residentSortSelect"
        )
        ?.addEventListener(
            "change",
            applyResidentFilters
        );

    document
        .getElementById(
            "cancelDeleteResidentBtn"
        )
        ?.addEventListener(
            "click",
            closeDeleteResidentModal
        );

    document
        .getElementById(
            "confirmDeleteResidentBtn"
        )
        ?.addEventListener(
            "click",
            confirmResidentDelete
        );

    setupModalOutsideClick(
        "residentFormModal",
        closeResidentModal
    );

    setupModalOutsideClick(
        "deleteResidentModal",
        closeDeleteResidentModal
    );
};

const setupModalOutsideClick = (
    modalId,
    closeFunction
) => {
    const modal = document.getElementById(modalId);

    modal?.addEventListener(
        "click",
        (event) => {
            if (event.target === modal) {
                closeFunction();
            }
        }
    );
};

const loadResidents = async () => {
    const messageElement =
        document.getElementById(
            "residentsMessage"
        );

    try {
        clearMessage(messageElement);

        const response =
            await apiRequest("/residents");

        residents =
            response?.residents ||
            response?.data ||
            response ||
            [];

        if (!Array.isArray(residents)) {
            residents = [];
        }

        updateResidentSummary();
        applyResidentFilters();
    } catch (error) {
        console.error(
            "Residents loading error:",
            error
        );

        if (error.status === 401) {
            window.location.href =
                "login.html";
            return;
        }

        residents = [];

        showMessage(
            messageElement,
            error.message ||
                "Unable to load residents."
        );

        updateResidentSummary();
        renderResidents([]);
    }
};

const applyResidentFilters = () => {
    const searchValue =
        document
            .getElementById(
                "residentSearchInput"
            )
            ?.value.trim()
            .toLowerCase() || "";

    const sortValue =
        document.getElementById(
            "residentSortSelect"
        )?.value || "name-asc";

    let filteredResidents =
        residents.filter((resident) => {
            const searchableText = [
                resident.name,
                resident.roomNumber,
                resident.primaryCondition,
                resident.supportNeeds,
                resident.allergies,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                searchValue
            );
        });

    filteredResidents =
        sortResidents(
            filteredResidents,
            sortValue
        );

    setTextContent(
        "searchResultCount",
        filteredResidents.length
    );

    renderResidents(filteredResidents);
};

const sortResidents = (
    residentList,
    sortValue
) => {
    const sorted = [...residentList];

    switch (sortValue) {
        case "name-desc":
            return sorted.sort((a, b) =>
                getResidentName(b).localeCompare(
                    getResidentName(a)
                )
            );

        case "room-asc":
            return sorted.sort((a, b) =>
                String(
                    a.roomNumber || ""
                ).localeCompare(
                    String(b.roomNumber || ""),
                    undefined,
                    {
                        numeric: true,
                    }
                )
            );

        case "age-asc":
            return sorted.sort(
                (a, b) =>
                    Number(a.age || 0) -
                    Number(b.age || 0)
            );

        case "age-desc":
            return sorted.sort(
                (a, b) =>
                    Number(b.age || 0) -
                    Number(a.age || 0)
            );

        case "name-asc":
        default:
            return sorted.sort((a, b) =>
                getResidentName(a).localeCompare(
                    getResidentName(b)
                )
            );
    }
};

const getResidentName = (resident) => {
    return resident?.name || "";
};

const renderResidents = (
    residentList
) => {
    const grid =
        document.getElementById(
            "residentsGrid"
        );

    if (!grid) {
        return;
    }

    if (residentList.length === 0) {
        const hasResidents =
            residents.length > 0;

        grid.innerHTML = `
            <div class="residents-empty-state">
                <span
                    class="residents-empty-state-icon"
                    aria-hidden="true"
                >
                    ${hasResidents ? "🔍" : "👥"}
                </span>

                <h3>
                    ${
                        hasResidents
                            ? "No matching residents"
                            : "No residents added yet"
                    }
                </h3>

                <p>
                    ${
                        hasResidents
                            ? "Try a different search term."
                            : "Add your first resident profile to begin."
                    }
                </p>
            </div>
        `;

        return;
    }

    grid.innerHTML = residentList
        .map(createResidentCard)
        .join("");

    grid
        .querySelectorAll(
            "[data-edit-resident]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openEditResidentModal(
                        button.dataset
                            .editResident
                    );
                }
            );
        });

    grid
        .querySelectorAll(
            "[data-delete-resident]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openDeleteResidentModal(
                        button.dataset
                            .deleteResident
                    );
                }
            );
        });
};

const createResidentCard = (
    resident
) => {
    const id =
        resident._id ||
        resident.id ||
        "";

    const name =
        resident.name ||
        "Unnamed resident";

    const age =
        resident.age ??
        "Not provided";

    const room =
        resident.roomNumber ||
        "Not assigned";

    const supportNeeds =
        resident.supportNeeds ||
        "Not provided";

    const allergies =
        resident.allergies ||
        "None recorded";

    const emergencyContact =
        resident.emergencyContactName ||
        "Not provided";

    const detailsUrl = id
        ? `resident-details.html?id=${encodeURIComponent(
              id
          )}`
        : "residents.html";

    const hasAllergy =
        allergies.trim().toLowerCase() !==
            "none" &&
        allergies.trim().toLowerCase() !==
            "none recorded" &&
        allergies.trim() !== "";

    return `
        <article class="resident-card">
            <div class="resident-card-top">
                <div class="resident-card-identity">
                    <div
                        class="resident-card-avatar"
                        aria-hidden="true"
                    >
                        ${escapeHtml(
                            getInitials(name)
                        )}
                    </div>

                    <div>
                        <h2 class="resident-card-name">
                            ${escapeHtml(name)}
                        </h2>

                        <p class="resident-card-room">
                            Room ${escapeHtml(room)}
                        </p>
                    </div>
                </div>

                <div class="resident-card-menu">
                    <button
                        type="button"
                        class="resident-icon-btn"
                        data-edit-resident="${escapeHtml(
                            id
                        )}"
                        aria-label="Edit ${escapeHtml(
                            name
                        )}"
                        title="Edit resident"
                    >
                        ✎
                    </button>

                    <button
                        type="button"
                        class="resident-icon-btn delete"
                        data-delete-resident="${escapeHtml(
                            id
                        )}"
                        aria-label="Delete ${escapeHtml(
                            name
                        )}"
                        title="Delete resident"
                    >
                        🗑
                    </button>
                </div>
            </div>

            <div class="resident-card-details">
                <div class="resident-detail-row">
                    <span class="resident-detail-label">
                        Age
                    </span>

                    <span class="resident-detail-value">
                        ${escapeHtml(age)}
                    </span>
                </div>

                <div class="resident-detail-row">
                    <span class="resident-detail-label">
                        Support needs
                    </span>

                    <span class="resident-detail-value">
                        ${escapeHtml(
                            supportNeeds
                        )}
                    </span>
                </div>

                <div class="resident-detail-row">
                    <span class="resident-detail-label">
                        Emergency contact
                    </span>

                    <span class="resident-detail-value">
                        ${escapeHtml(
                            emergencyContact
                        )}
                    </span>
                </div>
            </div>

            ${
                hasAllergy
                    ? `
                        <div class="resident-allergy-alert">
                            Allergy: ${escapeHtml(
                                allergies
                            )}
                        </div>
                    `
                    : ""
            }

            <div class="resident-card-actions">
                <a
                    href="${detailsUrl}"
                    class="btn btn-primary resident-view-btn"
                >
                    View resident
                </a>
            </div>
        </article>
    `;
};

const openAddResidentModal = () => {
    resetResidentForm();

    const title =
        document.getElementById(
            "residentModalTitle"
        );

    const saveButton =
        document.getElementById(
            "saveResidentBtn"
        );

    if (title) {
        title.textContent =
            "Add resident";
    }

    if (saveButton) {
        saveButton.textContent =
            "Save resident";
    }

    openModal("residentFormModal");

    document
        .getElementById(
            "residentName"
        )
        ?.focus();
};

const openEditResidentModal = (
    residentId
) => {
    const resident =
        residents.find(
            (item) =>
                String(
                    item._id ||
                        item.id
                ) === String(residentId)
        );

    if (!resident) {
        return;
    }

    clearMessage(
        document.getElementById(
            "residentFormMessage"
        )
    );

    setInputValue(
        "residentId",
        resident._id ||
            resident.id ||
            ""
    );

    setInputValue(
        "residentName",
        resident.name
    );

    setInputValue(
        "residentAge",
        resident.age
    );

    setInputValue(
        "roomNumber",
        resident.roomNumber
    );

    setInputValue(
        "emergencyContactName",
        resident.emergencyContactName
    );

    setInputValue(
        "emergencyContactPhone",
        resident.emergencyContactPhone
    );

    setInputValue(
        "supportNeeds",
        resident.supportNeeds
    );

    setInputValue(
        "allergies",
        resident.allergies
    );

    setInputValue(
        "residentNotes",
        resident.notes
    );

    const title =
        document.getElementById(
            "residentModalTitle"
        );

    const saveButton =
        document.getElementById(
            "saveResidentBtn"
        );

    if (title) {
        title.textContent =
            "Edit resident";
    }

    if (saveButton) {
        saveButton.textContent =
            "Save changes";
    }

    openModal("residentFormModal");
};

const handleResidentSubmit = async (
    event
) => {
    event.preventDefault();

    const messageElement =
        document.getElementById(
            "residentFormMessage"
        );

    const saveButton =
        document.getElementById(
            "saveResidentBtn"
        );

    clearMessage(messageElement);

    const residentId =
        document
            .getElementById(
                "residentId"
            )
            ?.value.trim() || "";

    const name =
        document
            .getElementById(
                "residentName"
            )
            ?.value.trim() || "";

    const ageValue =
        document
            .getElementById(
                "residentAge"
            )
            ?.value.trim() || "";

    const roomNumber =
        document
            .getElementById(
                "roomNumber"
            )
            ?.value.trim() || "";

    if (!name || !ageValue || !roomNumber) {
        showMessage(
            messageElement,
            "Name, age, and room number are required."
        );

        return;
    }

    const age = Number(ageValue);

    if (
        !Number.isInteger(age) ||
        age < 0 ||
        age > 130
    ) {
        showMessage(
            messageElement,
            "Please enter a valid age between 0 and 130."
        );

        return;
    }

    const body = {
        name,
        age,
        roomNumber,
        emergencyContactName:
            getInputValue(
                "emergencyContactName"
            ),
        emergencyContactPhone:
            getInputValue(
                "emergencyContactPhone"
            ),
        supportNeeds:
            getInputValue(
                "supportNeeds"
            ),
        allergies:
            getInputValue("allergies"),
        notes:
            getInputValue(
                "residentNotes"
            ),
    };

    const isEditing =
        Boolean(residentId);

    try {
        setButtonLoading(
            saveButton,
            true,
            isEditing
                ? "Saving..."
                : "Adding..."
        );

        const response =
            await apiRequest(
                isEditing
                    ? `/residents/${encodeURIComponent(
                          residentId
                      )}`
                    : "/residents",
                {
                    method:
                        isEditing
                            ? "PUT"
                            : "POST",
                    body,
                }
            );

        const savedResident =
            response?.resident ||
            response?.data ||
            response;

        if (isEditing) {
            residents = residents.map(
                (resident) => {
                    const id =
                        resident._id ||
                        resident.id;

                    return String(id) ===
                        String(residentId)
                        ? {
                              ...resident,
                              ...savedResident,
                              ...body,
                          }
                        : resident;
                }
            );
        } else {
            if (
                savedResident &&
                typeof savedResident ===
                    "object"
            ) {
                residents.unshift(
                    savedResident
                );
            } else {
                await loadResidents();
            }
        }

        closeResidentModal();
        updateResidentSummary();
        applyResidentFilters();

        showMessage(
            document.getElementById(
                "residentsMessage"
            ),
            isEditing
                ? "Resident updated successfully."
                : "Resident added successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Resident save error:",
            error
        );

        showMessage(
            messageElement,
            error.message ||
                "Unable to save resident."
        );
    } finally {
        setButtonLoading(
            saveButton,
            false
        );
    }
};

const openDeleteResidentModal = (
    residentId
) => {
    const resident =
        residents.find(
            (item) =>
                String(
                    item._id ||
                        item.id
                ) === String(residentId)
        );

    if (!resident) {
        return;
    }

    selectedResidentId =
        residentId;

    const nameElement =
        document.getElementById(
            "deleteResidentName"
        );

    if (nameElement) {
        nameElement.textContent =
            resident.name ||
            "this resident";
    }

    openModal(
        "deleteResidentModal"
    );
};

const confirmResidentDelete =
    async () => {
        if (!selectedResidentId) {
            return;
        }

        const button =
            document.getElementById(
                "confirmDeleteResidentBtn"
            );

        try {
            setButtonLoading(
                button,
                true,
                "Deleting..."
            );

            await apiRequest(
                `/residents/${encodeURIComponent(
                    selectedResidentId
                )}`,
                {
                    method: "DELETE",
                }
            );

            residents =
                residents.filter(
                    (resident) => {
                        const id =
                            resident._id ||
                            resident.id;

                        return (
                            String(id) !==
                            String(
                                selectedResidentId
                            )
                        );
                    }
                );

            closeDeleteResidentModal();
            updateResidentSummary();
            applyResidentFilters();

            showMessage(
                document.getElementById(
                    "residentsMessage"
                ),
                "Resident deleted successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Resident delete error:",
                error
            );

            showMessage(
                document.getElementById(
                    "residentsMessage"
                ),
                error.message ||
                    "Unable to delete resident."
            );

            closeDeleteResidentModal();
        } finally {
            setButtonLoading(
                button,
                false
            );
        }
    };

const updateResidentSummary = () => {
    setTextContent(
        "residentCount",
        residents.length
    );

    const emergencyCount =
        residents.filter(
            (resident) =>
                Boolean(
                    resident.primaryCondition ||
                        resident.bloodType ||
                        resident.preferredHospital ||
                        resident.emergencyNotes
                )
        ).length;

    setTextContent(
        "emergencyProfileCount",
        emergencyCount
    );
};

const resetResidentForm = () => {
    document
        .getElementById(
            "residentForm"
        )
        ?.reset();

    setInputValue(
        "residentId",
        ""
    );

    clearMessage(
        document.getElementById(
            "residentFormMessage"
        )
    );
};

const closeResidentModal = () => {
    closeModal("residentFormModal");
    resetResidentForm();
};

const closeDeleteResidentModal =
    () => {
        closeModal(
            "deleteResidentModal"
        );

        selectedResidentId = null;
    };

const openModal = (modalId) => {
    document
        .getElementById(modalId)
        ?.classList.add("active");

    document.body.style.overflow =
        "hidden";
};

const closeModal = (modalId) => {
    document
        .getElementById(modalId)
        ?.classList.remove("active");

    document.body.style.overflow = "";
};

const getInputValue = (
    elementId
) => {
    return (
        document
            .getElementById(
                elementId
            )
            ?.value.trim() || ""
    );
};

const setInputValue = (
    elementId,
    value
) => {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.value =
            value ?? "";
    }
};

const setTextContent = (
    elementId,
    value
) => {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.textContent =
            String(value ?? 0);
    }
};