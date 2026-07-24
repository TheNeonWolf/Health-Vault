let currentResident = null;
let residentId = null;
let medicalRecords = [];
let medications = [];
let summarizingRecordIds = new Set();

document.addEventListener("DOMContentLoaded", async () => {
    document
        .getElementById("logoutBtn")
        ?.addEventListener("click", logout);

    const user = await requireAuth();

    if (!user) {
        return;
    }

    displaySidebarUser(user);
    setupResidentDetailEvents();

    residentId = getQueryParameter("id");

    if (!residentId) {
        showMessage(
            document.getElementById("residentDetailsMessage"),
            "No resident was selected."
        );

        return;
    }

    await loadResident();
    await Promise.all([
        loadMedicalRecords(),
        loadMedications(),
    ]);
    renderResidentTimeline();
});

const openAddMedicationModal = () => {
    document
        .getElementById("medicationForm")
        ?.reset();

    setValue("medicationId", "");
    setValue("medicationStatus", "Active");

    clearMessage(
        document.getElementById(
            "medicationFormMessage"
        )
    );

    const title =
        document.getElementById(
            "medicationModalTitle"
        );

    const saveButton =
        document.getElementById(
            "saveMedicationBtn"
        );

    if (title) {
        title.textContent = "Add medication";
    }

    if (saveButton) {
        saveButton.textContent =
            "Save medication";
    }

    openModal("medicationModal");

    document
        .getElementById("medicationName")
        ?.focus();
};

const closeMedicationModal = () => {
    closeModal("medicationModal");

    document
        .getElementById("medicationForm")
        ?.reset();

    clearMessage(
        document.getElementById(
            "medicationFormMessage"
        )
    );

    setValue("medicationId", "");
};

const displaySidebarUser = (user) => {
    const name =
        user.name ||
        user.username ||
        "Staff member";

    const nameElement =
        document.getElementById("sidebarUserName");

    const initialsElement =
        document.getElementById("sidebarUserInitials");

    if (nameElement) {
        nameElement.textContent = name;
    }

    if (initialsElement) {
        initialsElement.textContent = getInitials(name);
    }
};

const setupResidentDetailEvents = () => {
    const residentEditButtons = [
        "editResidentBtn",
        "quickEditResidentBtn",
    ];

    residentEditButtons.forEach((id) => {
        document
            .getElementById(id)
            ?.addEventListener(
                "click",
                openEditResidentModal
            );
    });

    const emergencyEditButtons = [
        "editEmergencyBtn",
        "quickEditEmergencyBtn",
    ];

    emergencyEditButtons.forEach((id) => {
        document
            .getElementById(id)
            ?.addEventListener(
                "click",
                openEmergencyModal
            );
    });

    document
        .getElementById("closeEditResidentModalBtn")
        ?.addEventListener(
            "click",
            closeEditResidentModal
        );

    document
        .getElementById("cancelEditResidentBtn")
        ?.addEventListener(
            "click",
            closeEditResidentModal
        );

    document
        .getElementById("editResidentForm")
        ?.addEventListener(
            "submit",
            saveResidentProfile
        );

    document
        .getElementById("closeEmergencyModalBtn")
        ?.addEventListener(
            "click",
            closeEmergencyModal
        );

    document
        .getElementById("cancelEmergencyBtn")
        ?.addEventListener(
            "click",
            closeEmergencyModal
        );

    document
        .getElementById("emergencyProfileForm")
        ?.addEventListener(
            "submit",
            saveEmergencyProfile
        );

    document
        .getElementById("addMedicationBtn")
        ?.addEventListener(
            "click",
            openAddMedicationModal
        );

    document
        .getElementById("closeMedicationModalBtn")
        ?.addEventListener(
            "click",
            closeMedicationModal
        );

    document
        .getElementById("cancelMedicationBtn")
        ?.addEventListener(
            "click",
            closeMedicationModal
        );

    document
        .getElementById("medicationForm")
        ?.addEventListener(
            "submit",
            handleMedicationSubmit
        );

    setupOutsideModalClose(
        "medicationModal",
        closeMedicationModal
    );

    setupOutsideModalClose(
        "editResidentModal",
        closeEditResidentModal
    );

    setupOutsideModalClose(
        "emergencyProfileModal",
        closeEmergencyModal
    );

    const uploadButtons = [
    "uploadRecordBtn",
    "quickUploadRecordBtn",
    ];

    uploadButtons.forEach((id) => { 
    document
        .getElementById(id)
        ?.addEventListener(
            "click",
            openUploadRecordModal
        );
    });

    document
        .getElementById("closeUploadRecordModalBtn")
        ?.addEventListener( 
        "click",
        closeUploadRecordModal
        );

    document
        .getElementById("cancelUploadRecordBtn")
        ?.addEventListener( 
        "click",
        closeUploadRecordModal
        );

    document
        .getElementById("uploadRecordForm")
        ?.addEventListener( 
        "submit",
        uploadMedicalRecord
        );

    setupOutsideModalClose( 
        "uploadRecordModal",
        closeUploadRecordModal
    );

    document
        .getElementById(
            "closeDeleteItemModalBtn"
        )
        ?.addEventListener(
            "click",
            closeDeleteItemModal
        );

    document
        .getElementById(
            "cancelDeleteItemBtn"
        )
        ?.addEventListener(
            "click",
            closeDeleteItemModal
        );

    document
        .getElementById(
            "confirmDeleteItemBtn"
        )
        ?.addEventListener(
            "click",
            confirmPendingDelete
        );

    setupOutsideModalClose(
        "deleteItemModal",
        closeDeleteItemModal
    );
};

const setupOutsideModalClose = (
    modalId,
    closeFunction
) => {
    const modal = document.getElementById(modalId);

    modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeFunction();
        }
    });
};

