const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const TemplateProject = require("../models/templateProject.model");

const BASE_TEMPLATES_DIR = path.join(__dirname, "..", "Templates");
const BASE_HTDOCS_DIR = "C:\\xampp\\htdocs";

const getApiBaseUrl = () =>
    (process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, "");

const resolveTemplateIconUrl = (iconPath) => {
    if (!iconPath) return null;
    if (iconPath.startsWith("http://") || iconPath.startsWith("https://")) return iconPath;
    const path = iconPath.startsWith("/") ? iconPath : `/${iconPath}`;
    return `${getApiBaseUrl()}${path}`;
};

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

// Helper to sleep synchronously in Node
const sleepSync = (ms) => {
    try {
        const sab = new SharedArrayBuffer(1024);
        const int32 = new Int32Array(sab);
        Atomics.wait(int32, 0, 0, ms);
    } catch (e) {
        const start = Date.now();
        while (Date.now() - start < ms) { }
    }
};

// Helper to rename a file/folder with retry and fallback to recursive copy/delete on Windows EPERM/EBUSY locking issues
const renameWithRetrySync = (src, dest, retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            if (fs.existsSync(dest)) {
                const statSrc = fs.statSync(src);
                const statDest = fs.statSync(dest);
                if (statSrc.isDirectory() && statDest.isDirectory()) {
                    copyFolderRecursiveSync(src, dest);
                    fs.rmSync(src, { recursive: true, force: true });
                    return;
                } else {
                    fs.rmSync(dest, { recursive: true, force: true });
                }
            }
            fs.renameSync(src, dest);
            return;
        } catch (err) {
            if (err.code === 'EPERM' || err.code === 'EBUSY') {
                console.warn(`[Rename Warning] ${src} locked, retrying (${i + 1}/${retries})...`);
                sleepSync(150);
            } else {
                throw err;
            }
        }
    }
    // Final fallback
    console.log(`[Rename Fallback] EPERM copy-and-delete fallback: ${src} -> ${dest}`);
    copyFolderRecursiveSync(src, dest);
    fs.rmSync(src, { recursive: true, force: true });
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
                    renameWithRetrySync(src, dest);
                });
                try {
                    fs.rmdirSync(singlePath);
                } catch (e) {
                    fs.rmSync(singlePath, { recursive: true, force: true });
                }
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
            console.log("[Templates Setup] Scanning server/Templates for active templates...");
            // Ensure server/Templates directory exists
            if (!fs.existsSync(BASE_TEMPLATES_DIR)) {
                fs.mkdirSync(BASE_TEMPLATES_DIR, { recursive: true });
            }

            // Find all directories in server/Templates
            const templateDirs = fs.readdirSync(BASE_TEMPLATES_DIR).filter(file => {
                const fullPath = path.join(BASE_TEMPLATES_DIR, file);
                return fs.statSync(fullPath).isDirectory();
            });

            for (const dirName of templateDirs) {
                const dirPath = path.join(BASE_TEMPLATES_DIR, dirName);
                flattenExtractedFolder(dirPath);
                const discoveredIcon = findIcon(dirPath);
                const iconUrlPath = discoveredIcon ? `/My_Bookings_Templates/${dirName}/${discoveredIcon}` : null;

                // Check if this template already exists in the database
                let templateRecord = await TemplateProject.findOne({ where: { templateId: dirName } });
                if (!templateRecord) {
                    // Try to generate a display name from the folder name
                    const displayName = dirName
                        .split("_")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");

                    // Auto-seed into DB
                    const templateType = dirName.toLowerCase().includes("portfolio") ? "portfolio" : "website";
                    templateRecord = await TemplateProject.create({
                        id: dirName,
                        templateId: dirName,
                        displayName: displayName,
                        category: "Healthcare / Hospital", // Default category or can be customized
                        type: templateType,
                        path: dirPath,
                        icon: iconUrlPath,
                        isActive: true
                    });
                    console.log(`[Templates Setup] Auto-seeded template '${dirName}' into database as '${templateType}'.`);
                } else {
                    // Update paths, icons, and type to make sure they are dynamic and up-to-date
                    let updated = false;
                    if (templateRecord.path !== dirPath) {
                        templateRecord.path = dirPath;
                        updated = true;
                    }
                    if (templateRecord.icon !== iconUrlPath) {
                        templateRecord.icon = iconUrlPath;
                        updated = true;
                    }
                    const templateType = dirName.toLowerCase().includes("portfolio") ? "portfolio" : "website";
                    if (!templateRecord.type || templateRecord.type !== templateType) {
                        templateRecord.type = templateType;
                        updated = true;
                    }
                    if (updated) {
                        await templateRecord.save();
                        console.log(`[Templates Setup] Updated template metadata for '${dirName}'.`);
                    }
                }
            }

            console.log("[Templates Setup] Template initialization and seeding complete.");
        } catch (err) {
            console.error("[Templates Setup] Error during templates initialization:", err);
        }
    },

    // Clone template helper
    cloneTemplateForBusiness: async (templateIdOrSlug, businessId) => {
        try {
            // Find template by either primary key (if integer) or templateId (slug)
            let template = await TemplateProject.findByPk(templateIdOrSlug);
            if (!template) {
                template = await TemplateProject.findOne({ where: { templateId: templateIdOrSlug } });
            }

            if (!template) {
                throw new Error(`Template not found for: ${templateIdOrSlug}`);
            }

            const slug = template.templateId; // e.g. "doctor_drp_portfolio"
            const sourcePath = template.path;
            const targetPath = path.join(BASE_HTDOCS_DIR, `${slug}_biz_${businessId}`);

            if (!fs.existsSync(sourcePath)) {
                throw new Error(`Template source path does not exist: ${sourcePath}`);
            }

            if (fs.existsSync(targetPath)) {
                console.log(`[Template Cloning] Template already cloned for business ${businessId}, skipping clone but verifying script injection & path fixes.`);
                injectWidgetScript(targetPath, businessId);
                detectAndFixAssetsPaths(targetPath, slug, businessId);
                return true;
            }

            console.log(`[Template Cloning] Cloning ${sourcePath} to ${targetPath}`);
            copyFolderRecursiveSync(sourcePath, targetPath);
            console.log(`[Template Cloning] Running automatic booking widget script injection...`);
            injectWidgetScript(targetPath, businessId);
            console.log(`[Template Cloning] Running automatic path rewrite fixes...`);
            detectAndFixAssetsPaths(targetPath, slug, businessId);
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

            // Automatically clone active templates for the user's businesses in the background to ensure previews don't 404
            if (req.user && req.user.user_id) {
                (async () => {
                    try {
                        const Business = require("../models/business.model");
                        const businesses = await Business.findAll({ where: { user_id: req.user.user_id } });
                        for (const biz of businesses) {
                            for (const t of customTemplates) {
                                try {
                                    await templateController.cloneTemplateForBusiness(t.templateId, biz.id);
                                } catch (cloneErr) {
                                    console.error(`[Pre-Cloning] Failed to clone template ${t.templateId} for business ${biz.id}:`, cloneErr);
                                }
                            }
                        }
                    } catch (dbErr) {
                        console.error("[Pre-Cloning] Error fetching businesses for pre-cloning:", dbErr);
                    }
                })();
            }

            // Format custom templates to match the client-side template structure expectation
            const formattedCustom = customTemplates.map((t) => ({
                id: t.templateId, // Keep returning the slug as id for frontend iframe src compatibility!
                displayName: t.displayName,
                category: t.category,
                type: t.type || 'website',
                icon: resolveTemplateIconUrl(t.icon),
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
            const formatted = templates.map((t) => {
                const row = t.toJSON ? t.toJSON() : t;
                return { ...row, icon: resolveTemplateIconUrl(row.icon) };
            });
            res.json({
                success: true,
                message: "All templates fetched successfully",
                data: formatted
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // POST /mybookings/templates/portal/deploy (Super Admin protected ZIP deployment)
    portalDeployTemplate: async (req, res) => {
        try {
            const { displayName, category, type } = req.body;
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
            const existing = await TemplateProject.findOne({ where: { templateId } });
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
                templateId: templateId,
                displayName,
                category,
                type: type || 'website',
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
            console.error("[Deploy Error] Full Stack Trace:", error);
            try {
                fs.writeFileSync(
                    path.join(__dirname, "..", "deploy_error.log"),
                    `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n`
                );
            } catch (logErr) {
                console.error("Failed to write deploy error log:", logErr);
            }
            // Cleanup zip if still exists
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) { }
            }
            res.status(500).json({ success: false, message: error.message, stack: error.stack });
        }
    },

    // PUT /mybookings/templates/portal/:id (Super Admin protected edit)
    portalUpdateTemplate: async (req, res) => {
        try {
            const { id } = req.params;
            const { displayName, category, type } = req.body;

            if (!displayName || !category || !type) {
                return res.status(400).json({ success: false, message: "Display name, category, and type are required." });
            }

            let template = await TemplateProject.findByPk(id);
            if (!template) {
                template = await TemplateProject.findOne({ where: { templateId: id } });
            }

            if (!template) {
                return res.status(404).json({ success: false, message: "Template not found." });
            }

            template.displayName = displayName;
            template.category = category;
            template.type = type;
            await template.save();

            res.json({
                success: true,
                message: "Template details updated successfully",
                data: template
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // DELETE /mybookings/templates/portal/:id (Super Admin protected purge)
    portalDeleteTemplate: async (req, res) => {
        try {
            const { id } = req.params;
            let template = await TemplateProject.findByPk(id);
            if (!template) {
                template = await TemplateProject.findOne({ where: { templateId: id } });
            }

            if (!template) {
                return res.status(404).json({ success: false, message: "Template not found." });
            }

            // Remove folder recursively
            const templatePath = template.path || path.join(BASE_TEMPLATES_DIR, template.templateId);
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
