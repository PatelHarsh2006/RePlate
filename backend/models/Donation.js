
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  deliveryVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  donorName: { type: String, required: true, trim: true },
  donorType: {
    type: String,
    required: true,
    enum: ["household", "restaurant", "tiffin", "event", "other"]
  },
  foodType: {
    type: String,
    required: true,
    enum: ["cooked-meals", "packaged", "fruits-vegetables", "bakery", "other"]
  },
  foodQuantity: { type: Number, required: true, min: 1 },
  quantityUnit: {
    type: String,
    required: true,
    enum: ["servings", "kg", "packets", "boxes"]
  },
  pickupAddress: { type: String, required: true, trim: true },
  pickupLandmark: { type: String, default: "", trim: true },
  pickupLocation: {
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
        message: "Invalid pickup coordinates"
      }
    }
  },
  availabilityStart: {
    type: Date,
    required: true
  },
  availabilityEnd: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return !this.availabilityStart || value > this.availabilityStart;
      },
      message: "Availability end must be after availability start"
    }
  },
  donorPhone: { type: String, required: true, trim: true },
  foodNotes: { type: String, default: "", trim: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "collected", "completed", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

donationSchema.index({ pickupLocation: "2dsphere" });
donationSchema.index({ status: 1, availabilityStart: 1, availabilityEnd: 1 });

module.exports = mongoose.model("Donation", donationSchema);