const loadResident = async () => {
    const messageElement =
        document.getElementById(
            "residentDetailsMessage"
        );

    try {
        clearMessage(messageElement);

        const response = await apiRequest(
            `/residents/${encodeURIComponent(
                residentId
            )}`
        );

        currentResident =
            response?.resident ||
            response?.data ||
            response;

        if (
            !currentResident ||
            typeof currentResident !== "object"
        ) {
            throw new Error(
                "The resident profile could not be loaded."
            );
        }

        renderResident();
    } catch (error) {
        console.error(
            "Resident loading error:",
            error
        );

        if (error.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (error.status === 404) {
            showMessage(
                messageElement,
                "This resident could not be found."
            );

            return;
        }

        showMessage(
            messageElement,
            error.message ||
                "Unable to load the resident profile."
        );
    }
};

const renderResident = () => {
    const resident = currentResident;

    const name =
        resident.name ||
        "Unnamed resident";

    setText("headerResidentName", name);
    setText("residentName", name);
    setText("residentInitials", getInitials(name));

    setText(
        "residentRoom",
        resident.roomNumber
            ? `Room ${resident.roomNumber}`
            : "Room not assigned"
    );

    setText(
        "residentAge",
        resident.age !== undefined &&
        resident.age !== null
            ? `Age ${resident.age}`
            : "Age not recorded"
    );

    setText("overviewName", name);
    setText(
        "overviewAge",
        resident.age ?? "Not recorded"
    );

    setText(
        "overviewRoom",
        resident.roomNumber ||
            "Not recorded"
    );

    setText(
        "overviewEmergencyContact",
        resident.emergencyContactName ||
            "Not recorded"
    );

    setText(
        "overviewEmergencyPhone",
        resident.emergencyContactPhone ||
            "Not recorded"
    );

    setText(
        "overviewSupportNeeds",
        resident.supportNeeds ||
            "Not recorded"
    );

    setText(
        "overviewAllergies",
        resident.allergies ||
            "None recorded"
    );

    setText(
        "overviewNotes",
        resident.notes ||
            "No additional notes"
    );

    setText(
        "bloodType",
        resident.bloodType ||
            "Not recorded"
    );

    setText(
        "primaryCondition",
        resident.primaryCondition ||
            "Not recorded"
    );

    setText(
        "preferredHospital",
        resident.preferredHospital ||
            "Not recorded"
    );

    setText(
        "mobilityNeeds",
        resident.mobilityNeeds ||
            "Not recorded"
    );

    setText(
        "communicationNeeds",
        resident.communicationNeeds ||
            "Not recorded"
    );

    setText(
        "emergencyNotes",
        resident.emergencyNotes ||
            "Not recorded"
    );

    updateEmergencyReadiness();
};

const updateEmergencyReadiness = () => {
    const fields = [
        currentResident.bloodType,
        currentResident.primaryCondition,
        currentResident.mobilityNeeds,
        currentResident.communicationNeeds,
        currentResident.preferredHospital,
        currentResident.emergencyNotes,
    ];

    const completedFields =
        fields.filter((value) =>
            Boolean(String(value || "").trim())
        ).length;

    const statusElement =
        document.getElementById(
            "emergencyReadinessStatus"
        );

    const descriptionElement =
        document.getElementById(
            "emergencyReadinessDescription"
        );

    if (!statusElement || !descriptionElement) {
        return;
    }

    if (completedFields === fields.length) {
        statusElement.classList.add("complete");
        statusElement.innerHTML =
            '<span aria-hidden="true">●</span> Profile complete';

        descriptionElement.textContent =
            "All emergency profile fields have been completed.";

        return;
    }

    statusElement.classList.remove("complete");
    statusElement.innerHTML =
        '<span aria-hidden="true">●</span> Profile incomplete';

    descriptionElement.textContent =
        `${completedFields} of ${fields.length} emergency fields have been completed.`;
};

const openEditResidentModal = () => {
    if (!currentResident) {
        return;
    }

    clearMessage(
        document.getElementById(
            "editResidentMessage"
        )
    );

    setValue(
        "editResidentName",
        currentResident.name
    );

    setValue(
        "editResidentAge",
        currentResident.age
    );

    setValue(
        "editRoomNumber",
        currentResident.roomNumber
    );

    setValue(
        "editEmergencyContactName",
        currentResident.emergencyContactName
    );

    setValue(
        "editEmergencyContactPhone",
        currentResident.emergencyContactPhone
    );

    setValue(
        "editSupportNeeds",
        currentResident.supportNeeds
    );

    setValue(
        "editAllergies",
        currentResident.allergies
    );

    setValue(
        "editResidentNotes",
        currentResident.notes
    );

    openModal("editResidentModal");
};

const saveResidentProfile = async (event) => {
    event.preventDefault();

    const messageElement =
        document.getElementById(
            "editResidentMessage"
        );

    const saveButton =
        document.getElementById(
            "saveResidentChangesBtn"
        );

    clearMessage(messageElement);

    const name = getValue("editResidentName");
    const ageValue = getValue("editResidentAge");
    const roomNumber = getValue("editRoomNumber");

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
            getValue("editEmergencyContactName"),
        emergencyContactPhone:
            getValue("editEmergencyContactPhone"),
        supportNeeds:
            getValue("editSupportNeeds"),
        allergies:
            getValue("editAllergies"),
        notes:
            getValue("editResidentNotes"),
    };

    try {
        setButtonLoading(
            saveButton,
            true,
            "Saving..."
        );

        const response = await apiRequest(
            `/residents/${encodeURIComponent(
                residentId
            )}`,
            {
                method: "PUT",
                body,
            }
        );

        const updatedResident =
            response?.resident ||
            response?.data ||
            response;

        currentResident = {
            ...currentResident,
            ...body,
            ...(updatedResident &&
            typeof updatedResident === "object"
                ? updatedResident
                : {}),
            updatedAt:
                updatedResident?.updatedAt ||
                new Date().toISOString(),
        };

        renderResident();
        renderResidentTimeline();
        closeEditResidentModal();

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            "Resident profile updated successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Resident update error:",
            error
        );

        showMessage(
            messageElement,
            error.message ||
                "Unable to update the resident profile."
        );
    } finally {
        setButtonLoading(saveButton, false);
    }
};

