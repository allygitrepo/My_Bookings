const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const axios = require("axios");
const TemplateProject = require("../models/templateProject.model");
const FormData = require('form-data');

const BASE_TEMPLATES_DIR = process.env.CLIENT_DIST_PATH
    ? path.resolve(process.env.CLIENT_DIST_PATH, "Templates")
    : path.resolve(__dirname, "../../client/dist/Templates");

const getAbsoluteTemplatePath = (storedPath) => {
    if (!storedPath) return "";
    if (path.isAbsolute(storedPath)) {
        return storedPath;
    }
    if (process.env.CLIENT_DIST_PATH) {
        const relativePath = storedPath.replace(/^dist\//, "");
        return path.resolve(process.env.CLIENT_DIST_PATH, relativePath);
    }
    return path.resolve(__dirname, "../../client", storedPath);
};

let hasStartedApacheConnectionLog = false;

if (!global.templatePrefixesCache) {
    global.templatePrefixesCache = {};
}

let cachedDetectedApachePath = null;

const detectApacheTemplatesPath = async (apacheBaseUrl) => {
    if (cachedDetectedApachePath !== null) {
        return cachedDetectedApachePath === 'failed' ? null : cachedDetectedApachePath;
    }

    // List of candidate path prefixes
    const projectFolderName = path.basename(path.resolve(__dirname, "../..")); // e.g. "My_Bookings"
    const candidates = [
        `/${projectFolderName}/client/dist`,
        `/client/dist`,
        `/mybookings/client/dist`,
        `/My_Bookings/client/dist`
    ];

    // Remove duplicates
    const uniqueCandidates = [...new Set(candidates)];

    for (const prefix of uniqueCandidates) {
        // We test with a known static file that should exist in gym_v1
        const testUrl = `${apacheBaseUrl}${prefix}/Templates/gym_v1/favicon.svg`;
        try {
            const res = await axios.head(testUrl, { timeout: 1000, validateStatus: () => true });
            if (res.status === 200) {
                console.log(`[Apache Detector] Successfully auto-detected Apache path prefix: "${prefix}"`);
                cachedDetectedApachePath = prefix;
                return prefix;
            }
        } catch (e) {
            // Ignore
        }
    }

    for (const prefix of uniqueCandidates) {
        const testUrl = `${apacheBaseUrl}${prefix}/Templates/doctor_v1/favicon.svg`;
        try {
            const res = await axios.head(testUrl, { timeout: 1000, validateStatus: () => true });
            if (res.status === 200) {
                console.log(`[Apache Detector] Successfully auto-detected Apache path prefix (via doctor_v1): "${prefix}"`);
                cachedDetectedApachePath = prefix;
                return prefix;
            }
        } catch (e) {
            // Ignore
        }
    }

    console.warn(`[Apache Detector Warning] Failed to auto-detect Apache path prefix. Falling back to default filesystem matching.`);
    cachedDetectedApachePath = 'failed';
    return null;
};

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

// Helper to delete/unlink a file with retries and background fallback for Windows EPERM/EBUSY locking issues
const unlinkWithRetrySync = (filePath, retries = 5, delay = 150) => {
    if (!fs.existsSync(filePath)) return;
    for (let i = 0; i < retries; i++) {
        try {
            fs.unlinkSync(filePath);
            return;
        } catch (err) {
            if (err.code === 'EPERM' || err.code === 'EBUSY') {
                if (i === retries - 1) {
                    console.warn(`[Unlink Sync Warning] Synchronous delete failed for ${filePath} after ${retries} attempts, scheduling background delete.`);
                    setTimeout(() => {
                        fs.unlink(filePath, (e) => {
                            if (e) console.error(`[Background Unlink Error] Failed to delete ${filePath}:`, e.message);
                        });
                    }, 500);
                } else {
                    console.warn(`[Unlink Sync Warning] ${filePath} locked, retrying delete (${i + 1}/${retries})...`);
                    sleepSync(delay);
                }
            } else {
                throw err;
            }
        }
    }
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
    patchTemplateDatabaseConfig,
    // Initialize & sync existing templates
    initTemplates: async () => {
        try {
            // Self-healing migration for legacy BusinessTemplate records
            try {
                const BusinessTemplate = require("../models/businessTemplate.model");
                const bizTemplates = await BusinessTemplate.findAll();
                for (const bt of bizTemplates) {
                    let tempPath = bt.temp_path || "";
                    if (tempPath.includes("User Templates")) {
                        tempPath = tempPath.replace("User Templates", "User_Templates");
                        await bt.update({ temp_path: tempPath });
                        console.log(`[Migration] Updated temp_path in DB from 'User Templates' to 'User_Templates' for biz_template ID ${bt.id}`);
                    }
                    const pathParts = tempPath.split('/');
                    const folderName = pathParts[pathParts.length - 1];

                    // Identify if stored temp_id is numeric or string slug
                    const tempId = bt.temp_id ? bt.temp_id.toString().trim() : "";

                    if (!tempId) {
                        console.warn(`[Migration] Skipping business_template ID ${bt.id}: temp_id is empty/null`);
                        continue;
                    }

                    const isNumericId = /^\d+$/.test(tempId);

                    const templateQuery = isNumericId
                        ? { id: Number(tempId) }
                        : { templateId: tempId };


                    const template = await TemplateProject.findOne({ where: templateQuery });
                    if (template) {
                        // If it's a legacy string slug temp_id in the database, migrate it to the template's numeric id
                        if (!isNumericId) {
                            console.log(`[Migration] Converting legacy temp_id slug '${bt.temp_id}' to numeric id '${template.id}' for biz_template ID ${bt.id}`);
                            await bt.update({ temp_id: template.id.toString() });
                        }

                        // Migration logic to rename legacy folders has been removed
                        // as per the requirement to keep User_Templates/<business_key>
                    }
                }
            } catch (migError) {
                console.error("[Migration Error] Failed running self-healing templates migration:", migError);
            }
        } catch (err) {
            console.error("[Templates Setup] Error during templates initialization:", err);
        }
    },

    renderTemplateFile: async (req, res) => {
        try {
            const { templateId, businessId } = req.params;
            let fileSubPath = req.params.file || req.params[0] || 'index.html';
            if (Array.isArray(fileSubPath)) {
                fileSubPath = fileSubPath.join('/');
            }

            // Fetch template from the database
            let template = await TemplateProject.findOne({ where: { templateId } });
            if (!template) {
                return res.status(404).send("Template not found");
            }

            const BusinessTemplate = require("../models/businessTemplate.model");
            const { Op } = require("sequelize");

            // Check if there is an isolated replicated version for this business
            const bizTemplate = await BusinessTemplate.findOne({
                where: {
                    business_id: businessId,
                    [Op.or]: [
                        { temp_id: template.id.toString() },
                        { temp_id: templateId }
                    ]
                }
            });

            // Construct the GoDaddy target URL
            const godaddyBaseUrl = (process.env.GODADDY_BASE_URL || 'https://mybookings.allysoftsolutions.com').trim().replace(/\/$/, '');
            const cleanSubPath = fileSubPath.replace(/^\//, '');

            let relativePrefix = 'Templates';
            let folderName = templateId;

            if (bizTemplate && bizTemplate.temp_path) {
                let tempPath = bizTemplate.temp_path;
                if (tempPath.includes("User_Templates") || tempPath.includes("User Templates")) {
                    relativePrefix = 'User_Templates';
                }
                folderName = path.basename(tempPath).replace(/User_Templates\//, "").replace(/User Templates\//, "");
            }

            const godaddyUrl = encodeURI(`${godaddyBaseUrl}/${relativePrefix}/${folderName}/${cleanSubPath}`);

            try {
                const headers = { ...req.headers };
                delete headers['connection'];
                headers['X-Business-ID'] = businessId;
                headers['host'] = new URL(godaddyBaseUrl).host;

                let proxyData = undefined;
                const uppercaseMethod = req.method.toUpperCase();
                if (['POST', 'PUT', 'PATCH'].includes(uppercaseMethod)) {
                    proxyData = req;
                    if (req.rawBody) {
                        proxyData = req.rawBody;
                        headers['content-length'] = Buffer.byteLength(req.rawBody);
                    } else if (req.body && Object.keys(req.body).length > 0) {
                        if (headers['content-type'] && headers['content-type'].includes('application/json')) {
                            proxyData = JSON.stringify(req.body);
                            headers['content-length'] = Buffer.byteLength(proxyData);
                        } else {
                            const querystring = require('querystring');
                            proxyData = querystring.stringify(req.body);
                            headers['content-length'] = Buffer.byteLength(proxyData);
                        }
                    }
                }

                const https = require('https');
                const httpsAgent = new https.Agent({
                    rejectUnauthorized: false
                });

                const response = await axios({
                    method: req.method,
                    url: godaddyUrl,
                    headers: headers,
                    params: req.query,
                    data: proxyData,
                    responseType: 'arraybuffer',
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    httpsAgent: httpsAgent,
                    validateStatus: () => true
                });

                // Inject widget script if this is the entry page
                const isEntryFile = cleanSubPath === 'index.html' || cleanSubPath === 'index.php' || cleanSubPath === '';
                let content = response.data;
                const contentType = (response.headers['content-type'] || '').toLowerCase();

                if (isEntryFile && (contentType.includes('text/html') || contentType.includes('application/xhtml+xml') || cleanSubPath.endsWith('.html') || cleanSubPath.endsWith('.php') || !cleanSubPath.includes('.'))) {
                    let textContent = content.toString('utf8');
                    const ApiKey = require("../models/apiKey.model");
                    const crypto = require("crypto");
                    let apiKeyRecord = await ApiKey.findOne({ where: { business_id: businessId, status: true } });
                    if (!apiKeyRecord) {
                        const api_key = 'pk_live_' + crypto.randomUUID().replace(/-/g, '');
                        apiKeyRecord = await ApiKey.create({ business_id: businessId, api_key, status: true });
                    }
                    const widgetKey = apiKeyRecord.api_key;
                    const widgetUrl = getWidgetScriptUrl(req);

                    let scriptTag = `\n<!-- Platform Booking Widget Script Injected -->\n<script src="${widgetUrl}" data-business-id="${widgetKey}" data-theme="light" async></script>\n`;
                    if (req.query.preview === 'true') {
                        scriptTag += `<style>button[aria-label="book-now"], .MuiFab-root, #booking-widget-root button.MuiFab-root { display: none !important; }</style>\n`;
                    }

                    const hasHTML = /<\/head>|<\/body>|<\/html>|<html/i.test(textContent);
                    if (hasHTML) {
                        const scriptRegex = /<script\s+[^>]*src="[^"]*widget\.js"[^>]*data-business-id="([^"]+)"[^>]*><\/script>/i;
                        const match = textContent.match(scriptRegex);
                        if (match) {
                            textContent = textContent.replace(match[0], scriptTag);
                        } else {
                            if (textContent.includes("</head>")) {
                                textContent = textContent.replace("</head>", `${scriptTag}</head>`);
                            } else if (textContent.includes("</body>")) {
                                textContent = textContent.replace("</body>", `${scriptTag}</body>`);
                            } else {
                                textContent += scriptTag;
                            }
                        }
                    }
                    content = Buffer.from(textContent, 'utf8');
                }

                res.status(response.status);
                Object.entries(response.headers).forEach(([key, val]) => {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey !== 'transfer-encoding' && lowerKey !== 'content-encoding' && lowerKey !== 'connection') {
                        res.setHeader(key, val);
                    }
                });
                return res.send(content);
            } catch (proxyError) {
                console.error("[GoDaddy Proxy Error] Failed to proxy request:", proxyError.message);
                return res.status(500).send("Template proxy failed: " + proxyError.message);
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
                if (req.file.path) {
                    unlinkWithRetrySync(req.file.path);
                }
                return res.status(400).json({ success: false, message: "Template display name and category are required." });
            }

            // Get original zip file name (without extension) as templateId
            const zipBaseName = path.parse(req.file.originalname).name;
            const templateId = zipBaseName;

            // Verify if template already exists
            const existing = await TemplateProject.findOne({ where: { templateId } });
            if (existing) {
                if (req.file.path) {
                    unlinkWithRetrySync(req.file.path);
                }
                return res.status(400).json({ success: false, message: `A template with ID '${templateId}' (derived from ZIP name '${req.file.originalname}') already exists.` });
            }

            // Prepare payload to GoDaddy
            const godaddyUploadUrl = process.env.GODADDY_UPLOAD_URL || "https://mybookings.allysoftsolutions.com/extractor.php";
            const godaddyUploadToken = process.env.GODADDY_UPLOAD_TOKEN || "mybookings_secret_upload_token_2026";

            const formData = new FormData();
            formData.append('template_zip', fs.createReadStream(req.file.path));
            formData.append('template_id', templateId);

            console.log(`[GoDaddy Deploy] Forwarding ZIP template '${templateId}' to ${godaddyUploadUrl}...`);

            const response = await axios.post(godaddyUploadUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${godaddyUploadToken}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: () => true // Allow capturing 500 responses to show custom PHP error messages
            });

            // Clean up temporary ZIP file on VPS
            if (req.file && req.file.path) {
                unlinkWithRetrySync(req.file.path);
            }

            if (response.status >= 400 || !response.data || !response.data.success) {
                let errorMsg = "Failed to extract ZIP on GoDaddy.";
                if (response.data) {
                    errorMsg = typeof response.data === 'object' ? (response.data.message || JSON.stringify(response.data)) : response.data.toString();
                }
                throw new Error(`GoDaddy Server Error (Status ${response.status}): ${errorMsg}`);
            }

            const discoveredIcon = response.data.icon || null;
            const iconUrlPath = discoveredIcon ? `/Templates/${templateId}/${discoveredIcon}` : null;

            const template = await TemplateProject.create({
                templateId: templateId,
                displayName,
                category,
                type: type || 'website',
                path: `Templates/${templateId}`,
                icon: iconUrlPath,
                isActive: true
            });

            res.status(201).json({
                success: true,
                message: "Template uploaded and deployed to GoDaddy successfully",
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
            if (req.file && req.file.path) {
                unlinkWithRetrySync(req.file.path);
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
