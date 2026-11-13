import 'dart:convert';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;

class LinkException implements Exception {
  LinkException(this.message);
  final String message;
  @override
  String toString() => message;
}

class QrPayload {
  QrPayload({required this.api, required this.token});
  final String api;
  final String token;

  /// El QR contiene {"v":1,"api":"http://host:3000","token":"<JWT>"}
  factory QrPayload.parse(String raw) {
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final api = (map['api'] as String?)?.trim() ?? '';
      final token = (map['token'] as String?)?.trim() ?? '';
      if (api.isEmpty || token.isEmpty) throw const FormatException();
      return QrPayload(api: api.replaceAll(RegExp(r'/+$'), ''), token: token);
    } catch (_) {
      throw LinkException('El código QR no pertenece a EnRuta.');
    }
  }
}

class HardwareInfo {
  HardwareInfo({required this.model, required this.os, required this.osVersion, this.fcmToken});
  final String model;
  final String os;
  final String osVersion;
  final String? fcmToken;
}

class LinkResult {
  LinkResult({required this.deviceAlias, this.driverName, this.plate, required this.deviceToken});
  final String deviceAlias;
  final String? driverName;
  final String? plate;
  final String deviceToken;
}

class LinkService {
  Future<HardwareInfo> collectHardware() async {
    final plugin = DeviceInfoPlugin();
    String model = 'Desconocido', os = Platform.operatingSystem, version = '';
    if (Platform.isAndroid) {
      final info = await plugin.androidInfo;
      model = '${info.manufacturer} ${info.model}';
      os = 'Android';
      version = info.version.release;
    } else if (Platform.isIOS) {
      final info = await plugin.iosInfo;
      model = info.utsname.machine;
      os = 'iOS';
      version = info.systemVersion;
    }
    String? fcm;
    try {
      await FirebaseMessaging.instance.requestPermission();
      fcm = await FirebaseMessaging.instance.getToken();
    } catch (_) {
      fcm = null;
    }
    return HardwareInfo(model: model, os: os, osVersion: version, fcmToken: fcm);
  }

  Future<LinkResult> link(QrPayload qr) async {
    final hw = await collectHardware();
    final http.Response res;
    try {
      res = await http
          .post(
            Uri.parse('${qr.api}/api/mobile/link'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'token': qr.token,
              'model': hw.model,
              'os': hw.os,
              'osVersion': hw.osVersion,
              'fcmToken': hw.fcmToken,
            }),
          )
          .timeout(const Duration(seconds: 15));
    } on SocketException {
      throw LinkException('Sin conexión con el servidor. Verifica tu red.');
    } on HttpException {
      throw LinkException('No se pudo contactar al servidor.');
    } catch (_) {
      throw LinkException('Tiempo de espera agotado. Intenta de nuevo.');
    }
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw LinkException((body['error'] as String?) ?? 'No se pudo vincular el dispositivo (${res.statusCode}).');
    }
    final device = body['device'] as Map<String, dynamic>;
    final driver = body['driver'] as Map<String, dynamic>?;
    return LinkResult(
      deviceAlias: device['alias'] as String,
      driverName: driver?['name'] as String?,
      plate: body['vehicle'] as String?,
      deviceToken: body['deviceToken'] as String,
    );
  }
}