const openEmergencyModal = () => {
    if (!currentResident) {
        return;
    }

    clearMessage(
        document.getElementById(
            "emergencyProfileMessage"
        )
    );

    setValue(
        "editBloodType",
        currentResident.bloodType
    );

    setValue(
        "editPrimaryCondition",
        currentResident.primaryCondition
    );

    setValue(
        "editMobilityNeeds",
        currentResident.mobilityNeeds
    );

    setValue(
        "editCommunicationNeeds",
        currentResident.communicationNeeds
    );

    setValue(
        "editPreferredHospital",
        currentResident.preferredHospital
    );

    setValue(
        "editEmergencyNotes",
        currentResident.emergencyNotes
    );

    openModal("emergencyProfileModal");
};

const saveEmergencyProfile = async (event) => {
    event.preventDefault();

    const messageElement =
        document.getElementById(
            "emergencyProfileMessage"
        );

    const saveButton =
        document.getElementById(
            "saveEmergencyBtn"
        );

    clearMessage(messageElement);

    const body = {
        bloodType: getValue("editBloodType"),
        primaryCondition:
            getValue("editPrimaryCondition"),
        mobilityNeeds:
            getValue("editMobilityNeeds"),
        communicationNeeds:
            getValue("editCommunicationNeeds"),
        preferredHospital:
            getValue("editPreferredHospital"),
        emergencyNotes:
            getValue("editEmergencyNotes"),
    };

    try {
        setButtonLoading(
            saveButton,
            true,
            "Saving..."
        );

        const response = await apiRequest(
            `/residents/${encodeURIComponent(
                residentId
            )}`,
            {
                method: "PUT",
                body,
            }
        );

        const updatedResident =
            response?.resident ||
            response?.data ||
            response;

        currentResident = {
            ...currentResident,
            ...body,
            ...(updatedResident &&
            typeof updatedResident === "object"
                ? updatedResident
                : {}),
            updatedAt:
                updatedResident?.updatedAt ||
                new Date().toISOString(),
        };

        renderResident();
        renderResidentTimeline();
        closeEmergencyModal();

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            "Emergency profile updated successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Emergency profile update error:",
            error
        );

        showMessage(
            messageElement,
            error.message ||
                "Unable to update the emergency profile."
        );
    } finally {
        setButtonLoading(saveButton, false);
    }
};

const openModal = (modalId) => {
    document
        .getElementById(modalId)
        ?.classList.add("active");

    document.body.style.overflow = "hidden";
};

const closeModal = (modalId) => {
    document
        .getElementById(modalId)
        ?.classList.remove("active");

    document.body.style.overflow = "";
};

const closeEditResidentModal = () => {
    closeModal("editResidentModal");
};

const closeEmergencyModal = () => {
    closeModal("emergencyProfileModal");
};

const getValue = (elementId) => {
    return (
        document
            .getElementById(elementId)
            ?.value.trim() || ""
    );
};

const setValue = (elementId, value) => {
    const element =
        document.getElementById(elementId);

    if (element) {
        element.value = value ?? "";
    }
};

const setText = (elementId, value) => {
    const element =
        document.getElementById(elementId);

    if (element) {
        element.textContent =
            String(value ?? "");
    }
};

const openUploadRecordModal = () => {
    clearMessage(
        document.getElementById(
            "uploadRecordMessage"
        )
    );

    document
        .getElementById(
            "uploadRecordForm"
        )
        ?.reset();

    openModal("uploadRecordModal");
};

const closeUploadRecordModal = () => {
    closeModal("uploadRecordModal");
};

const uploadMedicalRecord = async (event) => {
    event.preventDefault();

    const messageElement =
        document.getElementById(
            "uploadRecordMessage"
        );

    const saveButton =
        document.getElementById(
            "saveRecordBtn"
        );

    clearMessage(messageElement);

    const title =
        document
            .getElementById("recordTitle")
            ?.value.trim() || "";

    const recordDate =
        document
            .getElementById("recordDate")
            ?.value || "";

    const description =
        document
            .getElementById("recordDescription")
            ?.value.trim() || "";

    const fileInput =
        document.getElementById(
            "recordDocument"
        );

    const file = fileInput?.files?.[0];

    if (!title || !recordDate || !file) {
        showMessage(
            messageElement,
            "Title, record date, and PDF document are required."
        );

        return;
    }

    if (file.type !== "application/pdf") {
        showMessage(
            messageElement,
            "Please select a PDF document."
        );

        return;
    }

    const category =
        document
            .getElementById(
                "recordCategory"
            )
            ?.value || "Other";

    const formData = new FormData();

    formData.append(
        "resident",
        residentId
    );

    formData.append(
        "title",
        title
    );

    formData.append(
        "category",
        category
    );

    formData.append(
        "recordDate",
        recordDate
    );

    formData.append(
        "description",
        description
    );

    formData.append(
        "document",
        file
    );

    try {
        setButtonLoading(
            saveButton,
            true,
            "Uploading..."
        );

        await apiRequest(
            "/records",
            {
                method: "POST",
                body: formData,
            }
        );

        closeUploadRecordModal();
        await loadMedicalRecords();

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            "Medical record uploaded successfully.",
            "success"
        );

        // Later, this will refresh the medical records list.
    } catch (error) {
        console.error(
            "Medical record upload error:",
            error
        );

        showMessage(
            messageElement,
            error.message ||
                "Unable to upload the medical record."
        );
    } finally {
        setButtonLoading(
            saveButton,
            false
        );
    }
};

