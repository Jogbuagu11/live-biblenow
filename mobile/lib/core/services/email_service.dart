import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:tmwy/core/config/app_config.dart';

class EmailService {
  static Future<void> sendEmail({
    required String to,
    required String subject,
    String? html,
    String? text,
  }) async {
    // This should call your backend API that uses Resend
    final response = await http.post(
      Uri.parse('${AppConfig.appUrl}/api/send-email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'to': to,
        'subject': subject,
        'html': html,
        'text': text,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to send email: ${response.body}');
    }
  }

  static Future<void> sendWelcomeEmail(String email, String name) async {
    await sendEmail(
      to: email,
      subject: 'Welcome to TMWY',
      html: '''
        <h1>Welcome to TMWY, $name!</h1>
        <p>Thank you for joining Take Me With You. We're here to help you when you can't be there.</p>
      ''',
      text: 'Welcome to TMWY, $name! Thank you for joining Take Me With You.',
    );
  }

  static Future<void> sendStandInRequestEmail(
    String email,
    String eventDetails,
  ) async {
    await sendEmail(
      to: email,
      subject: 'New Stand-In Request',
      html: '''
        <h1>New Stand-In Request</h1>
        <p>You have a new stand-in request:</p>
        <p>$eventDetails</p>
      ''',
      text: 'New Stand-In Request: $eventDetails',
    );
  }

  static Future<void> sendStandInAcceptedEmail(
    String email,
    String standInName,
  ) async {
    await sendEmail(
      to: email,
      subject: 'Stand-In Request Accepted',
      html: '''
        <h1>Your Stand-In Request Has Been Accepted</h1>
        <p>$standInName has accepted your stand-in request.</p>
      ''',
      text: 'Your Stand-In Request Has Been Accepted by $standInName',
    );
  }
}

