import 'package:flutter/material.dart';

class PresenceModePage extends StatelessWidget {
  final String standInId;

  const PresenceModePage({super.key, required this.standInId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Presence Mode'),
      ),
      body: const Center(
        child: Text('Presence Mode Page'),
      ),
    );
  }
}

