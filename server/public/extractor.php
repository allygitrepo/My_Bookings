<?php
header('Content-Type: application/json');

// Secret token for security (change this in production)
define('SECRET_TOKEN', 'mitra_6fdfa3eee71f09da3943de949f6e138746325f10ddded706'); 

// Fallback for getallheaders in CGI environments
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}

// Get authorization token from request headers
$headers = getallheaders();
$requestToken = '';

// Check case-insensitive header name
foreach ($headers as $key => $val) {
    if (strtolower($key) === 'x-extractor-token') {
        $requestToken = $val;
        break;
    }
}

if (empty($requestToken) || $requestToken !== SECRET_TOKEN) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access. Invalid or missing X-Extractor-Token.'
    ]);
    exit;
}

// Set up directories
$baseDir = __DIR__;
$templatesDir = $baseDir . '/templates';
$userTemplatesDir = $baseDir . '/user_templates';

// Ensure directories exist
if (!file_exists($templatesDir)) {
    mkdir($templatesDir, 0755, true);
}
if (!file_exists($userTemplatesDir)) {
    mkdir($userTemplatesDir, 0755, true);
}

// Handle request actions
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : 'status');

// Recursive directory deletion helper
function rrmdir($dir) {
    if (is_dir($dir)) {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
                if (is_dir($dir . "/" . $object) && !is_link($dir . "/" . $object)) {
                    rrmdir($dir . "/" . $object);
                } else {
                    unlink($dir . "/" . $object);
                }
            }
        }
        rmdir($dir);
    }
}

// Flatten directory helper (extracts nested folder structure if ZIP was packaged with a root directory)
function flatten_directory($dir) {
    if (!is_dir($dir)) return;
    
    $items = array_diff(scandir($dir), ['.', '..']);
    
    if (count($items) === 1) {
        $singleItem = reset($items);
        $singleItemPath = $dir . '/' . $singleItem;
        
        if (is_dir($singleItemPath)) {
            $nestedItems = array_diff(scandir($singleItemPath), ['.', '..']);
            foreach ($nestedItems as $nestedItem) {
                rename($singleItemPath . '/' . $nestedItem, $dir . '/' . $nestedItem);
            }
            rmdir($singleItemPath);
            flatten_directory($dir);
        }
    }
}

// Recursive directory copy helper
function rcopy($src, $dst) {
    if (is_dir($src)) {
        if (!file_exists($dst)) {
            mkdir($dst, 0755, true);
        }
        $files = scandir($src);
        foreach ($files as $file) {
            if ($file != "." && $file != "..") {
                rcopy("$src/$file", "$dst/$file");
            }
        }
    } else if (file_exists($src)) {
        copy($src, $dst);
    }
}

if ($action === 'status') {
    echo json_encode([
        'success' => true,
        'message' => 'Extractor is ready and operational.',
        'writable' => [
            'templates' => is_writable($templatesDir),
            'user_templates' => is_writable($userTemplatesDir)
        ]
    ]);
    exit;
}

if ($action === 'upload') {
    $templateId = isset($_POST['template_id']) ? trim($_POST['template_id']) : '';
    if (empty($templateId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing template_id parameter.'
        ]);
        exit;
    }

    // Safety regex check for templateId to avoid directory traversal
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $templateId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid template_id format. Only alphanumeric characters, dashes, and underscores are allowed.'
        ]);
        exit;
    }

    if (!isset($_FILES['templateZip']) || $_FILES['templateZip']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = isset($_FILES['templateZip']) ? $_FILES['templateZip']['error'] : 'No file uploaded';
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'File upload error: ' . $errorCode
        ]);
        exit;
    }

    $uploadedFile = $_FILES['templateZip']['tmp_name'];
    $targetDir = $templatesDir . '/' . $templateId;

    // Clean up existing directory if any
    if (file_exists($targetDir)) {
        rrmdir($targetDir);
    }
    mkdir($targetDir, 0755, true);

    // Extract ZIP archive
    $zip = new ZipArchive;
    if ($zip->open($uploadedFile) === TRUE) {
        $zip->extractTo($targetDir);
        $zip->close();

        // Flatten nested directories if zip was packaged as a folder
        flatten_directory($targetDir);

        echo json_encode([
            'success' => true,
            'message' => 'Template ZIP extracted successfully.',
            'template_id' => $templateId,
            'path' => 'templates/' . $templateId
        ]);
    } else {
        rrmdir($targetDir);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to extract ZIP archive.'
        ]);
    }
    exit;
}

if ($action === 'replicate') {
    $templateId = isset($_POST['template_id']) ? trim($_POST['template_id']) : '';
    $businessKey = isset($_POST['business_key']) ? trim($_POST['business_key']) : '';
    $businessId = isset($_POST['business_id']) ? intval($_POST['business_id']) : 0;

    // Database parameters (passed from Node server to match its own config)
    $dbHost = isset($_POST['db_host']) ? trim($_POST['db_host']) : 'localhost';
    $dbUser = isset($_POST['db_user']) ? trim($_POST['db_user']) : 'root';
    $dbPassword = isset($_POST['db_password']) ? trim($_POST['db_password']) : '';
    $dbName = isset($_POST['db_name']) ? trim($_POST['db_name']) : 'mybookings';
    $dbPort = isset($_POST['db_port']) ? intval($_POST['db_port']) : 3306;

    if (empty($templateId) || empty($businessKey) || empty($businessId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required parameters: template_id, business_key, or business_id.'
        ]);
        exit;
    }

    // Safety checks for directory names to prevent path traversal
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $templateId) || !preg_match('/^[a-zA-Z0-9_-]+$/', $businessKey)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid template_id or business_key format.'
        ]);
        exit;
    }

    $srcDir = $templatesDir . '/' . $templateId;
    $dstDir = $userTemplatesDir . '/' . $businessKey;

    if (!file_exists($srcDir) || !is_dir($srcDir)) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Source template directory does not exist: ' . $templateId
        ]);
        exit;
    }

    // Clean up destination directory if exists
    if (file_exists($dstDir)) {
        rrmdir($dstDir);
    }

    // Copy template recursively
    rcopy($srcDir, $dstDir);

    // Create config folder and file inside the copied template
    $configDir = $dstDir . '/server/config';
    if (!file_exists($configDir)) {
        mkdir($configDir, 0755, true);
    }

    $configContent = "<?php\n"
        . "// Auto-generated configuration for tenant database connection\n"
        . "define('TENANT_BUSINESS_ID', " . $businessId . ");\n"
        . "define('DB_HOST', '" . addslashes($dbHost) . "');\n"
        . "define('DB_USER', '" . addslashes($dbUser) . "');\n"
        . "define('DB_PASSWORD', '" . addslashes($dbPassword) . "');\n"
        . "define('DB_NAME', '" . addslashes($dbName) . "');\n"
        . "define('DB_PORT', " . $dbPort . ");\n";

    if (file_put_contents($configDir . '/config.php', $configContent) !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Template replicated and database config injected successfully.',
            'business_key' => $businessKey,
            'path' => 'user_templates/' . $businessKey
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create database config file.'
        ]);
    }
    exit;
}

// Fallback for unknown action
http_response_code(400);
echo json_encode([
    'success' => false,
    'message' => 'Unknown action: ' . $action
]);
