<?php
// extractor.php - Upload this to your web root on GoDaddy

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');

$secret_token = "mybookings_secret_upload_token_2026";

/**
 * Safe JSON response helper
 */
function sendJson($statusCode, $data) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Authorization header safe fetch
 */
$authHeader = '';

if (function_exists('getallheaders')) {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    }
}

if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
}

if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

$auth_token = trim(str_replace('Bearer ', '', $authHeader));

if (empty($auth_token) || $auth_token !== $secret_token) {
    sendJson(403, [
        "success" => false,
        "message" => "Unauthorized access."
    ]);
}

// Version check
if (isset($_GET['version'])) {
    sendJson(200, [
        "success" => true,
        "version" => "extractor-debug-v3"
    ]);
}

// Read JSON body only for replicate request
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

/**
 * Delete folder recursively
 */
function deleteFolderRecursive($dir) {
    if (!file_exists($dir)) return true;

    $files = array_diff(scandir($dir), array('.', '..'));

    foreach ($files as $file) {
        $path = $dir . '/' . $file;

        if (is_dir($path)) {
            deleteFolderRecursive($path);
        } else {
            @unlink($path);
        }
    }

    return @rmdir($dir);
}

/**
 * Copy folder recursively
 */
function copyFolderRecursive($src, $dst) {
    if (!file_exists($src)) return false;

    if (!file_exists($dst)) {
        mkdir($dst, 0755, true);
    }

    $dir = opendir($src);
    if (!$dir) return false;

    while (($file = readdir($dir)) !== false) {
        if ($file === '.' || $file === '..') continue;

        $srcPath = $src . '/' . $file;
        $dstPath = $dst . '/' . $file;

        if (is_dir($srcPath)) {
            copyFolderRecursive($srcPath, $dstPath);
        } else {
            copy($srcPath, $dstPath);
        }
    }

    closedir($dir);
    return true;
}

/**
 * Flatten if ZIP contains single parent folder
 */
function flattenExtractedFolder($dir) {
    if (!file_exists($dir)) return;

    $items = array_values(array_diff(scandir($dir), array('.', '..', '__MACOSX', '.DS_Store')));

    if (count($items) === 1) {
        $singleItem = $items[0];
        $singlePath = $dir . '/' . $singleItem;

        if (is_dir($singlePath)) {
            $subItems = array_diff(scandir($singlePath), array('.', '..'));

            foreach ($subItems as $subItem) {
                @rename($singlePath . '/' . $subItem, $dir . '/' . $subItem);
            }

            @rmdir($singlePath);
            flattenExtractedFolder($dir);
        }
    }
}

/**
 * Patch SQLite database config for business wise DB
 */
