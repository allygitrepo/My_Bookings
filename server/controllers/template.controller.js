const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const TemplateProject = require("../models/templateProject.model");

const BASE_TEMPLATES_DIR = "C:\\xampp\\htdocs\\My_Bookings_Templates";
const BASE_HTDOCS_DIR = "C:\\xampp\\htdocs";

// Helper to copy directory recursively
const copyFolderRecursiveSync = (source, target) => {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    if (fs.lstatSync(source).isDirectory()) {
        const files = fs.readdirSync(source);
        files.forEach((file) => {
            const curSource = path.join(source, file);
            const curTarget = path.join(target, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, curTarget);
            } else {
                fs.copyFileSync(curSource, curTarget);
            }
        });
    }
};

// Helper to crawl directory recursively to discover icons/logos
const findIcon = (dir, basePath = dir) => {
    try {
        const files = fs.readdirSync(dir);
        // Look for exact matches first
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (!stat.isDirectory()) {
                const name = file.toLowerCase();
                if (name === "logo.png" || name === "logo.svg" || name === "favicon.png" || name === "favicon.ico" || name === "favicon.svg") {
                    return path.relative(basePath, fullPath).replace(/\\/g, "/");
                }
            }
        }
        // Recursive fallback
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                const found = findIcon(fullPath, basePath);
                if (found) return found;
            } else {
                const name = file.toLowerCase();
                if (name.includes("logo") || name.includes("favicon")) {
                    if (name.endsWith(".png") || name.endsWith(".svg") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".ico")) {
                        return path.relative(basePath, fullPath).replace(/\\/g, "/");
                    }
                }
            }
        }
    } catch (e) {
        console.error("[Template Crawler] Error scanning directory for icon:", e);
    }
    return null;
};

// Helper to flatten zip files containing a single parent folder
const flattenExtractedFolder = (dir) => {
    try {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir).filter(item => item !== "__MACOSX" && item !== ".DS_Store");
        // If there's exactly one item and it's a directory
        if (items.length === 1) {
            const singlePath = path.join(dir, items[0]);
            if (fs.statSync(singlePath).isDirectory()) {
                console.log(`[ZIP Flattening] Single root directory detected: ${items[0]}. Flattening ${dir}...`);
                const subItems = fs.readdirSync(singlePath);
                subItems.forEach((subItem) => {
                    const src = path.join(singlePath, subItem);
                    const dest = path.join(dir, subItem);
                    fs.renameSync(src, dest);
                });
                fs.rmdirSync(singlePath);
                // Run recursively just in case there's another level nested
                flattenExtractedFolder(dir);
            }
        }
    } catch (e) {
        console.error("[ZIP Flattening] Error flattening directory:", e);
    }
};

// Helper to inject the global booking widget script tag recursively into html/php files
const injectWidgetScript = (dir, businessId) => {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        
        // Excluded folders from recursion to prevent contaminating backend code
        const skipFolders = ["node_modules", ".git", ".github", "server", "controllers", "models", "routes", "config", "database", "helpers", "vendor"];
        
        files.forEach((file) => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (!skipFolders.includes(file.toLowerCase())) {
                    injectWidgetScript(fullPath, businessId);
                }
            } else {
                const ext = path.extname(file).toLowerCase();
                if (ext === ".html" || ext === ".php") {
                    let content = fs.readFileSync(fullPath, "utf8");
                    
                    // Smart check: Only inject into PHP files if they contain standard HTML/web structure.
                    // This prevents injecting into pure backend API/DB scripts.
                    if (ext === ".php") {
                        const hasHTML = /<\/head>|<\/body>|<\/html>|<html/i.test(content);
                        if (!hasHTML) {
                            return; // skip pure backend script
                        }
                    }

                    // Check if already injected to prevent duplicates
                    if (!content.includes("mybookings.allysoftsolutions.com/widget.js")) {
                        console.log(`[Script Injection] Found target file for injection: ${fullPath}`);
                        const scriptTag = `\n<!-- Platform Booking Widget Script Injected -->\n<script src="https://mybookings.allysoftsolutions.com/widget.js" data-business-id="${businessId}" data-theme="light" async></script>\n`;
                        
                        if (content.includes("</head>")) {
                            content = content.replace("</head>", `${scriptTag}</head>`);
                        } else if (content.includes("</body>")) {
                            content = content.replace("</body>", `${scriptTag}</body>`);
                        } else {
                            content += scriptTag;
                        }
                        fs.writeFileSync(fullPath, content, "utf8");
                        console.log(`[Script Injection] Injected successfully into ${file}`);
                    }
                }
            }
        });
    } catch (err) {
        console.error("[Script Injection] Error during widget script injection:", err);
    }
};

