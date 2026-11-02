
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  donations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation",
    required: true
  }],
  startLocation: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (coordinates) {
          return coordinates.length === 2 &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90;
        },
        message: "Invalid volunteer starting coordinates"
      }
    }
  },
  optimizedOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation"
  }],
  routeGeometry: {
    type: {
      type: String,
      enum: ["LineString"],
      default: "LineString"
    },
    coordinates: {
      type: [[Number]],
      default: []
    }
  },
  totalDistance: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 0
  },
  routeSource: {
    type: String,
    enum: ["OSRM", "fallback"],
    required: true
  },
  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active"
  },
  acceptedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Trip", tripSchema);
