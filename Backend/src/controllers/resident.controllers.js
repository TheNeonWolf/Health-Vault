import Resident from "../models/Resident.js";
import MedicalRecords from "../models/MedicalRecords.js";
import Medication from "../models/Medication.js";
import mongoose from "mongoose";

const allowedBloodTypes = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "Unknown",
];

const addResident = async (req, res) => {
    try {
        const {
            name,
            age,
            roomNumber,
            emergencyContactName,
            emergencyContactPhone,
            supportNeeds,
            allergies,
            notes,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Name is required",
            });
        }

        const resident = await Resident.create({
            createdBy: req.user._id,
            name: name.trim(),
            age,
            roomNumber,
            emergencyContactName,
            emergencyContactPhone,
            supportNeeds,
            allergies,
            notes,
        });

        return res.status(201).json({
            message: "Resident has been added successfully!",
            resident,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const getResidents = async (req, res) => {
    try {
        const residents = await Resident.find({
            createdBy: req.user._id,
        }).sort({ createdAt: -1 });

        return res.status(200).json(residents);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const deleteResident = async (req, res) => {
    try {
        const resident = await Resident.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        });

        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const existingRecord = await MedicalRecords.findOne({
            resident: req.params.id,
            createdBy: req.user._id,
        });

        if (existingRecord) {
            return res.status(400).json({
                message:
                    "Delete this resident's medical records before deleting the resident.",
            });
        }

        const existingMedication = await Medication.findOne({
            resident: req.params.id,
            createdBy: req.user._id,
        });

        if (existingMedication) {
            return res.status(400).json({
                message:
                    "Delete this resident's medications before deleting the resident.",
            });
        }

        await resident.deleteOne();

        return res.status(200).json({
            message: "Resident deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const getResident = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid resident ID",
            });
        }

        const resident = await Resident.findOne({
            _id: id,
            createdBy: req.user._id,
        });

        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        return res.status(200).json(resident);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const updateResident = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid resident ID",
            });
        }

        const resident = await Resident.findOne({
            _id: id,
            createdBy: req.user._id,
        });

        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const {
            name,
            age,
            roomNumber,
            emergencyContactName,
            emergencyContactPhone,
            supportNeeds,
            allergies,
            notes,
            bloodType,
            primaryCondition,
            mobilityNeeds,
            communicationNeeds,
            preferredHospital,
            emergencyNotes,
        } = req.body;

        if (name !== undefined) {
            if (!name?.trim()) {
                return res.status(400).json({
                    message: "Resident name cannot be empty",
                });
            }

            resident.name = name.trim();
        }

        if (age !== undefined) {
            if (
                age !== "" &&
                (Number(age) < 0 || Number(age) > 130)
            ) {
                return res.status(400).json({
                    message: "Age must be between 0 and 130",
                });
            }

            resident.age =
                age === "" ? undefined : Number(age);
        }

        if (
            bloodType !== undefined &&
            !allowedBloodTypes.includes(bloodType)
        ) {
            return res.status(400).json({
                message: "Invalid blood type",
            });
        }

        if (roomNumber !== undefined) {
            resident.roomNumber = roomNumber?.trim() || "";
        }

        if (emergencyContactName !== undefined) {
            resident.emergencyContactName =
                emergencyContactName?.trim() || "";
        }

        if (emergencyContactPhone !== undefined) {
            resident.emergencyContactPhone =
                emergencyContactPhone?.trim() || "";
        }

        if (supportNeeds !== undefined) {
            resident.supportNeeds =
                supportNeeds?.trim() || "";
        }

        if (allergies !== undefined) {
            resident.allergies =
                allergies?.trim() || "";
        }

        if (notes !== undefined) {
            resident.notes = notes?.trim() || "";
        }

        if (bloodType !== undefined) {
            resident.bloodType = bloodType;
        }

        if (primaryCondition !== undefined) {
            resident.primaryCondition =
                primaryCondition?.trim() || "";
        }

        if (mobilityNeeds !== undefined) {
            resident.mobilityNeeds =
                mobilityNeeds?.trim() || "";
        }

        if (communicationNeeds !== undefined) {
            resident.communicationNeeds =
                communicationNeeds?.trim() || "";
        }

        if (preferredHospital !== undefined) {
            resident.preferredHospital =
                preferredHospital?.trim() || "";
        }

        if (emergencyNotes !== undefined) {
            resident.emergencyNotes =
                emergencyNotes?.trim() || "";
        }

        await resident.save();

        return res.status(200).json({
            message: "Resident updated successfully",
            resident,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export {
    addResident,
    getResidents,
    deleteResident,
    getResident,
    updateResident,
};