// Helper to rewrite absolute template base URLs in cloned assets/html/js/css to point to the active subfolder
const fixBaseUrlPaths = (dir, prefixes, targetPrefix) => {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (file !== "node_modules" && file !== ".git" && file !== ".github") {
                    fixBaseUrlPaths(fullPath, prefixes, targetPrefix);
                }
            } else {
                const ext = path.extname(file).toLowerCase();
                const textExtensions = [".html", ".php", ".js", ".css", ".json", ".htaccess", ".txt", ".xml"];
                if (textExtensions.includes(ext) || file === ".htaccess") {
                    let content = fs.readFileSync(fullPath, "utf8");
                    let modified = false;

                    prefixes.forEach((prefix) => {
                        // Regex to match prefix at the beginning of paths, e.g. /prefix/ or /prefix" or /prefix'
                        const regex = new RegExp('\\/' + prefix + '(?=[\\/"\'])', 'g');
                        if (regex.test(content)) {
                            content = content.replace(regex, `/${targetPrefix}`);
                            modified = true;
                        }
                    });

                    if (modified) {
                        fs.writeFileSync(fullPath, content, "utf8");
                        console.log(`[Path Auto-Fix] Updated paths in file: ${fullPath}`);
                    }
                }
            }
        });
    } catch (err) {
        console.error("[Path Auto-Fix] Error running path fix recursive:", err);
    }
};

const detectAndFixAssetsPaths = (targetPath, templateId, businessId) => {
    try {
        if (!fs.existsSync(targetPath)) return;
        const targetPrefix = `${templateId}_biz_${businessId}`;

        // Find prefix in index.html or index.php
        let indexPath = path.join(targetPath, "index.html");
        if (!fs.existsSync(indexPath)) {
            indexPath = path.join(targetPath, "index.php");
        }

        let originalPrefixes = [];
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, "utf8");
            // Match things like src="/PREFIX/assets/..." or href="/PREFIX/assets/..." or href="/PREFIX/favicon.svg"
            const match = content.match(/(?:href|src)=["']\/([a-zA-Z0-9_-]+)\/(?:assets|favicon|logo|icons|js|css)/i);
            if (match && match[1]) {
                const detected = match[1];
                originalPrefixes.push(detected);
                console.log(`[Path Auto-Fix] Detected base prefix in HTML: ${detected}`);
            }
        }

        // Also always fallback/include "DRP_Doctor" and templateId to be absolutely robust
        if (!originalPrefixes.includes("DRP_Doctor")) {
            originalPrefixes.push("DRP_Doctor");
        }
        if (!originalPrefixes.includes(templateId)) {
            originalPrefixes.push(templateId);
        }

        console.log(`[Path Auto-Fix] Running rewrite in ${targetPath} replacing prefixes: ${JSON.stringify(originalPrefixes)} with: ${targetPrefix}`);
        fixBaseUrlPaths(targetPath, originalPrefixes, targetPrefix);
    } catch (err) {
        console.error("[Path Auto-Fix] Error detecting asset paths:", err);
    }
};

