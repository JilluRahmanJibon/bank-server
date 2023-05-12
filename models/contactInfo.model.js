const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const contactInfoSchema = mongoose.Schema(
    {
        address: {
            type: String,
            required: [true, "Please provide your method"],

        },
        email: {
            type: String,
            required: [true, "Service type required"],

        },
        number: {
            type: String,
            required: [true, "Customer name required"],

        },


    },
    { timestamps: true }
);

contactInfoSchema.pre("save", function (next) {
    next();
});

const ContactInfo = mongoose.model("contactInfo", contactInfoSchema);
module.exports = ContactInfo;

