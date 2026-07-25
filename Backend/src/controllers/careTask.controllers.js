import mongoose from "mongoose";

import CareTask from "../models/CareTask.js";
import Resident from "../models/Resident.js";

const addCareTask = async (req, res) => {
    try {
        const {
            resident,
            title,
            notes,
            scheduledTime,
            date,
        } = req.body;

        if (!resident || !title?.trim() || !date) {
            return res.status(400).json({
                message:
                    "Resident, title, and date are required",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                resident
            )
        ) {
            return res.status(400).json({
                message: "Invalid resident ID",
            });
        }

        const residentExists =
            await Resident.findOne({
                _id: resident,
                createdBy: req.user._id,
            });

        if (!residentExists) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const taskDate = new Date(date);

        if (
            Number.isNaN(
                taskDate.getTime()
            )
        ) {
            return res.status(400).json({
                message: "Invalid task date",
            });
        }

        const task = await CareTask.create({
            resident,
            createdBy: req.user._id,
            title: title.trim(),
            notes: notes?.trim() || "",
            scheduledTime:
                scheduledTime?.trim() || "",
            date: taskDate,
        });

        return res.status(201).json({
            message:
                "Care task added successfully",
            task,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const getResidentCareTasks = async (
    req,
    res
) => {
    try {
        const { residentId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                residentId
            )
        ) {
            return res.status(400).json({
                message: "Invalid resident ID",
            });
        }

        const resident =
            await Resident.findOne({
                _id: residentId,
                createdBy: req.user._id,
            });

        if (!resident) {
            return res.status(404).json({
                message: "Resident not found",
            });
        }

        const query = {
            resident: residentId,
            createdBy: req.user._id,
        };

        if (req.query.date) {
            const selectedDate =
                new Date(req.query.date);

            if (
                Number.isNaN(
                    selectedDate.getTime()
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid date query",
                });
            }

            const startOfDay =
                new Date(selectedDate);

            startOfDay.setHours(
                0,
                0,
                0,
                0
            );

            const endOfDay =
                new Date(selectedDate);

            endOfDay.setHours(
                23,
                59,
                59,
                999
            );

            query.date = {
                $gte: startOfDay,
                $lte: endOfDay,
            };
        }

        const tasks =
            await CareTask.find(query).sort({
                date: 1,
                scheduledTime: 1,
                createdAt: 1,
            });

        return res.status(200).json({
            tasks,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const updateCareTask = async (
    req,
    res
) => {
    try {
        const { taskId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                taskId
            )
        ) {
            return res.status(400).json({
                message: "Invalid task ID",
            });
        }

        const task =
            await CareTask.findOne({
                _id: taskId,
                createdBy: req.user._id,
            });

        if (!task) {
            return res.status(404).json({
                message:
                    "Care task not found",
            });
        }

        const {
            title,
            notes,
            scheduledTime,
            date,
        } = req.body;

        if (
            title !== undefined &&
            !title.trim()
        ) {
            return res.status(400).json({
                message:
                    "Task title cannot be empty",
            });
        }

        if (date !== undefined) {
            const taskDate =
                new Date(date);

            if (
                Number.isNaN(
                    taskDate.getTime()
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid task date",
                });
            }

            task.date = taskDate;
        }

        if (title !== undefined) {
            task.title = title.trim();
        }

        if (notes !== undefined) {
            task.notes =
                notes.trim();
        }

        if (
            scheduledTime !== undefined
        ) {
            task.scheduledTime =
                scheduledTime.trim();
        }

        await task.save();

        return res.status(200).json({
            message:
                "Care task updated successfully",
            task,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const toggleCareTask = async (
    req,
    res
) => {
    try {
        const { taskId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                taskId
            )
        ) {
            return res.status(400).json({
                message: "Invalid task ID",
            });
        }

        const task =
            await CareTask.findOne({
                _id: taskId,
                createdBy: req.user._id,
            });

        if (!task) {
            return res.status(404).json({
                message:
                    "Care task not found",
            });
        }

        task.isCompleted =
            !task.isCompleted;

        task.completedAt =
            task.isCompleted
                ? new Date()
                : null;

        await task.save();

        return res.status(200).json({
            message: task.isCompleted
                ? "Care task completed"
                : "Care task marked as pending",
            task,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const deleteCareTask = async (
    req,
    res
) => {
    try {
        const { taskId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                taskId
            )
        ) {
            return res.status(400).json({
                message: "Invalid task ID",
            });
        }

        const task =
            await CareTask.findOneAndDelete({
                _id: taskId,
                createdBy: req.user._id,
            });

        if (!task) {
            return res.status(404).json({
                message:
                    "Care task not found",
            });
        }

        return res.status(200).json({
            message:
                "Care task deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export {
    addCareTask,
    getResidentCareTasks,
    updateCareTask,
    toggleCareTask,
    deleteCareTask,
};