import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'scan_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.prefs});
  final SharedPreferences prefs;
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String? get alias => widget.prefs.getString('device_alias');
  String? get driver => widget.prefs.getString('driver_name');
  String? get plate => widget.prefs.getString('plate');

  Future<void> _scan() async {
    final linked = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => ScanPage(prefs: widget.prefs)));
    if (linked == true && mounted) setState(() {});
  }

  Future<void> _unlink() async {
    await widget.prefs.remove('device_token');
    await widget.prefs.remove('device_alias');
    await widget.prefs.remove('driver_name');
    await widget.prefs.remove('plate');
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final linked = widget.prefs.getString('device_token') != null;
    return Scaffold(
      appBar: AppBar(title: const Text('EnRuta Conductor')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Icon(linked ? Icons.verified : Icons.qr_code_scanner, size: 88, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 16),
          Text(linked ? 'Dispositivo vinculado' : 'Vincula este dispositivo', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          if (linked) ...[
            Text('${alias ?? ''}\nConductor: ${driver ?? 'Sin asignar'}\nVehículo: ${plate ?? 'Sin asignar'}', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            OutlinedButton(onPressed: _unlink, child: const Text('Desvincular en este teléfono')),
          ] else ...[
            const Text('En el panel web abre Dispositivos → selecciona el equipo → “Generar código QR” y escanéalo aquí.', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            FilledButton.icon(onPressed: _scan, icon: const Icon(Icons.qr_code_scanner), label: const Text('Escanear código QR')),
          ],
        ]),
      ),
    );
  }
}
