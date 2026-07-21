import mongoose from "mongoose";
import Medication from "../models/Medication.js";
import Resident from "../models/Resident.js";

const allowedFrequencies = [
    "Once Daily",
    "Twice Daily",
    "Three Times Daily",
    "Four Times Daily",
    "As Needed",
    "Weekly",
    "Other",
];

const allowedStatuses = [
    "Active",
    "Paused",
    "Completed",
];

const addMedication = async (req, res) => {
    try {
        const {
            resident,
            name,
            dosage,
            instructions,
            frequency,
            times,
            startDate,
            endDate,
            prescribedBy,
            status,
            notes,
        } = req.body;

        if (
            !resident ||
            !name?.trim() ||
            !dosage?.trim() ||
            !frequency ||
            !startDate
        ) {
            return res.status(400).json({
                message:
                    "Resident, medication name, dosage, frequency, and start date are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(resident)) {
            return res.status(400).json({
                message: "Invalid resident ID",
            });
        }

        if (!allowedFrequencies.includes(frequency)) {
            return res.status(400).json({
                message: "Invalid medication frequency",
            });
        }

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid medication status",
            });
        }

        if (times !== undefined && !Array.isArray(times)) {
            return res.status(400).json({
                message: "Medication times must be an array",
            });
        }

        const residentExists = await Resident.findOne({
            _id: resident,
            createdBy: req.user._id,
        });

        if (!residentExists) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = endDate ? new Date(endDate) : null;

        if (Number.isNaN(parsedStartDate.getTime())) {
            return res.status(400).json({
                message: "Invalid start date",
            });
        }

        if (
            parsedEndDate &&
            Number.isNaN(parsedEndDate.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid end date",
            });
        }

        if (
            parsedEndDate &&
            parsedEndDate < parsedStartDate
        ) {
            return res.status(400).json({
                message: "End date cannot be before start date",
            });
        }

        const medication = await Medication.create({
            resident,
            createdBy: req.user._id,
            name: name.trim(),
            dosage: dosage.trim(),
            instructions: instructions?.trim() || "",
            frequency,
            times: times || [],
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            prescribedBy: prescribedBy?.trim() || "",
            status: status || "Active",
            notes: notes?.trim() || "",
        });

        return res.status(201).json({
            message: "Medication added successfully",
            medication,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const getResidentMedications = async (req, res) => {
    try {
        const { residentId } = req.params;
        const { status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(residentId)) {
            return res.status(400).json({
                message: "Invalid resident ID",
            });
        }

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid medication status",
            });
        }

        const resident = await Resident.findOne({
            _id: residentId,
            createdBy: req.user._id,
        });

        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const filter = {
            resident: residentId,
            createdBy: req.user._id,
        };

        if (status) {
            filter.status = status;
        }

        const medications = await Medication.find(filter).sort({
            status: 1,
            createdAt: -1,
        });

        return res.status(200).json(medications);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const getMedication = async (req, res) => {
    try {
        const { medicationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(medicationId)) {
            return res.status(400).json({
                message: "Invalid medication ID",
            });
        }

        const medication = await Medication.findOne({
            _id: medicationId,
            createdBy: req.user._id,
        }).populate("resident", "name roomNumber");

        if (!medication) {
            return res.status(404).json({
                message: "Medication not found",
            });
        }

        return res.status(200).json(medication);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const updateMedication = async (req, res) => {
    try {
        const { medicationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(medicationId)) {
            return res.status(400).json({
                message: "Invalid medication ID",
            });
        }

        const medication = await Medication.findOne({
            _id: medicationId,
            createdBy: req.user._id,
        });

        if (!medication) {
            return res.status(404).json({
                message: "Medication not found",
            });
        }

        const {
            name,
            dosage,
            instructions,
            frequency,
            times,
            startDate,
            endDate,
            prescribedBy,
            status,
            notes,
        } = req.body;

        if (
            frequency !== undefined &&
            !allowedFrequencies.includes(frequency)
        ) {
            return res.status(400).json({
                message: "Invalid medication frequency",
            });
        }

        if (
            status !== undefined &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid medication status",
            });
        }

        if (times !== undefined && !Array.isArray(times)) {
            return res.status(400).json({
                message: "Medication times must be an array",
            });
        }

        if (name !== undefined) {
            if (!name?.trim()) {
                return res.status(400).json({
                    message: "Medication name cannot be empty",
                });
            }

            medication.name = name.trim();
        }

        if (dosage !== undefined) {
            if (!dosage?.trim()) {
                return res.status(400).json({
                    message: "Dosage cannot be empty",
                });
            }

            medication.dosage = dosage.trim();
        }

        if (instructions !== undefined) {
            medication.instructions = instructions?.trim() || "";
        }

        if (frequency !== undefined) {
            medication.frequency = frequency;
        }

        if (times !== undefined) {
            medication.times = times;
        }

        if (startDate !== undefined) {
            const parsedStartDate = new Date(startDate);

            if (Number.isNaN(parsedStartDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid start date",
                });
            }

            medication.startDate = parsedStartDate;
        }

        if (endDate !== undefined) {
            if (endDate === null || endDate === "") {
                medication.endDate = null;
            } else {
                const parsedEndDate = new Date(endDate);

                if (Number.isNaN(parsedEndDate.getTime())) {
                    return res.status(400).json({
                        message: "Invalid end date",
                    });
                }

                medication.endDate = parsedEndDate;
            }
        }

        if (
            medication.endDate &&
            medication.endDate < medication.startDate
        ) {
            return res.status(400).json({
                message: "End date cannot be before start date",
            });
        }

        if (prescribedBy !== undefined) {
            medication.prescribedBy = prescribedBy?.trim() || "";
        }

        if (status !== undefined) {
            medication.status = status;
        }

        if (notes !== undefined) {
            medication.notes = notes?.trim() || "";
        }

        await medication.save();

        return res.status(200).json({
            message: "Medication updated successfully",
            medication,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const deleteMedication = async (req, res) => {
    try {
        const { medicationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(medicationId)) {
            return res.status(400).json({
                message: "Invalid medication ID",
            });
        }

        const medication = await Medication.findOneAndDelete({
            _id: medicationId,
            createdBy: req.user._id,
        });

        if (!medication) {
            return res.status(404).json({
                message: "Medication not found",
            });
        }

        return res.status(200).json({
            message: "Medication deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export {
    addMedication,
    getResidentMedications,
    getMedication,
    updateMedication,
    deleteMedication,
};