const loadMedicalRecords = async () => {
    const listElement =
        document.getElementById(
            "medicalRecordsList"
        );

    if (!listElement || !residentId) {
        return;
    }

    try {
        listElement.innerHTML = `
            <div class="resident-placeholder-state">
                <span aria-hidden="true">📄</span>
                <h3>Loading medical records...</h3>
            </div>
        `;

        const response = await apiRequest(
            `/records/resident/${encodeURIComponent(
                residentId
            )}`
        );

        medicalRecords =
            response?.records ||
            response?.data ||
            response ||
            [];

        if (!Array.isArray(medicalRecords)) {
            medicalRecords = [];
        }

        renderMedicalRecords();
        renderResidentTimeline();
    } catch (error) {
        console.error(
            "Medical records loading error:",
            error
        );

        listElement.innerHTML = `
            <div class="resident-placeholder-state">
                <span aria-hidden="true">⚠️</span>

                <h3>Unable to load medical records</h3>

                <p>
                    ${escapeHtml(
                        error.message ||
                            "Please try again."
                    )}
                </p>
            </div>
        `;
    }
};

const renderMedicalRecords = () => {
    const listElement =
        document.getElementById(
            "medicalRecordsList"
        );

    if (!listElement) {
        return;
    }

    if (medicalRecords.length === 0) {
        listElement.innerHTML = `
            <div class="resident-placeholder-state">
                <span aria-hidden="true">📄</span>

                <h3>No medical records yet</h3>

                <p>
                    Upload the first PDF medical record for this resident.
                </p>
            </div>
        `;

        return;
    }

    listElement.innerHTML = medicalRecords
        .map(createMedicalRecordCard)
        .join("");

    listElement
        .querySelectorAll(
            "[data-preview-record]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    previewMedicalRecord(
                        button.dataset
                            .previewRecord
                    );
                }
            );
        });

    listElement
        .querySelectorAll(
            "[data-summarize-record]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    summarizeMedicalRecord(
                        button.dataset.summarizeRecord
                    );
                }
            );
        });

    listElement
        .querySelectorAll(
            "[data-delete-record]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    deleteMedicalRecord(
                        button.dataset
                            .deleteRecord
                    );
                }
            );
        });
};

const hasValidAiSummary = (summary) => {
    if (!summary || typeof summary !== "object") {
        return false;
    }

    const hasOverview =
        typeof summary.overview === "string" &&
        summary.overview.trim().length > 0;

    const listFields = [
        summary.conditions,
        summary.medications,
        summary.allergies,
        summary.followUps,
        summary.importantNotes,
    ];

    const hasListContent = listFields.some(
        (list) =>
            Array.isArray(list) &&
            list.some(
                (item) =>
                    String(item || "").trim()
                        .length > 0
            )
    );

    return hasOverview || hasListContent;
};

const createMedicalRecordCard = (record) => {
    const id =
        record._id ||
        record.id ||
        "";

    const title =
        record.title ||
        "Untitled medical record";

    const category =
        record.category ||
        "Other";

    const description =
        record.description ||
        "No description provided.";

    const date =
        record.recordDate
            ? formatDate(record.recordDate)
            : "Date not recorded";

    const fileName =
        record.fileName ||
        "PDF document";

    const summary =
        record.aiSummary ||
        record.summary ||
        null;

    const summaryStatus =
        record.summaryStatus ||
        "not_started";

    const hasSummary =
        summaryStatus === "completed" &&
        hasValidAiSummary(summary);

    const isSummarizing =
        summarizingRecordIds.has(
            String(id)
        ) ||
        summaryStatus === "processing";

    return `
        <article class="medical-record-card">
            <div class="medical-record-icon" aria-hidden="true">
                PDF
            </div>

            <div class="medical-record-content">
                <div class="medical-record-title-row">
                    <div>
                        <span class="medical-record-category">
                            ${escapeHtml(category)}
                        </span>

                        <h3>
                            ${escapeHtml(title)}
                        </h3>
                    </div>

                    <span class="medical-record-date">
                        ${escapeHtml(date)}
                    </span>
                </div>

                <p class="medical-record-description">
                    ${escapeHtml(description)}
                </p>

                <p class="medical-record-file-name">
                    ${escapeHtml(fileName)}
                </p>
            </div>

            <div class="medical-record-actions">
                <button
                    type="button"
                    class="btn btn-outline"
                    data-preview-record="${escapeHtml(id)}"
                >
                    Preview
                </button>

                <button
                    type="button"
                    class="medical-record-summary-btn"
                    data-summarize-record="${escapeHtml(id)}"
                    ${isSummarizing ? "disabled" : ""}
                >
                    ${
                        isSummarizing
                            ? "Summarizing..."
                            : hasSummary
                                ? "Regenerate summary"
                                : "Generate AI summary"
                    }
                </button>

                <button
                    type="button"
                    class="medical-record-delete-btn"
                    data-delete-record="${escapeHtml(id)}"
                >
                    Delete
                </button>
            </div>

            ${
                summaryStatus === "failed"
                    ? `
                        <div class="ai-summary-error">
                            <strong>AI summary failed</strong>

                            <p>
                                ${escapeHtml(
                                    record.summaryError ||
                                    "The document could not be summarized."
                                )}
                            </p>
                        </div>
                    `
                    : ""
            }

            ${
                hasSummary
                    ? createAiSummaryMarkup(
                          summary,
                          record.summarizedAt
                      )
                    : ""
            }
        </article>
    `;
};