function patchTemplateDatabaseConfig($templateDir) {
    $configPath = $templateDir . '/server/config/database.php';

    if (!file_exists($configPath)) return;

    $content = file_get_contents($configPath);

    if (strpos($content, 'HTTP_X_BUSINESS_ID') !== false) return;

    $dbPathRegex = '/\$dbPath\s*=\s*__DIR__\s*\.\s*[\'"]\/?((\.\.\/database\/|database\/)?[^\'"]+)\.sqlite[\'"];/i';

    if (preg_match($dbPathRegex, $content, $matches)) {
        $dbNamePath = $matches[1];
        $pathParts = explode('/', $dbNamePath);
        $dbBaseName = end($pathParts);
        $relativeDbDir = str_replace($dbBaseName, '', $dbNamePath);

        $patchedCode = '
$dbName = \'' . $dbBaseName . '\';
if (isset($_SERVER[\'HTTP_X_BUSINESS_ID\'])) {
    $bizId = preg_replace(\'/[^a-zA-Z0-9_-]/\', \'\', $_SERVER[\'HTTP_X_BUSINESS_ID\']);
    if (!empty($bizId)) {
        $dbName = "' . $dbBaseName . '_biz_" . $bizId;
    }
}
$dbPath = __DIR__ . \'/' . $relativeDbDir . '\' . $dbName . \'.sqlite\';
if (!file_exists($dbPath)) {
    $defaultDb = __DIR__ . \'/' . $relativeDbDir . $dbBaseName . '.sqlite\';
    if (file_exists($defaultDb)) {
        if (!file_exists(dirname($dbPath))) {
            mkdir(dirname($dbPath), 0777, true);
        }
        copy($defaultDb, $dbPath);
    }
}
$pdo = new PDO(\'sqlite:\' . $dbPath);';

        $targetRegex = '/\$dbPath\s*=\s*__DIR__\s*\.\s*[\'"]\/?[^\'"]+\.sqlite[\'"];[\s\S]*?\$pdo\s*=\s*new\s*PDO\([\'"]sqlite:[\'"]\s*\.\s*\$dbPath\);/i';

        $newContent = preg_replace($targetRegex, trim($patchedCode), $content);

        if ($newContent !== null) {
            file_put_contents($configPath, $newContent);
        }
    }
}

/**
 * Find icon/logo/favicon
 */
function findIcon($dir, $basePath) {
    if (!file_exists($dir)) return null;

    $files = array_diff(scandir($dir), array('.', '..'));

    foreach ($files as $file) {
        $fullPath = $dir . '/' . $file;

        if (!is_dir($fullPath)) {
            $name = strtolower($file);

            if (in_array($name, array("logo.png", "logo.svg", "favicon.png", "favicon.ico", "favicon.svg"))) {
                return str_replace(DIRECTORY_SEPARATOR, '/', substr($fullPath, strlen($basePath) + 1));
            }
        }
    }

    foreach ($files as $file) {
        $fullPath = $dir . '/' . $file;

        if (is_dir($fullPath)) {
            $found = findIcon($fullPath, $basePath);
            if ($found) return $found;
        } else {
            $name = strtolower($file);

            if (strpos($name, "logo") !== false || strpos($name, "favicon") !== false) {
                $ext = pathinfo($name, PATHINFO_EXTENSION);

                if (in_array($ext, array("png", "svg", "jpg", "jpeg", "ico"))) {
                    return str_replace(DIRECTORY_SEPARATOR, '/', substr($fullPath, strlen($basePath) + 1));
                }
            }
        }
    }

    return null;
}

/**
 * ACTION 1: REPLICATE CUSTOM USER TEMPLATE
 */
if (
    (isset($input['action']) && $input['action'] === 'replicate') ||
    (isset($_POST['action']) && $_POST['action'] === 'replicate')
) {
    $data = !empty($input) ? $input : $_POST;

    $template_id = isset($data['template_id']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $data['template_id']) : '';
    $business_key = isset($data['business_key']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $data['business_key']) : '';
    $numeric_id = isset($data['numeric_id']) ? preg_replace('/[^0-9]/', '', $data['numeric_id']) : '';

    if (empty($template_id) || empty($business_key) || empty($numeric_id)) {
        sendJson(400, [
            "success" => false,
            "message" => "Missing required replication parameters."
        ]);
    }

    $src_path = __DIR__ . "/Templates/" . $template_id;
    $dest_folder_name = $business_key;
    $dest_path = __DIR__ . "/User_Templates/" . $dest_folder_name;

    if (!file_exists($src_path)) {
        sendJson(404, [
            "success" => false,
            "message" => "Source template not found: " . $template_id,
            "src_path" => $src_path
        ]);
    }

    if (!file_exists(__DIR__ . "/User_Templates")) {
        mkdir(__DIR__ . "/User_Templates", 0755, true);
    }

    if (file_exists($dest_path)) {
        deleteFolderRecursive($dest_path);
    }

    $copied = copyFolderRecursive($src_path, $dest_path);

    if (!$copied) {
        sendJson(500, [
            "success" => false,
            "message" => "Failed to copy template folder.",
            "src_path" => $src_path,
            "dest_path" => $dest_path
        ]);
    }

    patchTemplateDatabaseConfig($dest_path);

    sendJson(200, [
        "success" => true,
        "message" => "Template replicated successfully on GoDaddy.",
        "path" => "User_Templates/" . $dest_folder_name
    ]);
}

/**
 * ACTION 2: UPLOAD & DEPLOY ZIP TEMPLATE
 */
if (!isset($_FILES['template_zip']) || !isset($_POST['template_id'])) {
    sendJson(400, [
        "success" => false,
        "message" => "Missing template_zip or template_id."
    ]);
}

$template_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['template_id']);

if (empty($template_id)) {
    sendJson(400, [
        "success" => false,
        "message" => "Invalid template_id."
    ]);
}

$templates_base_dir = __DIR__ . "/Templates";
$extract_path = $templates_base_dir . "/" . $template_id;

if (!file_exists($templates_base_dir)) {
    if (!mkdir($templates_base_dir, 0755, true)) {
        sendJson(500, [
            "success" => false,
            "message" => "Failed to create Templates base folder.",
            "templates_base_dir" => $templates_base_dir
        ]);
    }
}

if (file_exists($extract_path)) {
    deleteFolderRecursive($extract_path);
}

if (!mkdir($extract_path, 0755, true)) {
    sendJson(500, [
        "success" => false,
        "message" => "Failed to create extract folder.",
        "extract_path" => $extract_path
    ]);
}

if ($_FILES['template_zip']['error'] !== UPLOAD_ERR_OK) {
    sendJson(500, [
        "success" => false,
        "message" => "PHP upload error.",
        "upload_error_code" => $_FILES['template_zip']['error'],
        "upload_max_filesize" => ini_get('upload_max_filesize'),
        "post_max_size" => ini_get('post_max_size')
    ]);
}

$zip_file = $_FILES['template_zip']['tmp_name'];

if (!file_exists($zip_file) || filesize($zip_file) <= 0) {
    sendJson(500, [
        "success" => false,
        "message" => "Uploaded ZIP temp file missing or empty.",
        "zip_tmp_file" => $zip_file,
        "file_exists" => file_exists($zip_file),
        "file_size" => file_exists($zip_file) ? filesize($zip_file) : 0
    ]);
}

if (!class_exists('ZipArchive')) {
    sendJson(500, [
        "success" => false,
        "message" => "ZipArchive PHP extension is not enabled on GoDaddy."
    ]);
}

$zip = new ZipArchive();
$result = $zip->open($zip_file);

if ($result !== true) {
    sendJson(500, [
        "success" => false,
        "message" => "Failed to open ZIP on GoDaddy.",
        "zip_error_code" => $result,
        "zip_tmp_file" => $zip_file,
        "file_exists" => file_exists($zip_file),
        "file_size" => file_exists($zip_file) ? filesize($zip_file) : 0,
        "ziparchive_loaded" => class_exists('ZipArchive')
    ]);
}

if (!$zip->extractTo($extract_path)) {
    $zip->close();

    sendJson(500, [
        "success" => false,
        "message" => "ZIP opened but extraction failed. Check folder permissions.",
        "extract_path" => $extract_path,
        "is_writable" => is_writable($extract_path)
    ]);
}

$zip->close();

flattenExtractedFolder($extract_path);
patchTemplateDatabaseConfig($extract_path);

$discovered_icon = findIcon($extract_path, $extract_path);

sendJson(200, [
    "success" => true,
    "message" => "Template uploaded and deployed on GoDaddy successfully.",
    "template_id" => $template_id,
    "path" => "Templates/" . $template_id,
    "icon" => $discovered_icon
]);