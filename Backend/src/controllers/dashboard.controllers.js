import Resident from "../models/Resident.js";
import MedicalRecords from "../models/MedicalRecords.js";
import Medication from "../models/Medication.js";

const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user._id;

        const [
            totalResidents,
            totalMedicalRecords,
            activeMedications,
            residentsWithAllergies,
            recentResidents,
            recentRecords,
            recentMedications,
        ] = await Promise.all([
            Resident.countDocuments({
                createdBy: userId,
            }),

            MedicalRecords.countDocuments({
                createdBy: userId,
            }),

            Medication.countDocuments({
                createdBy: userId,
                status: "Active",
            }),

            Resident.countDocuments({
                createdBy: userId,
                allergies: {
                    $exists: true,
                    $nin: ["", null],
                },
            }),

            Resident.find({
                createdBy: userId,
            })
                .sort({
                    createdAt: -1,
                })
                .limit(5)
                .select(
                    "name age roomNumber bloodType allergies createdAt"
                ),

            MedicalRecords.find({
                createdBy: userId,
            })
                .sort({
                    createdAt: -1,
                })
                .limit(5)
                .populate(
                    "resident",
                    "name roomNumber"
                )
                .select(
                    "resident title category recordDate fileName createdAt"
                ),

            Medication.find({
                createdBy: userId,
            })
                .sort({
                    createdAt: -1,
                })
                .limit(5)
                .populate(
                    "resident",
                    "name roomNumber"
                )
                .select(
                    "resident name dosage frequency status times createdAt"
                ),
        ]);

        return res.status(200).json({
            stats: {
                totalResidents,
                totalMedicalRecords,
                activeMedications,
                residentsWithAllergies,
            },

            recentResidents,
            recentRecords,
            recentMedications,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export {
    getDashboardSummary,
};