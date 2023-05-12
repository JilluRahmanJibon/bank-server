const ContactInfo = require("../models/contactInfo.model");

exports.contactInfoService = async (contactInfo) => {
    const contact = await ContactInfo.create(contactInfo);
    return contact;
}