const summarizeMedicalRecord = async (
    recordId
) => {
    const record =
        medicalRecords.find(
            (item) =>
                String(
                    item._id ||
                    item.id
                ) === String(recordId)
        );

    if (!record) {
        return;
    }

    const existingSummary  =
        record.aiSummary ||
        record.summary;
    
    const hasExistingSummary =
        record.summaryStatus === "completed" &&
        hasValidAiSummary(existingSummary);

    if (hasExistingSummary) {
        const confirmed =
            window.confirm(
                "This record already has an AI summary. Generate it again?"
            );

        if (!confirmed) {
            return;
        }
    }

    summarizingRecordIds.add(
        String(recordId)
    );

    renderMedicalRecords();
    renderResidentTimeline();

    try {
        const response =
            await apiRequest(
                `/records/${encodeURIComponent(
                    recordId
                )}/summarize`,
                {
                    method: "POST",
                }
            );

        const updatedRecord =
            response?.record ||
            response?.data ||
            null;

        const summary =
            response?.aiSummary ||
            response?.summary ||
            updatedRecord?.aiSummary ||
            updatedRecord?.summary ||
            null;

        medicalRecords =
            medicalRecords.map(
                (item) => {
                    const itemId =
                        item._id ||
                        item.id;

                    if (
                        String(itemId) !==
                        String(recordId)
                    ) {
                        return item;
                    }

                    return {
                        ...item,
                        ...(updatedRecord &&
                        typeof updatedRecord ===
                            "object"
                            ? updatedRecord
                            : {}),
                        aiSummary:
                            summary ||
                            item.aiSummary,
                        summaryStatus:
                            updatedRecord
                                ?.summaryStatus ||
                            response
                                ?.summaryStatus ||
                            "completed",
                        summaryError:
                            null,
                        summarizedAt:
                            updatedRecord
                                ?.summarizedAt ||
                            response
                                ?.summarizedAt ||
                            new Date()
                                .toISOString(),
                    };
                }
            );

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            "AI summary generated successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "AI summary error:",
            error
        );

        medicalRecords =
            medicalRecords.map(
                (item) => {
                    const itemId =
                        item._id ||
                        item.id;

                    if (
                        String(itemId) !==
                        String(recordId)
                    ) {
                        return item;
                    }

                    return {
                        ...item,
                        aiSummary: null,
                        summary: null,
                        summaryStatus: "failed",
                        summaryError:
                            error.message ||
                            "The document could not be summarized. Please try again.",
                    };
                }
            );

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            error.message ||
                "Unable to generate the AI summary."
        );
    } finally {
        summarizingRecordIds.delete(
            String(recordId)
        );

        renderMedicalRecords();
        renderResidentTimeline();
    }
};

const createAiSummaryMarkup = (
    summary,
    summarizedAt
) => {
    if (
        !summary ||
        typeof summary !== "object"
    ) {
        return "";
    }

    return `
        <section class="ai-summary-panel">
            <div class="ai-summary-header">
                <div>
                    <span class="ai-summary-eyebrow">
                        Gemini AI
                    </span>

                    <h4>
                        Medical record summary
                    </h4>
                </div>

                ${
                    summarizedAt
                        ? `
                            <span class="ai-summary-date">
                                Generated ${escapeHtml(
                                    formatDate(
                                        summarizedAt
                                    )
                                )}
                            </span>
                        `
                        : ""
                }
            </div>

            <div class="ai-summary-warning">
                AI-generated summaries may contain mistakes.
                Staff should verify important information against
                the original document.
            </div>

            <article class="ai-summary-overview">
                <h5>Overview</h5>

                <p>
                    ${escapeHtml(
                        summary.overview ||
                        "No overview was generated."
                    )}
                </p>
            </article>

            <div class="ai-summary-grid">
                ${createSummaryList(
                    "Conditions",
                    summary.conditions
                )}

                ${createSummaryList(
                    "Medications",
                    summary.medications
                )}

                ${createSummaryList(
                    "Allergies",
                    summary.allergies
                )}

                ${createSummaryList(
                    "Follow-ups",
                    summary.followUps
                )}

                ${createSummaryList(
                    "Important notes",
                    summary.importantNotes
                )}
            </div>
        </section>
    `;
};

const createSummaryList = (
    title,
    values
) => {
    const items =
        Array.isArray(values)
            ? values.filter(
                  (value) =>
                      String(
                          value || ""
                      ).trim()
              )
            : [];

    return `
        <article class="ai-summary-list-card">
            <h5>
                ${escapeHtml(title)}
            </h5>

            ${
                items.length > 0
                    ? `
                        <ul>
                            ${items
                                .map(
                                    (item) => `
                                        <li>
                                            ${escapeHtml(
                                                item
                                            )}
                                        </li>
                                    `
                                )
                                .join("")}
                        </ul>
                    `
                    : `
                        <p class="ai-summary-empty">
                            None identified
                        </p>
                    `
            }
        </article>
    `;
};

const previewMedicalRecord = async (
    recordId
) => {
    try {
        const response = await fetch(
            `${API_URL}/records/${encodeURIComponent(
                recordId
            )}/file`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        if (!response.ok) {
            let message =
                "Unable to preview this medical record.";

            try {
                const data =
                    await response.json();

                message =
                    data?.message ||
                    message;
            } catch (error) {
                // The failed response was not JSON.
            }

            throw new Error(message);
        }

        const blob = await response.blob();
        const fileUrl =
            URL.createObjectURL(blob);

        window.open(
            fileUrl,
            "_blank",
            "noopener,noreferrer"
        );

        window.setTimeout(() => {
            URL.revokeObjectURL(fileUrl);
        }, 60000);
    } catch (error) {
        console.error(
            "Medical record preview error:",
            error
        );

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            error.message ||
                "Unable to preview the medical record."
        );
    }
};

const openDeleteItemModal = ({
    title,
    description,
    buttonText,
    onConfirm,
}) => {
    const modal =
        document.getElementById(
            "deleteItemModal"
        );

    const titleElement =
        document.getElementById(
            "deleteItemModalTitle"
        );

    const descriptionElement =
        document.getElementById(
            "deleteItemModalDescription"
        );

    const confirmButton =
        document.getElementById(
            "confirmDeleteItemBtn"
        );

    clearMessage(
        document.getElementById(
            "deleteItemMessage"
        )
    );

    if (titleElement) {
        titleElement.textContent =
            title;
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            description;
    }

    if (confirmButton) {
        confirmButton.textContent =
            buttonText;
    }

    pendingDeleteAction =
        typeof onConfirm === "function"
            ? onConfirm
            : null;

    modal?.classList.add("active");

    document.body.style.overflow =
        "hidden";

    confirmButton?.focus();
};

const closeDeleteItemModal = () => {
    document
        .getElementById(
            "deleteItemModal"
        )
        ?.classList.remove("active");

    document.body.style.overflow =
        "";

    pendingDeleteAction = null;

    clearMessage(
        document.getElementById(
            "deleteItemMessage"
        )
    );
};