const templateController = {
    // Initialize & sync existing templates
    initTemplates: async () => {
        try {
            console.log("[Templates Setup] Checking for nested template folders to flatten...");
            const templates = await TemplateProject.findAll();
            for (const template of templates) {
                const dir = template.path;
                if (fs.existsSync(dir)) {
                    flattenExtractedFolder(dir);
                    const discoveredIcon = findIcon(dir);
                    const iconUrlPath = discoveredIcon ? `/My_Bookings_Templates/${template.id}/${discoveredIcon}` : null;
                    if (iconUrlPath !== template.icon) {
                        await template.update({ icon: iconUrlPath });
                        console.log(`[Templates Setup] Updated icon path for template '${template.id}' to: ${iconUrlPath}`);
                    }
                }
            }
            console.log("[Templates Setup] Template flattening check complete.");
        } catch (err) {
            console.error("[Templates Setup] Error during templates initialization:", err);
        }
    },

    // Clone template helper
    cloneTemplateForBusiness: async (templateId, businessId) => {
        try {
            const sourcePath = path.join(BASE_TEMPLATES_DIR, templateId);
            const targetPath = path.join(BASE_HTDOCS_DIR, `${templateId}_biz_${businessId}`);

            if (!fs.existsSync(sourcePath)) {
                throw new Error(`Template source path does not exist: ${sourcePath}`);
            }

            if (fs.existsSync(targetPath)) {
                console.log(`[Template Cloning] Template already cloned for business ${businessId}, skipping clone but verifying script injection & path fixes.`);
                injectWidgetScript(targetPath, businessId);
                detectAndFixAssetsPaths(targetPath, templateId, businessId);
                return true;
            }

            console.log(`[Template Cloning] Cloning ${sourcePath} to ${targetPath}`);
            copyFolderRecursiveSync(sourcePath, targetPath);
            console.log(`[Template Cloning] Running automatic booking widget script injection...`);
            injectWidgetScript(targetPath, businessId);
            console.log(`[Template Cloning] Running automatic path rewrite fixes...`);
            detectAndFixAssetsPaths(targetPath, templateId, businessId);
            console.log(`[Template Cloning] Cloning and processing successful for business ${businessId}`);
            return true;
        } catch (error) {
            console.error(`[Template Cloning] Error cloning template:`, error);
            throw error;
        }
    },

    // GET /mybookings/templates/active (Client / Business User Panel)
    getActiveTemplates: async (req, res) => {
        try {
            const customTemplates = await TemplateProject.findAll({
                where: { isActive: true }
            });

            // Format custom templates to match the client-side template structure expectation
            const formattedCustom = customTemplates.map((t) => ({
                id: t.id,
                displayName: t.displayName,
                category: t.category,
                icon: t.icon ? `${process.env.APACHE_BASE_URL || "http://localhost:8080"}${t.icon}` : null,
                isCustom: true,
                isActive: t.isActive
            }));

            res.json({
                success: true,
                message: "Active templates fetched successfully",
                data: formattedCustom
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // GET /mybookings/templates/portal (Super Admin Template Panel)
    portalGetTemplates: async (req, res) => {
        try {
            const templates = await TemplateProject.findAll();
            res.json({
                success: true,
                message: "All templates fetched successfully",
                data: templates
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // POST /mybookings/templates/portal/deploy (Super Admin protected ZIP deployment)
    portalDeployTemplate: async (req, res) => {
        try {
            const { displayName, category } = req.body;
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Please upload a ZIP template file." });
            }
            if (!displayName || !category) {
                // Delete the uploaded temporary zip file if validation fails
                if (req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ success: false, message: "Template display name and category are required." });
            }

            // Generate template ID slug
            const templateId = displayName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/(^_+|_+$)/g, "");

            // Verify if template already exists
            const existing = await TemplateProject.findByPk(templateId);
            if (existing) {
                if (req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ success: false, message: `A template with ID '${templateId}' (derived from '${displayName}') already exists.` });
            }

            const extractPath = path.join(BASE_TEMPLATES_DIR, templateId);
            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }

            // Extract ZIP
            console.log(`[ZIP Extraction] Extracting ${req.file.path} to ${extractPath}`);
            const zip = new AdmZip(req.file.path);
            zip.extractAllTo(extractPath, true);

            // Clean up temporary ZIP file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            // Flatten the folder structure if zipped as a single root-level folder
            flattenExtractedFolder(extractPath);

            // Crawl folder to discover favicon or logo
            const discoveredIcon = findIcon(extractPath);
            const iconUrlPath = discoveredIcon ? `/My_Bookings_Templates/${templateId}/${discoveredIcon}` : null;

            // Create template entry in MySQL
            const template = await TemplateProject.create({
                id: templateId,
                displayName,
                category,
                path: extractPath,
                icon: iconUrlPath,
                isActive: true
            });

            res.status(201).json({
                success: true,
                message: "Template uploaded and deployed successfully",
                data: template
            });
        } catch (error) {
            // Cleanup zip if still exists
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) {}
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // DELETE /mybookings/templates/portal/:id (Super Admin protected purge)
    portalDeleteTemplate: async (req, res) => {
        try {
            const { id } = req.params;
            const template = await TemplateProject.findByPk(id);
            if (!template) {
                return res.status(404).json({ success: false, message: "Template not found." });
            }

            // Remove folder recursively
            const templatePath = template.path || path.join(BASE_TEMPLATES_DIR, id);
            if (fs.existsSync(templatePath)) {
                console.log(`[Template Deletion] Purging folder recursively: ${templatePath}`);
                fs.rmSync(templatePath, { recursive: true, force: true });
            }

            // Delete DB record
            await template.destroy();

            res.json({
                success: true,
                message: "Template deleted and completely purged from storage."
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = templateController;
