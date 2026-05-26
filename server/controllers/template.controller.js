const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const axios = require("axios");
const TemplateProject = require("../models/templateProject.model");

const BASE_TEMPLATES_DIR = path.join(__dirname, "..", "Templates");

let hasStartedApacheConnectionLog = false;

const getApiBaseUrl = () =>
    (process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, "");

const getWidgetScriptUrl = (req) => {
    const host = req ? (req.headers['host'] || '') : '';
    if (host) {
        if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("3000") || host.includes("5173")) {
            return "http://localhost:3000/widget.js";
        }
        return "https://mybookings.allysoftsolutions.com/widget.js";
    }

    const apiBase = getApiBaseUrl();
    if (apiBase.includes("localhost") || apiBase.includes("127.0.0.1")) {
        return "http://localhost:3000/widget.js";
    }
    return "https://mybookings.allysoftsolutions.com/widget.js";
};

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

// Helper to patch template's database configuration to support dynamic business-isolated SQLite databases
const patchTemplateDatabaseConfig = (templateDir) => {
    try {
        const configPath = path.join(templateDir, 'server', 'config', 'database.php');
        if (!fs.existsSync(configPath)) {
            return;
        }

        let content = fs.readFileSync(configPath, 'utf8');

        // Check if it's already patched
        if (content.includes('HTTP_X_BUSINESS_ID')) {
            return;
        }

        // Find the SQLite db filename pattern (e.g. $dbPath = __DIR__ . '/../database/gym.sqlite';)
        const dbPathRegex = /\$dbPath\s*=\s*__DIR__\s*\.\s*['"]\/?(\.\.\/database\/|database\/)?([^'"]+)\.sqlite['"];/i;
        const match = content.match(dbPathRegex);
        if (match) {
            const relativeDbDir = match[1] || '../database/';
            const dbBaseName = match[2];

            const patchedCode = `
            $dbName = '${dbBaseName}';
            if (isset($_SERVER['HTTP_X_BUSINESS_ID'])) {
                $bizId = preg_replace('/[^a-zA-Z0-9_-]/', '', $_SERVER['HTTP_X_BUSINESS_ID']);
                if (!empty($bizId)) {
                    $dbName = "${dbBaseName}_biz_" . $bizId;
                }
            }
            $dbPath = __DIR__ . '/${relativeDbDir}' . $dbName . '.sqlite';
            if (!file_exists($dbPath)) {
                $defaultDb = __DIR__ . '/${relativeDbDir}${dbBaseName}.sqlite';
                if (file_exists($defaultDb)) {
                    if (!file_exists(dirname($dbPath))) {
                        mkdir(dirname($dbPath), 0777, true);
                    }
                    copy($defaultDb, $dbPath);
                }
            }
            $pdo = new PDO('sqlite:' . $dbPath);`;

            // Regex matching $dbPath = ... and $pdo = new PDO(...) lines
            const targetRegex = /\$dbPath\s*=\s*__DIR__\s*\.\s*['"]\/?[^'"]+\.sqlite['"];[\s\S]*?\$pdo\s*=\s*new\s*PDO\(['"]sqlite:['"]\s*\.\s*\$dbPath\);/i;
            if (content.match(targetRegex)) {
                content = content.replace(targetRegex, patchedCode.trim());
                fs.writeFileSync(configPath, content, 'utf8');
            }
        }
    } catch (e) {
        console.error(`[Template Patch] Error patching database config for ${templateDir}:`, e);
    }
};

const templateController = {
    // Initialize & sync existing templates
    initTemplates: async () => {
        try {
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
                patchTemplateDatabaseConfig(dirPath);
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
                    }
                }
            }
        } catch (err) {
            console.error("[Templates Setup] Error during templates initialization:", err);
        }
    },

    // Serve template files dynamically
    renderTemplateFile: async (req, res) => {
        try {
            const { templateId, businessId } = req.params;
            let fileSubPath = req.params.file || req.params[0] || 'index.html';
            if (Array.isArray(fileSubPath)) {
                fileSubPath = fileSubPath.join('/');
            }

            // Check if this is an API request targeting the template's PHP backend.
            // If so, proxy it to Apache instead of trying to serve it as a static file.
            if (fileSubPath.startsWith('server/public/') || fileSubPath.startsWith('/server/public/')) {
                // Find the template first to resolve the actual physical folder name from the database
                const template = await TemplateProject.findOne({ where: { templateId } });
                if (!template) {
                    console.error(`[Template Proxy Error] Template not found in database for ID: ${templateId}`);
                    return res.status(404).send("Template not found");
                }
                const physicalFolderName = path.basename(template.path);

                const apacheBaseUrl = (process.env.APACHE_BASE_URL || 'http://localhost').replace(/\/$/, '');
                
                // Let's first check if an explicit Apache URL path prefix is provided in env
                let apacheUrlPath = process.env.APACHE_TEMPLATES_PATH;
                if (apacheUrlPath) {
                    if (!hasStartedApacheConnectionLog) {
                        console.log(`[Template Proxy] Using configured APACHE_TEMPLATES_PATH: "${apacheUrlPath}"`);
                    }
                } else {
                    // Fallback to dynamic detection
                    const baseTemplatesNormalized = BASE_TEMPLATES_DIR.replace(/\\/g, '/');
                    const htdocsMatch = baseTemplatesNormalized.match(/\/htdocs\/(.+)$/i) || 
                                        baseTemplatesNormalized.match(/\/html\/(.+)$/i) || 
                                        baseTemplatesNormalized.match(/\/www\/(.+)$/i);
                    
                    if (htdocsMatch) {
                        apacheUrlPath = '/' + htdocsMatch[1];
                    } else {
                        const normalizedPath = baseTemplatesNormalized.toLowerCase();
                        const myBookingsIndex = normalizedPath.indexOf('my_bookings');
                        if (myBookingsIndex !== -1) {
                            // Extract exact case-sensitive parent folder name (e.g. "My_Bookings") from file system path
                            const folderPrefix = baseTemplatesNormalized.substring(0, myBookingsIndex + 'my_bookings'.length);
                            const actualFolderName = folderPrefix.split('/').pop() || 'My_Bookings';
                            const subPath = baseTemplatesNormalized.substring(myBookingsIndex + 'my_bookings'.length);
                            apacheUrlPath = '/' + actualFolderName + subPath;
                        } else {
                            apacheUrlPath = '/My_Bookings/server/Templates';
                        }
                    }
                }

                // Ensure fileSubPath has no leading slash when appending
                const cleanSubPath = fileSubPath.replace(/^\//, '');
                const apacheUrl = `${apacheBaseUrl}${apacheUrlPath}/${physicalFolderName}/${cleanSubPath}`;
                
                const logThisRequest = !hasStartedApacheConnectionLog;
                if (logThisRequest) {
                    hasStartedApacheConnectionLog = true;
                    console.log(`connecting apache to ${apacheUrl}...`);
                }
                
                try {
                    const headers = { ...req.headers };
                    delete headers['content-length'];
                    delete headers['connection'];
                    headers['X-Business-ID'] = businessId;
                    headers['host'] = req.headers['host'] || new URL(apacheBaseUrl).host;

                    const response = await axios({
                        method: req.method,
                        url: apacheUrl,
                        headers: headers,
                        params: req.query,
                        data: req.body,
                        validateStatus: () => true
                    });
                    
                    if (response.status >= 400) {
                        console.log(`connecting apache to ${apacheUrl}... failed (Status ${response.status})`);
                        console.log(`[Template Proxy Error Detail] Apache returned body:`, typeof response.data === 'object' ? JSON.stringify(response.data) : response.data);
                        hasStartedApacheConnectionLog = false;
                    } else {
                        if (logThisRequest) {
                            console.log("connected ..");
                        }
                    }
                    
                    res.status(response.status);
                    Object.entries(response.headers).forEach(([key, val]) => {
                        res.setHeader(key, val);
                    });
                    return res.send(response.data);
                } catch (proxyError) {
                    console.log(`connecting apache to ${apacheUrl}... failed (Error: ${proxyError.message})`);
                    console.error("[Template Proxy Error] Proxy request failed. Full details:", proxyError);
                    hasStartedApacheConnectionLog = false;
                    return res.status(500).json({ success: false, message: "Template API proxy failed: " + proxyError.message });
                }
            }

            // Fetch template from the database
            let template = await TemplateProject.findOne({ where: { templateId } });
            if (!template) {
                return res.status(404).send("Template not found");
            }

            const templateDir = template.path;
            let targetFilePath = path.join(templateDir, fileSubPath);

            // Security: Prevent directory traversal
            const resolvedPath = path.resolve(targetFilePath);
            if (!resolvedPath.startsWith(path.resolve(templateDir))) {
                return res.status(403).send("Access denied");
            }

            // Fallback for subpages (SPA support)
            if (!fs.existsSync(targetFilePath)) {
                if (fileSubPath.includes('.') && !fileSubPath.endsWith('.html') && !fileSubPath.endsWith('.php')) {
                    return res.status(404).send("File not found");
                }
                targetFilePath = path.join(templateDir, 'index.html');
                if (!fs.existsSync(targetFilePath)) {
                    targetFilePath = path.join(templateDir, 'index.php');
                }
                if (!fs.existsSync(targetFilePath)) {
                    return res.status(404).send("Template entry file not found");
                }
                fileSubPath = path.basename(targetFilePath);
            }

            const stat = fs.statSync(targetFilePath);
            if (stat.isDirectory()) {
                let dirIndexHtml = path.join(targetFilePath, 'index.html');
                let dirIndexPhp = path.join(targetFilePath, 'index.php');
                if (fs.existsSync(dirIndexHtml)) {
                    targetFilePath = dirIndexHtml;
                } else if (fs.existsSync(dirIndexPhp)) {
                    targetFilePath = dirIndexPhp;
                } else {
                    return res.status(404).send("Directory index not found");
                }
            }

            const ext = path.extname(targetFilePath).toLowerCase();
            const textExtensions = [".html", ".php", ".js", ".css", ".json", ".xml", ".svg"];

            if (textExtensions.includes(ext)) {
                let content = fs.readFileSync(targetFilePath, "utf8");

                // Inject widget script if this is the entry page
                const isEntryFile = path.basename(targetFilePath) === 'index.html' || path.basename(targetFilePath) === 'index.php';
                if (isEntryFile) {
                    const ApiKey = require("../models/apiKey.model");
                    const crypto = require("crypto");
                    let apiKeyRecord = await ApiKey.findOne({ where: { business_id: businessId, status: true } });
                    if (!apiKeyRecord) {
                        const api_key = 'pk_live_' + crypto.randomUUID().replace(/-/g, '');
                        apiKeyRecord = await ApiKey.create({ business_id: businessId, api_key, status: true });
                    }
                    const widgetKey = apiKeyRecord.api_key;
                    const widgetUrl = getWidgetScriptUrl(req);
                    console.log(`widget.js URL: ${widgetUrl}`);
                    let scriptTag = `\n<!-- Platform Booking Widget Script Injected -->\n<script src="${widgetUrl}" data-business-id="${widgetKey}" data-theme="light" async></script>\n`;
                    if (req.query.preview === 'true') {
                        scriptTag += `<style>button[aria-label="book-now"], .MuiFab-root, #booking-widget-root button.MuiFab-root { display: none !important; }</style>\n`;
                    }

                    const hasHTML = /<\/head>|<\/body>|<\/html>|<html/i.test(content);
                    if (hasHTML) {
                        const scriptRegex = /<script\s+[^>]*src="[^"]*widget\.js"[^>]*data-business-id="([^"]+)"[^>]*><\/script>/i;
                        const match = content.match(scriptRegex);
                        if (match) {
                            content = content.replace(match[0], scriptTag);
                        } else {
                            if (content.includes("</head>")) {
                                content = content.replace("</head>", `${scriptTag}</head>`);
                            } else if (content.includes("</body>")) {
                                content = content.replace("</body>", `${scriptTag}</body>`);
                            } else {
                                content += scriptTag;
                            }
                        }
                    }
                }

                // Detect and rewrite absolute asset URL prefixes
                const templatePrefixes = ["DRP_Doctor", templateId];

                // Dynamically discover the template's base prefix (e.g. gym_trainer_portfolio) by scanning the entry file.
                // This ensures assets referenced in JS/CSS files also get rewritten correctly.
                const entryHtmlPath = path.join(templateDir, 'index.html');
                const entryPhpPath = path.join(templateDir, 'index.php');
                let entryContent = "";
                if (fs.existsSync(entryHtmlPath)) {
                    entryContent = fs.readFileSync(entryHtmlPath, "utf8");
                } else if (fs.existsSync(entryPhpPath)) {
                    entryContent = fs.readFileSync(entryPhpPath, "utf8");
                }

                if (entryContent) {
                    const match = entryContent.match(/(?:href|src)=["']\/([a-zA-Z0-9_-]+)\/(?:assets|favicon|logo|icons|js|css)/i);
                    if (match && match[1] && !templatePrefixes.includes(match[1])) {
                        templatePrefixes.push(match[1]);
                    }
                }

                // Also check the current file content itself for self-contained declarations
                const fileMatch = content.match(/(?:href|src)=["']\/([a-zA-Z0-9_-]+)\/(?:assets|favicon|logo|icons|js|css)/i);
                if (fileMatch && fileMatch[1] && !templatePrefixes.includes(fileMatch[1])) {
                    templatePrefixes.push(fileMatch[1]);
                }

                // Sort prefixes by length descending
                templatePrefixes.sort((a, b) => b.length - a.length);

                // Build a combined regex to do a single-pass rewrite to the Express render route.
                // We use a negative lookbehind (?<!\/mybookings\/templates\/render) to prevent rewriting
                // any prefix that is already part of the target replacement path.
                templatePrefixes.forEach((prefix) => {
                    const regex = new RegExp('(?<!\\/mybookings\\/templates\\/render)\\/' + prefix + '(?=[\\/"\'])', 'g');
                    content = content.replace(regex, `/mybookings/templates/render/${templateId}/${businessId}`);
                });

                res.type(ext);
                res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
                return res.send(content);
            } else {
                res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
                return res.sendFile(targetFilePath);
            }
        } catch (error) {
            console.error("[Template Server Error] renderTemplateFile failed:", error);
            return res.status(500).send("Internal server error: " + error.message);
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
            const zip = new AdmZip(req.file.path);
            zip.extractAllTo(extractPath, true);

            // Clean up temporary ZIP file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            // Flatten the folder structure if zipped as a single root-level folder
            flattenExtractedFolder(extractPath);

            // Patch the database configuration of the deployed template
            patchTemplateDatabaseConfig(extractPath);

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