const confirmPendingDelete = async () => {
        if (!pendingDeleteAction) {
            return;
        }

        const confirmButton =
            document.getElementById(
                "confirmDeleteItemBtn"
            );

        const action =
            pendingDeleteAction;

        /*
         * Clear it immediately to prevent accidental
         * double execution.
         */
        pendingDeleteAction = null;

        try {
            setButtonLoading(
                confirmButton,
                true,
                "Deleting..."
            );

            await action();

            closeDeleteItemModal();
        } catch (error) {
            showMessage(
                document.getElementById(
                    "deleteItemMessage"
                ),
                error.data?.message ||
                    error.message ||
                    "Unable to delete the item."
            );
        } finally {
            setButtonLoading(
                confirmButton,
                false
            );
        }
};

const deleteMedicalRecord = (
    recordId
) => {
    const record =
        medicalRecords.find(
            (item) =>
                String(
                    item._id ||
                        item.id
                ) === String(recordId)
        );

    const recordTitle =
        record?.title ||
        "this medical record";

    openDeleteItemModal({
        title:
            "Delete medical record?",

        description:
            `You are about to delete "${recordTitle}".`,

        buttonText:
            "Delete record",

        onConfirm: async () => {
            await apiRequest(
                `/records/${encodeURIComponent(
                    recordId
                )}`,
                {
                    method: "DELETE",
                }
            );

            medicalRecords =
                medicalRecords.filter(
                    (item) =>
                        String(
                            item._id ||
                                item.id
                        ) !==
                        String(recordId)
                );

            renderMedicalRecords();
            renderResidentTimeline();

            showMessage(
                document.getElementById(
                    "residentDetailsMessage"
                ),
                "Medical record deleted successfully.",
                "success"
            );
        },
    });
};

const loadMedications = async () => {
    const listElement =
        document.getElementById(
            "medicationsList"
        );

    if (!listElement || !residentId) {
        return;
    }

    try {
        listElement.innerHTML = `
            <div class="resident-placeholder-state">
                <span aria-hidden="true">💊</span>
                <h3>Loading medications...</h3>
            </div>
        `;

        const response = await apiRequest(
            `/medications/resident/${encodeURIComponent(
                residentId
            )}`
        );

        medications =
            response?.medications ||
            response?.data ||
            response ||
            [];

        if (!Array.isArray(medications)) {
            medications = [];
        }

        renderMedications();
        renderResidentTimeline();
    } catch (error) {
        console.error(
            "Medication loading error:",
            error
        );

        listElement.innerHTML = `
            <div class="resident-placeholder-state">
                <span aria-hidden="true">⚠️</span>

                <h3>Unable to load medications</h3>

                <p>
                    ${escapeHtml(
                        error.message ||
                            "Please try again."
                    )}
                </p>
            </div>
        `;
    }
};

const renderMedications = () => {
    const listElement =
        document.getElementById(
            "medicationsList"
        );

    if (!listElement) {
        return;
    }

    if (medications.length === 0) {
        listElement.innerHTML = `
            <div class="resident-placeholder-state">
                <span aria-hidden="true">💊</span>

                <h3>No medications recorded</h3>

                <p>
                    Add the first medication for this resident.
                </p>
            </div>
        `;

        return;
    }

    listElement.innerHTML =
        medications
            .map(createMedicationCard)
            .join("");

    listElement
        .querySelectorAll(
            "[data-edit-medication]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openEditMedicationModal(
                        button.dataset
                            .editMedication
                    );
                }
            );
        });

    listElement
        .querySelectorAll(
            "[data-delete-medication]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    deleteMedication(
                        button.dataset
                            .deleteMedication
                    );
                }
            );
        });
};

const createMedicationCard = (
    medication
) => {
    const id =
        medication._id ||
        medication.id ||
        "";

    const name =
        medication.name ||
        "Unnamed medication";

    const dosage =
        medication.dosage ||
        "Dosage not recorded";

    const frequency =
        medication.frequency ||
        "Frequency not recorded";

    const status =
        medication.status ||
        "Active";

    const times =
        Array.isArray(medication.times)
            ? medication.times
            : [];

    const startDate =
        medication.startDate
            ? formatDate(
                  medication.startDate
              )
            : "Not recorded";

    const endDate =
        medication.endDate
            ? formatDate(
                  medication.endDate
              )
            : "Ongoing";

    const instructions =
        medication.instructions ||
        "No instructions recorded.";

    const prescribedBy =
        medication.prescribedBy ||
        "Not recorded";

    return `
        <article class="medication-card">
            <div class="medication-card-header">
                <div class="medication-card-identity">
                    <div
                        class="medication-card-icon"
                        aria-hidden="true"
                    >
                        💊
                    </div>

                    <div>
                        <span
                            class="medication-status medication-status-${escapeHtml(
                                status.toLowerCase()
                            )}"
                        >
                            ${escapeHtml(status)}
                        </span>

                        <h3>
                            ${escapeHtml(name)}
                        </h3>

                        <p>
                            ${escapeHtml(dosage)}
                            ·
                            ${escapeHtml(frequency)}
                        </p>
                    </div>
                </div>

                <div class="medication-card-actions">
                    <button
                        type="button"
                        class="medication-action-btn"
                        data-edit-medication="${escapeHtml(
                            id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="medication-action-btn delete"
                        data-delete-medication="${escapeHtml(
                            id
                        )}"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div class="medication-details-grid">
                <article>
                    <span>Start date</span>
                    <strong>
                        ${escapeHtml(startDate)}
                    </strong>
                </article>

                <article>
                    <span>End date</span>
                    <strong>
                        ${escapeHtml(endDate)}
                    </strong>
                </article>

                <article>
                    <span>Prescribed by</span>
                    <strong>
                        ${escapeHtml(
                            prescribedBy
                        )}
                    </strong>
                </article>

                <article>
                    <span>Medication times</span>
                    <strong>
                        ${
                            times.length
                                ? times
                                      .map(
                                          escapeHtml
                                      )
                                      .join(", ")
                                : "Not recorded"
                        }
                    </strong>
                </article>
            </div>

            <div class="medication-instructions">
                <span>Instructions</span>

                <p>
                    ${escapeHtml(
                        instructions
                    )}
                </p>
            </div>

            ${
                medication.notes
                    ? `
                        <div class="medication-notes">
                            <span>Notes</span>

                            <p>
                                ${escapeHtml(
                                    medication.notes
                                )}
                            </p>
                        </div>
                    `
                    : ""
            }
        </article>
    `;
};

