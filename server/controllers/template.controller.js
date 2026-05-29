const Template = require("../models/template.model");

const templateController = {
    getAll: async (req, res) => {
        try {
            const templates = await Template.findAll({
                order: [['created_at', 'DESC']]
            });
            res.json({ success: true, data: templates });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    uploadZip: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Please upload a ZIP file." });
            }
            res.json({
                success: true,
                message: "ZIP template uploaded successfully to temporary storage.",
                file: {
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    size: req.file.size,
                    path: req.file.path
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = templateController;
