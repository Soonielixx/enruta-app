# EnRuta Conductor (Flutter)

1. `flutter create . --org com.enruta --project-name enruta_driver` (genera android/ e ios/ sin tocar `lib/`).
2. **Android**: en `android/app/src/main/AndroidManifest.xml` agrega `<uses-permission android:name="android.permission.CAMERA"/>` y `<uses-permission android:name="android.permission.INTERNET"/>`; si el backend usa `http://`, añade `android:usesCleartextTraffic="true"` al `<application>`. `minSdkVersion` 21.
3. **iOS**: en `ios/Runner/Info.plist` agrega `NSCameraUsageDescription`.
4. **FCM (opcional)**: agrega `google-services.json` / `GoogleService-Info.plist` (Firebase). Sin ellos se envía `fcmToken: null`.
5. `flutter pub get && flutter run`.

El QR del panel web contiene `{"v":1,"api":"<url>","token":"<JWT 15 min>"}`. La app hace `POST <api>/api/mobile/link` con `token`, `model`, `os`, `osVersion`, `fcmToken`. En el emulador Android usa `http://10.0.2.2:3000` como API (ajusta `API_URL` en `src/app/core/config.ts` para pruebas locales).