const openEditMedicationModal = (
    medicationId
) => {
    const medication =
        medications.find((item) => {
            const id =
                item._id ||
                item.id;

            return (
                String(id) ===
                String(medicationId)
            );
        });

    if (!medication) {
        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            "Medication could not be found."
        );

        return;
    }

    clearMessage(
        document.getElementById(
            "medicationFormMessage"
        )
    );

    setValue(
        "medicationId",
        medicationId
    );

    setValue(
        "medicationName",
        medication.name
    );

    setValue(
        "medicationDosage",
        medication.dosage
    );

    setValue(
        "medicationFrequency",
        medication.frequency
    );

    setValue(
        "medicationStartDate",
        toDateInputValue(
            medication.startDate
        )
    );

    setValue(
        "medicationEndDate",
        toDateInputValue(
            medication.endDate
        )
    );

    setValue(
        "medicationStatus",
        medication.status ||
            "Active"
    );

    setValue(
        "medicationPrescribedBy",
        medication.prescribedBy
    );

    setValue(
        "medicationTimes",
        Array.isArray(
            medication.times
        )
            ? medication.times.join(", ")
            : ""
    );

    setValue(
        "medicationInstructions",
        medication.instructions
    );

    setValue(
        "medicationNotes",
        medication.notes
    );

    const title =
        document.getElementById(
            "medicationModalTitle"
        );

    const saveButton =
        document.getElementById(
            "saveMedicationBtn"
        );

    if (title) {
        title.textContent =
            "Edit medication";
    }

    if (saveButton) {
        saveButton.textContent =
            "Save changes";
    }

    openModal(
        "medicationModal"
    );

    document
        .getElementById(
            "medicationName"
        )
        ?.focus();
};

const handleMedicationSubmit = async (
    event
) => {
    event.preventDefault();

    const messageElement =
        document.getElementById(
            "medicationFormMessage"
        );

    const saveButton =
        document.getElementById(
            "saveMedicationBtn"
        );

    clearMessage(messageElement);

    const medicationId =
        getValue("medicationId");

    const name =
        getValue("medicationName");

    const dosage =
        getValue("medicationDosage");

    const frequency =
        getValue(
            "medicationFrequency"
        );

    const startDate =
        getValue(
            "medicationStartDate"
        );

    const endDate =
        getValue(
            "medicationEndDate"
        );

    if (
        !name ||
        !dosage ||
        !frequency ||
        !startDate
    ) {
        showMessage(
            messageElement,
            "Medication name, dosage, frequency, and start date are required."
        );

        return;
    }

    if (
        endDate &&
        new Date(endDate) <
            new Date(startDate)
    ) {
        showMessage(
            messageElement,
            "End date cannot be before the start date."
        );

        return;
    }

    const times =
        getValue("medicationTimes")
            .split(",")
            .map((time) => time.trim())
            .filter(Boolean);

    const body = {
        resident: residentId,
        name,
        dosage,
        frequency,
        startDate,
        endDate: endDate || null,
        status:
            getValue(
                "medicationStatus"
            ) || "Active",
        prescribedBy:
            getValue(
                "medicationPrescribedBy"
            ),
        times,
        instructions:
            getValue(
                "medicationInstructions"
            ),
        notes:
            getValue(
                "medicationNotes"
            ),
    };

    const isEditing =
        Boolean(medicationId);

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
                    ? `/medications/${encodeURIComponent(
                          medicationId
                      )}`
                    : "/medications",
                {
                    method:
                        isEditing
                            ? "PUT"
                            : "POST",
                    body,
                }
            );

        const savedMedication =
            response?.medication ||
            response?.data ||
            response;

        if (isEditing) {
            medications =
                medications.map(
                    (item) => {
                        const id =
                            item._id ||
                            item.id;

                        return String(id) ===
                            String(
                                medicationId
                            )
                            ? {
                                  ...item,
                                  ...body,
                                  ...(savedMedication &&
                                  typeof savedMedication ===
                                      "object"
                                      ? savedMedication
                                      : {}),
                              }
                            : item;
                    }
                );
        } else {
            if (
                savedMedication &&
                typeof savedMedication ===
                    "object"
            ) {
                medications.unshift(
                    savedMedication
                );
            } else {
                await loadMedications();
            }
        }

        closeMedicationModal();
        renderMedications();
        renderMedications();

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            isEditing
                ? "Medication updated successfully."
                : "Medication added successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Medication save error:",
            error
        );

        showMessage(
            messageElement,
            error.data?.message ||
                error.message ||
                "Unable to save medication."
        );
    } finally {
        setButtonLoading(
            saveButton,
            false
        );
    }
};

const deleteMedication = (
    medicationId
) => {
    const medication =
        medications.find(
            (item) =>
                String(
                    item._id ||
                        item.id
                ) ===
                String(medicationId)
        );

    const medicationName =
        medication?.name ||
        "this medication";

    openDeleteItemModal({
        title:
            "Delete medication?",

        description:
            `You are about to delete "${medicationName}".`,

        buttonText:
            "Delete medication",

        onConfirm: async () => {
            await apiRequest(
                `/medications/${encodeURIComponent(
                    medicationId
                )}`,
                {
                    method: "DELETE",
                }
            );

            medications =
                medications.filter(
                    (item) =>
                        String(
                            item._id ||
                                item.id
                        ) !==
                        String(
                            medicationId
                        )
                );

            renderMedications();
            renderResidentTimeline();

            showMessage(
                document.getElementById(
                    "residentDetailsMessage"
                ),
                "Medication deleted successfully.",
                "success"
            );
        },
    });
};

