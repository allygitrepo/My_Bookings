const Template = require("../models/template.model");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// GoDaddy Extractor configurations
const EXTRACTOR_URL = process.env.EXTRACTOR_URL || "http://localhost/My_Bookings/server/public/extractor.php";
const EXTRACTOR_TOKEN = process.env.WA_MITRA_MASTER_TOKEN || "mitra_6fdfa3eee71f09da3943de949f6e138746325f10ddded706";

const templateController = {
    getAll: async (req, res) => {
        try {
            const templates = await Template.findAll({
                order: [['created_at', 'DESC']]
            });
            // Map each template to include 'id' field for frontend compatibility
            const mappedTemplates = templates.map(t => {
                const data = t.toJSON();
                return {
                    ...data,
                    id: data.template_id
                };
            });
            res.json({ success: true, data: mappedTemplates });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    uploadZip: async (req, res) => {
        let tempFilePath = null;
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Please upload a ZIP file." });
            }
            tempFilePath = req.file.path;

            const { name, category, version } = req.body;
            if (!name) {
                return res.status(400).json({ success: false, message: "Template name is required." });
            }

            // Generate a clean template_id from name
            const templateId = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');

            if (!templateId) {
                return res.status(400).json({ success: false, message: "Invalid template name for ID generation." });
            }

            // Check if template already exists in registry
            const existingTemplate = await Template.findOne({ where: { template_id: templateId } });
            if (existingTemplate) {
                return res.status(400).json({ success: false, message: `Template with ID '${templateId}' already exists.` });
            }

            // Read temporary ZIP file
            const fileBuffer = fs.readFileSync(tempFilePath);
            const blob = new Blob([fileBuffer], { type: 'application/zip' });

            // Create multipart Form-Data
            const formData = new FormData();
            formData.append('templateZip', blob, req.file.originalname);
            formData.append('template_id', templateId);
            formData.append('action', 'upload');

            // Dispatch multipart POST request to GoDaddy Extractor Script
            const response = await axios.post(EXTRACTOR_URL, formData, {
                headers: {
                    'X-Extractor-Token': EXTRACTOR_TOKEN
                }
            });

            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || "Failed to extract ZIP via GoDaddy extractor script.");
            }

            // Construct template path relative to public directory
            const templatePath = `templates/${templateId}`;

            // Save new template registration entry in MySQL database
            const newTemplate = await Template.create({
                template_id: templateId,
                name: name,
                path: templatePath,
                category: category || 'website',
                version: version || '1.0.0',
                is_external: true
            });

            res.json({
                success: true,
                message: "ZIP template deployed, extracted, and registered successfully.",
                data: {
                    ...newTemplate.toJSON(),
                    id: newTemplate.template_id // compatibility mapping
                }
            });
        } catch (error) {
            console.error("ZIP Deployment Error:", error);
            res.status(500).json({
                success: false,
                message: error.response?.data?.message || error.message || "Internal server error during template deployment."
            });
        } finally {
            // Clean up temporary upload file if it exists
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (unlinkErr) {
                    console.error("Failed to clean up temporary ZIP file:", unlinkErr);
                }
            }
        }
    },

    deleteTemplate: async (req, res) => {
        const { templateId } = req.params;
        try {
            const template = await Template.findOne({ where: { template_id: templateId } });
            if (!template) {
                return res.status(404).json({ success: false, message: 'Template not found.' });
            }

            // Tell the extractor to delete the folder (best-effort, not blocking)
            try {
                const formData = new FormData();
                formData.append('action', 'delete');
                formData.append('template_id', templateId);
                await axios.post(EXTRACTOR_URL, formData, {
                    headers: { 'X-Extractor-Token': EXTRACTOR_TOKEN }
                });
            } catch (extractErr) {
                console.warn('Extractor delete warning (non-fatal):', extractErr.message);
            }

            // Delete DB record
            await template.destroy();

            res.json({ success: true, message: `Template '${templateId}' deleted successfully.` });
        } catch (error) {
            console.error('Delete Template Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateTemplate: async (req, res) => {
        const { templateId } = req.params;
        const { name, category, version } = req.body;
        try {
            const template = await Template.findOne({ where: { template_id: templateId } });
            if (!template) {
                return res.status(404).json({ success: false, message: 'Template not found.' });
            }

            if (name !== undefined) template.name = name;
            if (category !== undefined) template.category = category;
            if (version !== undefined) template.version = version;
            template.updated_at = new Date();
            await template.save();

            const data = template.toJSON();
            res.json({ success: true, message: 'Template updated successfully.', data: { ...data, id: data.template_id } });
        } catch (error) {
            console.error('Update Template Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = templateController;
