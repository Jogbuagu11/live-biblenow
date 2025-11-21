import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:tmwy/core/config/app_config.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class StripeService {
  static Future<void> initialize() async {
    Stripe.publishableKey = AppConfig.stripePublishableKey;
    await Stripe.instance.applySettings();
  }

  static Future<String> createPaymentIntent({
    required int amount,
    String currency = 'usd',
  }) async {
    // This should call your backend API
    final response = await http.post(
      Uri.parse('${AppConfig.appUrl}/api/create-payment-intent'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'amount': amount,
        'currency': currency,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['clientSecret'] as String;
    } else {
      throw Exception('Failed to create payment intent');
    }
  }

  static Future<void> confirmPayment({
    required String paymentIntentClientSecret,
    Map<String, dynamic>? paymentMethodData,
  }) async {
    // For flutter_stripe v11+, confirmPayment requires named parameters only
    // The paymentIntentClientSecret must be passed as a named parameter
    if (paymentMethodData != null) {
      // If payment method data is provided, we need to handle it differently
      // This is a simplified version - you may need to adjust based on your use case
      await Stripe.instance.confirmPayment(
        paymentIntentClientSecret: paymentIntentClientSecret,
      );
    } else {
      await Stripe.instance.confirmPayment(
        paymentIntentClientSecret: paymentIntentClientSecret,
      );
    }
  }
}

