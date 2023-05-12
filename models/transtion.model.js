const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const transtionSchema = mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      required: [true, "Please provide your method"],
   
    },
    serviceType: {
      type: String,
      required: [true, "Service type required"],
    
    },
    customerName: {
      type: String,
      required: [true, "Customer name required"],
    
    },
    recipientName: {
      type: String,
      required: [true, "Receipient name required"],
    },
    amount: {
      type: Number,
      required: [true, "Service type required"],
    
      
    },
    
  },
  { timestamps: true }
);

transtionSchema.pre("save", function (next) {
  const amount = this.amount;
  next();
});

const Transtion = mongoose.model("transtion", transtionSchema);
module.exports = Transtion;


