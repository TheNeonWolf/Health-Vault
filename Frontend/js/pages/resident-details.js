let currentResident = null;
let residentId = null;
let medicalRecords = [];
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
    await loadMedicalRecords();
});

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
        };

        renderResident();
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
        };

        renderResident();
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

    const ExistingSummary =
        record.aiSummary ||
        record.hasSummary;
    
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

const deleteMedicalRecord = async (
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

    const confirmed = window.confirm(
        `Delete "${
            record?.title ||
            "this medical record"
        }"?`
    );

    if (!confirmed) {
        return;
    }

    try {
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
                    ) !== String(recordId)
            );

        renderMedicalRecords();

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            "Medical record deleted successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Medical record delete error:",
            error
        );

        showMessage(
            document.getElementById(
                "residentDetailsMessage"
            ),
            error.message ||
                "Unable to delete the medical record."
        );
    }
};