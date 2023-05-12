const Transtion = require("../models/transtion.model");

exports.transtionService = async(transtionInfo) =>{
    const transtion = await Transtion.create(transtionInfo);
    return transtion;
  }