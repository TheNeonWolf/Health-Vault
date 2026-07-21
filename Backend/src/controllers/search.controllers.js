import Resident from "../models/Resident.js";
import MedicalRecords from "../models/MedicalRecords.js";
import Medication from "../models/Medication.js";

const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(400).json({
                message: "Search query is required",
            });
        }

        const searchRegex = new RegExp(q.trim(), "i");

        const [residents, medicalRecords, medications] =
            await Promise.all([
                Resident.find({
                    createdBy: req.user._id,
                    $or: [
                        { name: searchRegex },
                        { roomNumber: searchRegex },
                        { primaryCondition: searchRegex },
                        { allergies: searchRegex },
                    ],
                })
                    .select(
                        "name age roomNumber bloodType allergies primaryCondition"
                    )
                    .limit(10),

                MedicalRecords.find({
                    createdBy: req.user._id,
                    $or: [
                        { title: searchRegex },
                        { description: searchRegex },
                        { category: searchRegex },
                    ],
                })
                    .populate(
                        "resident",
                        "name roomNumber"
                    )
                    .select(
                        "title category recordDate resident"
                    )
                    .limit(10),

                Medication.find({
                    createdBy: req.user._id,
                    $or: [
                        { name: searchRegex },
                        { dosage: searchRegex },
                        { prescribedBy: searchRegex },
                    ],
                })
                    .populate(
                        "resident",
                        "name roomNumber"
                    )
                    .select(
                        "name dosage frequency status resident"
                    )
                    .limit(10),
            ]);

        return res.status(200).json({
            query: q,
            results: {
                residents,
                medicalRecords,
                medications,
            },
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export {
    globalSearch,
};