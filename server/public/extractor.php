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

// Fallback for unknown action
http_response_code(400);
echo json_encode([
    'success' => false,
    'message' => 'Unknown action: ' . $action
]);
