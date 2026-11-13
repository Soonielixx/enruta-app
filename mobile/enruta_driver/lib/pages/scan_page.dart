import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/link_service.dart';

class ScanPage extends StatefulWidget {
  const ScanPage({super.key, required this.prefs});
  final SharedPreferences prefs;
  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage> {
  final _controller = MobileScannerController(formats: const [BarcodeFormat.qrCode]);
  final _service = LinkService();
  bool _busy = false;
  String? _error;

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy) return;
    final raw = capture.barcodes.map((b) => b.rawValue).whereType<String>().firstOrNull;
    if (raw == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    await _controller.stop();
    try {
      final result = await _service.link(QrPayload.parse(raw));
      await widget.prefs.setString('device_token', result.deviceToken);
      await widget.prefs.setString('device_alias', result.deviceAlias);
      if (result.driverName != null) await widget.prefs.setString('driver_name', result.driverName!);
      if (result.plate != null) await widget.prefs.setString('plate', result.plate!);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Dispositivo vinculado correctamente.')));
      Navigator.of(context).pop(true);
    } on LinkException catch (e) {
      setState(() => _error = e.message);
      await _controller.start();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Escanear código QR')),
      body: Stack(children: [
        MobileScanner(controller: _controller, onDetect: _onDetect),
        if (_busy) const Center(child: CircularProgressIndicator()),
        if (_error != null)
          Positioned(
            left: 16, right: 16, bottom: 32,
            child: Material(
              color: Colors.red.shade700, borderRadius: BorderRadius.circular(10),
              child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [
                const Icon(Icons.cancel, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(child: Text(_error!, style: const TextStyle(color: Colors.white))),
              ])),
            ),
          ),
      ]),
    );
  }
}
