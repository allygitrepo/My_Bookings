import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:get/get.dart';
import 'app/routes/appPages.dart';
import 'firebase_options.dart';

import 'package:get_storage/get_storage.dart';
import 'app/data/services/auth_service.dart';
import 'app/data/services/api_client.dart';
import 'app/data/services/notification_service.dart';
import 'app/data/services/socket_service.dart';
import 'app/data/services/fcm_service.dart';
import 'app/core/themes/light_theme.dart';
import 'app/core/themes/dark_theme.dart';

import 'package:flutter/services.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay style for transparent status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (e) {
    debugPrint('Firebase initialization error: $e');
  }

  try {
    await GetStorage.init();
  } catch (e) {
    debugPrint('GetStorage initialization error: $e');
  }

  // Register core services in dependency order
  await Get.putAsync(() => AuthService().init());
  await Get.putAsync(() => ApiClient().init());
  await Get.putAsync(() => NotificationService().init());

  try {
    await Get.putAsync(() => FCMService().init());
  } catch (e) {
    debugPrint('FCMService initialization error: $e');
  }

  try {
    await Get.putAsync(() => SocketService().init());
  } catch (e) {
    debugPrint('SocketService initialization error: $e');
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'My Bookings',
      initialRoute: AppPages.INITIAL,
      getPages: AppPages.routes,
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
    );
  }
}
