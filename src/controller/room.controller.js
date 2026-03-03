import Room from "../models/room.model.js";

// Get all rooms
export const getRooms = async (req, res, next) => {
    try {
        const allRooms = await Room.findAll();

        return res.status(200).json({
            message: "Rooms fetched successfully",
            data: allRooms
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};

// Get room by ID
export const getRoomById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const room = await Room.findByPk(id);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        return res.status(200).json({
            message: "Room fetched successfully",
            data: room
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};

// Create new room
export const createRoom = async (req, res, next) => {
    try {
        const { roomNumber, floorNumber, capacity, gender } = req.body;

        // Check if room already exists
        const existingRoom = await Room.findOne({
            where: {
                RoomNumber: roomNumber,
                FloorNumber: floorNumber
            }
        });

        if (existingRoom) {
            return res.status(409).json({
                message: "Room already exists"
            });
        }

        const newRoom = await Room.create({
            RoomNumber: roomNumber,
            FloorNumber: floorNumber,
            Capacity: capacity || 4,
            CurrentOccupancy: 0,
            Status: 'available',
            Gender: gender
        });

        return res.status(201).json({
            message: "Room created successfully",
            data: newRoom
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create room",
            error: error.message
        });
    }
};

// Update room
export const updateRoom = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { roomNumber, floorNumber, capacity, currentOccupancy, status, gender } = req.body;

        const room = await Room.findByPk(id);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        await room.update({
            RoomNumber: roomNumber || room.RoomNumber,
            FloorNumber: floorNumber || room.FloorNumber,
            Capacity: capacity || room.Capacity,
            CurrentOccupancy: currentOccupancy !== undefined ? currentOccupancy : room.CurrentOccupancy,
            Status: status || room.Status,
            Gender: gender || room.Gender
        });

        return res.status(200).json({
            message: "Room updated successfully",
            data: room
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update room",
            error: error.message
        });
    }
};

// Delete room
export const deleteRoom = async (req, res, next) => {
    try {
        const { id } = req.params;

        const room = await Room.findByPk(id);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Check if room is occupied
        if (room.CurrentOccupancy > 0) {
            return res.status(400).json({
                message: "Cannot delete occupied room"
            });
        }

        await room.destroy();

        return res.status(200).json({
            message: "Room deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete room",
            error: error.message
        });
    }
};

// Get available rooms
export const getAvailableRooms = async (req, res, next) => {
    try {
        const availableRooms = await Room.findAll({
            where: {
                Status: 'available'
            }
        });

        return res.status(200).json({
            message: "Available rooms fetched successfully",
            data: availableRooms
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};
