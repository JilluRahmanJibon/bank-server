const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide your username"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      validate: [validator.isEmail, "please provide a valid email"],
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "phone number address is required"],
    },
    trx: {
      type: Number,
      unique: true,
      required: [true, "provide this user TRX number"],
    },
    balance: {
      type: Number,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      // validate: [validator.isStrongPassword, { message: "password {VALUE} is not strong enough." }],
    },
    address: {
      type: String,
      required: [true, "provide your present address."],
    },
    company: {
      type: String,
      required: [true, "provide your company or shop name."]
    },

    companyAddress: {
      type: String,
      required: [true, "provide your company or shop address."]
    },
    companyCity: {
      type: String,
      required: [true, "provide your company or shop city."]
    },
    role: {
      type: String,
      enum: ["user", "admin", "stuff"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  const password = this.password;
  const hashedPassword = bcrypt.hashSync(password);
  this.password = hashedPassword;
  this.confirmPassword = undefined;

  next();
});


userSchema.methods.comparePassword = function (password, hash) {
  console.log(password);
  const isPasswordValid = bcrypt.compareSync(password, hash);
  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
