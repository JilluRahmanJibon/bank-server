
const {
    transtionService
} = require("../service/transtion.service");

exports.transtion = async (req,res) =>{ 
try{
    const transtion = await transtionService(req.body);
    res.status(200).json({
        status:"sucess",
        message:"Successfully"
    });
} catch(error){
    console.log(error);
        res.status(500).json({
            status:"failed",
            error,
        });
    }

}
