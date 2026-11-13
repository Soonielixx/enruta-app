import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'pages/home_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    // Requiere google-services.json / GoogleService-Info.plist (ver README).
    await Firebase.initializeApp();
  } catch (_) {
    // Sin Firebase configurado la vinculación funciona, pero sin token FCM.
  }
  final prefs = await SharedPreferences.getInstance();
  runApp(EnRutaDriverApp(prefs: prefs));
}

class EnRutaDriverApp extends StatelessWidget {
  const EnRutaDriverApp({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EnRuta Conductor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: const Color(0xFF1769AA), useMaterial3: true),
      home: HomePage(prefs: prefs),
    );
  }
}
