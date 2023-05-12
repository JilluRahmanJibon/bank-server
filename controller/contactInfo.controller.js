
const {
    contactInfoService
} = require("../service/contactInfo.service");

exports.contactInfo = async (req, res) => {
    try {
        const contactInfo = await contactInfoService(req.body);
        res.status(200).json({
            status: "sucess",
            message: "Successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "failed",
            error,
        });
    }

}