const toDateInputValue = (
    dateValue
) => {
    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date
        .toISOString()
        .split("T")[0];
};

const renderResidentTimeline = () => {
    const timelineElement =
        document.getElementById(
            "residentTimeline"
        );

    if (!timelineElement) {
        return;
    }

    const events =
        createResidentTimelineEvents();

    if (events.length === 0) {
        timelineElement.innerHTML = `
            <div class="resident-placeholder-state">
                <span aria-hidden="true">🕒</span>

                <h3>No activity recorded yet</h3>

                <p>
                    Resident updates, medications,
                    medical records, and AI summaries
                    will appear here.
                </p>
            </div>
        `;

        return;
    }

    const groupedEvents =
        groupTimelineEventsByDate(events);

    timelineElement.innerHTML =
        groupedEvents
            .map(
                ([dateLabel, dateEvents]) => `
                    <section class="timeline-date-group">
                        <h3 class="timeline-date-label">
                            ${escapeHtml(dateLabel)}
                        </h3>

                        <div class="timeline-events">
                            ${dateEvents
                                .map(
                                    createTimelineEventMarkup
                                )
                                .join("")}
                        </div>
                    </section>
                `
            )
            .join("");
};

const createResidentTimelineEvents = () => {
    const events = [];

    if (currentResident?.createdAt) {
        events.push({
            type: "resident-created",
            icon: "👤",
            title:
                "Resident profile created",
            description:
                currentResident.name ||
                "Resident profile",
            date: currentResident.createdAt,
        });
    }

    if (
        currentResident?.updatedAt &&
        currentResident.updatedAt !==
            currentResident.createdAt
    ) {
        events.push({
            type: "resident-updated",
            icon: "✎",
            title:
                "Resident profile updated",
            description:
                "General or emergency information was updated.",
            date: currentResident.updatedAt,
        });
    }

    medicalRecords.forEach((record) => {
        const recordTitle =
            record.title ||
            "Medical record";

        const uploadDate =
            record.createdAt ||
            record.recordDate;

        if (uploadDate) {
            events.push({
                type: "record-uploaded",
                icon: "📄",
                title:
                    "Medical record uploaded",
                description:
                    recordTitle,
                meta:
                    record.fileName ||
                    record.category ||
                    "",
                date: uploadDate,
            });
        }

        if (
            record.summaryStatus ===
                "completed" &&
            record.summarizedAt
        ) {
            events.push({
                type: "summary-generated",
                icon: "✨",
                title:
                    "AI summary generated",
                description:
                    recordTitle,
                meta:
                    "Gemini medical-record summary",
                date: record.summarizedAt,
            });
        }
    });

    medications.forEach(
        (medication) => {
            if (medication.createdAt) {
                events.push({
                    type: "medication-added",
                    icon: "💊",
                    title:
                        "Medication added",
                    description:
                        medication.name ||
                        "Medication",
                    meta: [
                        medication.dosage,
                        medication.frequency,
                    ]
                        .filter(Boolean)
                        .join(" · "),
                    date:
                        medication.createdAt,
                });
            }

            if (
                medication.updatedAt &&
                medication.updatedAt !==
                    medication.createdAt
            ) {
                events.push({
                    type:
                        "medication-updated",
                    icon: "✎",
                    title:
                        "Medication updated",
                    description:
                        medication.name ||
                        "Medication",
                    meta:
                        medication.status ||
                        "",
                    date:
                        medication.updatedAt,
                });
            }
        }
    );

    return events
        .filter((event) =>
            isValidTimelineDate(
                event.date
            )
        )
        .sort(
            (firstEvent, secondEvent) =>
                new Date(
                    secondEvent.date
                ) -
                new Date(
                    firstEvent.date
                )
        );
};

const groupTimelineEventsByDate = (
    events
) => {
    const groups = new Map();

    events.forEach((event) => {
        const label =
            getTimelineDateLabel(
                event.date
            );

        if (!groups.has(label)) {
            groups.set(label, []);
        }

        groups
            .get(label)
            .push(event);
    });

    return Array.from(
        groups.entries()
    );
};

const createTimelineEventMarkup = (
    event
) => {
    return `
        <article class="timeline-event">
            <div
                class="timeline-event-marker"
                aria-hidden="true"
            >
                ${escapeHtml(event.icon)}
            </div>

            <div class="timeline-event-content">
                <div class="timeline-event-header">
                    <h4>
                        ${escapeHtml(
                            event.title
                        )}
                    </h4>

                    <time
                        datetime="${escapeHtml(
                            new Date(
                                event.date
                            ).toISOString()
                        )}"
                    >
                        ${escapeHtml(
                            formatTimelineTime(
                                event.date
                            )
                        )}
                    </time>
                </div>

                <p class="timeline-event-description">
                    ${escapeHtml(
                        event.description ||
                            ""
                    )}
                </p>

                ${
                    event.meta
                        ? `
                            <p class="timeline-event-meta">
                                ${escapeHtml(
                                    event.meta
                                )}
                            </p>
                        `
                        : ""
                }
            </div>
        </article>
    `;
};

const isValidTimelineDate = (
    dateValue
) => {
    if (!dateValue) {
        return false;
    }

    const date = new Date(dateValue);

    return !Number.isNaN(
        date.getTime()
    );
};

const getTimelineDateLabel = (
    dateValue
) => {
    const date = new Date(dateValue);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(
        today.getDate() - 1
    );

    if (
        isSameCalendarDate(
            date,
            today
        )
    ) {
        return "Today";
    }

    if (
        isSameCalendarDate(
            date,
            yesterday
        )
    ) {
        return "Yesterday";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );
};

const isSameCalendarDate = (
    firstDate,
    secondDate
) => {
    return (
        firstDate.getFullYear() ===
            secondDate.getFullYear() &&
        firstDate.getMonth() ===
            secondDate.getMonth() &&
        firstDate.getDate() ===
            secondDate.getDate()
    );
};

const formatTimelineTime = (
    dateValue
) => {
    const date = new Date(dateValue);

    return date.toLocaleTimeString(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit",
        }
    );
};