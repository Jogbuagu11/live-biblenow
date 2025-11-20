import 'package:flutter/material.dart';

class EventDetailsPage extends StatelessWidget {
  final String eventType;

  const EventDetailsPage({super.key, required this.eventType});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Event Details: $eventType'),
      ),
      body: const Center(
        child: Text('Event Details Page'),
      ),
    );
  }
}

