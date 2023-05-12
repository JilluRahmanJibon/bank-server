exports.fileUpload = async (req, res) => {
    try {
      res.json({
        status: "success",
        url: `${process.env.multer_url}/${req.file.filename}`,
      });
    } catch (err) {}
  };
  exports.multiFileUploads = async (req, res) => {
    try {
      const imageUrl = [];
      req.files.forEach((img) => {
        imageUrl.push(`${process.env.multer_url}/${img.filename}`);
      });
      res.status(200).json({
        status: "success",
        imageURLs: imageUrl,
      });
    } catch (err) {}
  };