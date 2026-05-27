const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const axios = require("axios");
const TemplateProject = require("../models/templateProject.model");

const BASE_TEMPLATES_DIR = path.resolve(__dirname, "../../client/dist/Templates");

const getAbsoluteTemplatePath = (storedPath) => {
    if (!storedPath) return "";
    if (path.isAbsolute(storedPath)) {
        return storedPath;
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
            // Ensure client/dist/Templates directory exists
            if (!fs.existsSync(BASE_TEMPLATES_DIR)) {
                fs.mkdirSync(BASE_TEMPLATES_DIR, { recursive: true });
            }

            // Migration: Move templates from legacy server/Templates to new client/dist/Templates
            const oldTemplatesDir = path.resolve(__dirname, "..", "Templates");
            if (fs.existsSync(oldTemplatesDir) && oldTemplatesDir !== BASE_TEMPLATES_DIR) {
                try {
                    const oldDirs = fs.readdirSync(oldTemplatesDir).filter(f => fs.statSync(path.join(oldTemplatesDir, f)).isDirectory());
                    for (const oldDir of oldDirs) {
                        const src = path.join(oldTemplatesDir, oldDir);
                        const dest = path.join(BASE_TEMPLATES_DIR, oldDir);
                        if (!fs.existsSync(dest)) {
                            console.log(`[Templates Migration] Moving template ${oldDir} to client/dist/Templates...`);
                            copyFolderRecursiveSync(src, dest);
                        }
                    }
                } catch (migrationErr) {
                    console.error("[Templates Migration] Error migrating templates:", migrationErr);
                }
            }

            // Find all directories in client/dist/Templates
            const templateDirs = fs.readdirSync(BASE_TEMPLATES_DIR).filter(file => {
                const fullPath = path.join(BASE_TEMPLATES_DIR, file);
                return fs.statSync(fullPath).isDirectory();
            });

            for (const dirName of templateDirs) {
                const dirPath = path.join(BASE_TEMPLATES_DIR, dirName);
                const relativePath = `dist/Templates/${dirName}`;
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
                        templateId: dirName,
                        displayName: displayName,
                        category: "Healthcare / Hospital", // Default category or can be customized
                        type: templateType,
                        path: relativePath,
                        icon: iconUrlPath,
                        isActive: true
                    });
                } else {
                    // Update paths, icons, and type to make sure they are dynamic and up-to-date
                    let updated = false;
                    if (templateRecord.path !== relativePath) {
                        templateRecord.path = relativePath;
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

                        // If folderName contains templateId slug format instead of numeric ID
                        if (folderName && folderName.includes('_')) {
                            const lastPart = folderName.split('_').pop();
                            if (isNaN(lastPart)) {
                                console.log(`[Migration] Legacy business template physical folder format found: ${bt.temp_path}`);
                                const correctFolderName = `${bt.business_key}_${template.id}`;
                                const correctPath = `dist/User_Templates/${correctFolderName}`;

                                const clientDistPath = path.resolve(__dirname, "../../client/dist");
                                const legacyFolderFullPath = path.join(clientDistPath, "User_Templates", folderName);
                                const correctFolderFullPath = path.join(clientDistPath, "User_Templates", correctFolderName);

                                if (fs.existsSync(legacyFolderFullPath)) {
                                    try {
                                        if (fs.existsSync(correctFolderFullPath)) {
                                            fs.rmSync(correctFolderFullPath, { recursive: true, force: true });
                                        }
                                        fs.renameSync(legacyFolderFullPath, correctFolderFullPath);
                                        console.log(`[Migration] Successfully renamed physical folder from ${folderName} to ${correctFolderName}`);
                                    } catch (renameErr) {
                                        console.error(`[Migration Error] Failed to rename physical folder:`, renameErr);
                                    }
                                }

                                await bt.update({
                                    temp_path: correctPath
                                });
                                console.log(`[Migration] Updated DB business_templates ID ${bt.id} path to ${correctPath}`);
                            }
                        }
                    }
                }
            } catch (migError) {
                console.error("[Migration Error] Failed running self-healing templates migration:", migError);
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

            // Fetch template from the database
            let template = await TemplateProject.findOne({ where: { templateId } });
            if (!template) {
                return res.status(404).send("Template not found");
            }

            const BusinessTemplate = require("../models/businessTemplate.model");
            const { Op } = require("sequelize");

            // Check if there is an isolated replicated version for this business
            let templateDir;
            const bizTemplate = await BusinessTemplate.findOne({
                where: {
                    business_id: businessId,
                    [Op.or]: [
                        { temp_id: template.id.toString() },
                        { temp_id: templateId }
                    ]
                }
            });

            const hasEntryFile = (dir) => {
                if (!dir || !fs.existsSync(dir)) return false;
                if (fs.existsSync(path.join(dir, 'index.html')) || fs.existsSync(path.join(dir, 'index.php'))) return true;
                if (fs.existsSync(path.join(dir, 'client', 'dist', 'index.html'))) return true;
                return false;
            };

            const isPreviewRequest = req.query.preview === 'true' ||
                (req.headers.referer && req.headers.referer.includes('preview=true'));

            if (bizTemplate && bizTemplate.temp_path) {
                let tempPath = bizTemplate.temp_path;
                if (tempPath.includes("User Templates")) {
                    tempPath = tempPath.replace("User Templates", "User_Templates");
                    bizTemplate.update({ temp_path: tempPath }).catch(err => console.error("[Dynamic Migration Error] Failed to update temp_path:", err));
                }
                templateDir = getAbsoluteTemplatePath(tempPath);
                // Fallback to master template if replicated folder is missing or incomplete physically
                if (!hasEntryFile(templateDir)) {
                    templateDir = getAbsoluteTemplatePath(template.path);
                }
            } else {
                templateDir = getAbsoluteTemplatePath(template.path);
            }

            // Check if this is an API request targeting the template's PHP backend.
            // If so, proxy it to Apache instead of trying to serve it as a static file.
            if (fileSubPath.startsWith('server/public/') || fileSubPath.startsWith('/server/public/')) {
                const physicalFolderName = path.basename(templateDir);
                const parentDir = path.dirname(templateDir).replace(/\\/g, '/');

                let apacheBaseUrl = (process.env.APACHE_BASE_URL || 'http://localhost').trim().replace(/\/$/, '');
                apacheBaseUrl = apacheBaseUrl.replace(/:$/, '');

                // Check if an explicit Apache URL path prefix is provided in env
                let apacheUrlPath = process.env.APACHE_TEMPLATES_PATH;
                if (!apacheUrlPath) {
                    const clientDistApachePrefix = await detectApacheTemplatesPath(apacheBaseUrl);
                    if (clientDistApachePrefix) {
                        const isUserTemplate = parentDir.includes('User_Templates') || parentDir.includes('User Templates');
                        apacheUrlPath = clientDistApachePrefix + (isUserTemplate ? '/User_Templates' : '/Templates');
                    } else {
                        // Fallback to legacy regex detection if detector failed
                        const htdocsMatch = parentDir.match(/\/htdocs\/(.+)$/i) ||
                            parentDir.match(/\/html\/(.+)$/i) ||
                            parentDir.match(/\/www\/(.+)$/i);

                        if (htdocsMatch) {
                            apacheUrlPath = '/' + htdocsMatch[1];
                        } else {
                            const normalizedPath = parentDir.toLowerCase();
                            const myBookingsIndex = normalizedPath.indexOf('my_bookings');
                            if (myBookingsIndex !== -1) {
                                // Extract exact case-sensitive parent folder name (e.g. "My_Bookings") from file system path
                                const folderPrefix = parentDir.substring(0, myBookingsIndex + 'my_bookings'.length);
                                const actualFolderName = folderPrefix.split('/').pop() || 'My_Bookings';
                                const subPath = parentDir.substring(myBookingsIndex + 'my_bookings'.length);
                                apacheUrlPath = '/' + actualFolderName + subPath;
                            } else {
                                apacheUrlPath = '/My_Bookings/client/dist/Templates';
                            }
                        }
                    }
                }

                // Ensure fileSubPath has no leading slash when appending
                const cleanSubPath = fileSubPath.replace(/^\//, '');
                const apacheUrl = encodeURI(`${apacheBaseUrl}${apacheUrlPath}/${physicalFolderName}/${cleanSubPath}`);

                const logThisRequest = !hasStartedApacheConnectionLog;
                if (logThisRequest) {
                    hasStartedApacheConnectionLog = true;
                    console.log(`connecting apache to ${apacheUrl}...`);
                }

                try {
                    const headers = { ...req.headers };
                    delete headers['connection'];
                    headers['X-Business-ID'] = businessId;
                    headers['host'] = req.headers['host'] || new URL(apacheBaseUrl).host;

                    // Forward raw request stream for unparsed body types (like multipart/form-data with images/files),
                    // or the parsed rawBody/body for parsed types (only for POST/PUT/PATCH methods).
                    let proxyData = undefined;
                    const uppercaseMethod = req.method.toUpperCase();
                    if (['POST', 'PUT', 'PATCH'].includes(uppercaseMethod)) {
                        proxyData = req;
                        if (req.rawBody) {
                            proxyData = req.rawBody;
                            headers['content-length'] = Buffer.byteLength(req.rawBody);
                        } else if (req.body && Object.keys(req.body).length > 0) {
                            // Fallback for pre-parsed standard JSON or urlencoded data if rawBody is somehow missing
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
                        url: apacheUrl,
                        headers: headers,
                        params: req.query,
                        data: proxyData,
                        responseType: 'arraybuffer',
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        httpsAgent: httpsAgent, // ignore self-signed certificate errors for local/internal VPS routing
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
                        const lowerKey = key.toLowerCase();
                        if (lowerKey !== 'transfer-encoding' && lowerKey !== 'content-encoding' && lowerKey !== 'connection') {
                            res.setHeader(key, val);
                        }
                    });
                    return res.send(response.data);
                } catch (proxyError) {
                    console.log(`connecting apache to ${apacheUrl}... failed (Error: ${proxyError.message})`);
                    console.error("[Template Proxy Error] Proxy request failed. Full details:", proxyError);
                    hasStartedApacheConnectionLog = false;
                    return res.status(500).json({ success: false, message: "Template API proxy failed: " + proxyError.message });
                }
            }

            // Dynamically resolve static entry directory if client/dist exists (supporting built templates)
            let staticDir = templateDir;
            if (fs.existsSync(path.join(templateDir, 'client', 'dist'))) {
                staticDir = path.join(templateDir, 'client', 'dist');
            }

            let targetFilePath = path.join(staticDir, fileSubPath);

            // Security: Prevent directory traversal
            const resolvedPath = path.resolve(targetFilePath);
            if (!resolvedPath.startsWith(path.resolve(staticDir))) {
                return res.status(403).send("Access denied");
            }

            // Fallback for subpages (SPA support)
            if (!fs.existsSync(targetFilePath)) {
                let resolvedAsset = false;
                // If it contains a known static folder in its path, try to strip the routing prefix (e.g. admin/assets/foo -> assets/foo)
                const knownFolders = ['assets', 'icons', 'images', 'js', 'css', 'fonts', 'favicon'];
                for (const folder of knownFolders) {
                    const index = fileSubPath.indexOf(`${folder}/`);
                    if (index !== -1) {
                        const strippedPath = fileSubPath.substring(index);
                        const testPath = path.join(staticDir, strippedPath);
                        if (fs.existsSync(testPath)) {
                            targetFilePath = testPath;
                            resolvedAsset = true;
                            break;
                        }
                    }
                }

                // Try resolving direct files in the root (like favicon.svg, logo.png) requested relatively from subpaths
                if (!resolvedAsset) {
                    const basename = path.basename(fileSubPath);
                    const testPath = path.join(staticDir, basename);
                    if (fs.existsSync(testPath)) {
                        targetFilePath = testPath;
                        resolvedAsset = true;
                    }
                }

                if (!resolvedAsset) {
                    if (fileSubPath.includes('.') && !fileSubPath.endsWith('.html') && !fileSubPath.endsWith('.php')) {
                        return res.status(404).send("File not found");
                    }
                    targetFilePath = path.join(staticDir, 'index.html');
                    if (!fs.existsSync(targetFilePath)) {
                        targetFilePath = path.join(staticDir, 'index.php');
                    }
                    if (!fs.existsSync(targetFilePath)) {
                        return res.status(404).send("Template entry file not found");
                    }
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
                // Non-blocking async file read
                let content = await fs.promises.readFile(targetFilePath, "utf8");

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

                // In-memory cache for dynamic prefix scanner (avoids reading entry HTML from disk recursively!)
                if (!global.templatePrefixesCache) {
                    global.templatePrefixesCache = {};
                }

                let templatePrefixes = global.templatePrefixesCache[templateId];
                if (!templatePrefixes) {
                    templatePrefixes = ["DRP_Doctor", templateId];

                    const entryHtmlPath = path.join(templateDir, 'index.html');
                    const entryPhpPath = path.join(templateDir, 'index.php');
                    let entryContent = "";
                    try {
                        if (fs.existsSync(entryHtmlPath)) {
                            entryContent = await fs.promises.readFile(entryHtmlPath, "utf8");
                        } else if (fs.existsSync(entryPhpPath)) {
                            entryContent = await fs.promises.readFile(entryPhpPath, "utf8");
                        }
                    } catch (e) {
                        console.error("[Template Cache Loader] Error reading entry file for prefix discovery:", e);
                    }

                    if (entryContent) {
                        const match = entryContent.match(/(?:href|src)=["']\/([a-zA-Z0-9_-]+)\/(?:assets|favicon|logo|icons|js|css)/i);
                        if (match && match[1] && !templatePrefixes.includes(match[1])) {
                            templatePrefixes.push(match[1]);
                        }
                    }

                    if (!isEntryFile) {
                        const fileMatch = content.match(/(?:href|src)=["']\/([a-zA-Z0-9_-]+)\/(?:assets|favicon|logo|icons|js|css)/i);
                        if (fileMatch && fileMatch[1] && !templatePrefixes.includes(fileMatch[1])) {
                            templatePrefixes.push(fileMatch[1]);
                        }
                    }

                    templatePrefixes.sort((a, b) => b.length - a.length);
                    global.templatePrefixesCache[templateId] = templatePrefixes;
                }

                // Rewrite prefixes
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

            const extractPath = path.join(BASE_TEMPLATES_DIR, templateId);
            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }

            // Extract ZIP
            const zip = new AdmZip(req.file.path);
            zip.extractAllTo(extractPath, true);

            // Clean up temporary ZIP file
            if (req.file && req.file.path) {
                unlinkWithRetrySync(req.file.path);
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
                templateId: templateId,
                displayName,
                category,
                type: type || 'website',
                path: `dist/Templates/${templateId}`,
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
