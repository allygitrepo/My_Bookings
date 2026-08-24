import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'api_client.dart';
import '../../core/constants/apiConstants.dart';

class RazorpayService extends GetxService {
  late Razorpay _razorpay;
  final ApiClient _apiClient = Get.find<ApiClient>();

  Function(PaymentSuccessResponse)? onSuccessCallback;
  Function(PaymentFailureResponse)? onFailureCallback;

  Future<RazorpayService> init() async {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    return this;
  }

  @override
  void onClose() {
    _razorpay.clear();
    super.onClose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    debugPrint("Razorpay Payment Success: ${response.paymentId}");
    if (onSuccessCallback != null) {
      onSuccessCallback!(response);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint("Razorpay Payment Error: ${response.code} - ${response.message}");
    if (onFailureCallback != null) {
      onFailureCallback!(response);
    } else {
      Get.snackbar(
        'Payment Cancelled / Failed',
        response.message ?? 'Razorpay payment was not completed.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.orange,
        colorText: Colors.white,
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint("Razorpay External Wallet Selected: ${response.walletName}");
  }

  Future<void> initiatePayment({
    required int bookingId,
    required double amount,
    required String customerName,
    required String customerPhone,
    String? customerEmail,
    int? businessId,
    required Function(PaymentSuccessResponse) onSuccess,
    required Function(PaymentFailureResponse) onFailure,
  }) async {
    try {
      onSuccessCallback = onSuccess;
      onFailureCallback = onFailure;

      // 1. Create Razorpay order from Backend API
      final response = await _apiClient.post(ApiConstants.createRazorpayOrder, data: {
        'booking_id': bookingId,
        'amount': amount,
        if (businessId != null) 'business_id': businessId,
      });

      if (response.data['success'] == true && response.data['order'] != null) {
        final orderData = response.data['order'];
        final keyId = response.data['key_id'] ?? 'rzp_test_key';
        final orderId = orderData['id'];

        // 2. Options payload for Razorpay Flutter SDK (Test/Live Mode)
        var options = {
          'key': keyId,
          'amount': (amount * 100).toInt(),
          'name': 'My Bookings',
          'order_id': orderId,
          'description': 'Booking #$bookingId Payment',
          'timeout': 300, // 5 minutes
          'prefill': {
            'contact': customerPhone.isNotEmpty ? customerPhone : '9999999999',
            'email': (customerEmail != null && customerEmail.isNotEmpty) ? customerEmail : 'customer@mybookings.com',
            'name': customerName.isNotEmpty ? customerName : 'Customer',
          },
          'external': {
            'wallets': ['paytm']
          }
        };

        // 3. Open Razorpay SDK Checkout UI Sheet
        _razorpay.open(options);
      } else {
        Get.snackbar(
          'Payment Order Error',
          response.data['message'] ?? 'Unable to initialize Razorpay payment',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      debugPrint("Initiate Razorpay Payment Exception: $e");
      Get.snackbar(
        'Payment Initialization Failed',
        'Could not connect to payment gateway: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  Future<bool> verifyPayment({
    required int bookingId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
    required double amount,
  }) async {
    try {
      final response = await _apiClient.post(ApiConstants.verifyRazorpayPayment, data: {
        'booking_id': bookingId,
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': razorpaySignature,
        'amount': amount,
        'paid_amount': amount,
      });

      if (response.data['success'] == true) {
        Get.snackbar(
          'Payment Verified!',
          'Razorpay payment verified & booking confirmed successfully!',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
        return true;
      } else {
        Get.snackbar(
          'Verification Failed',
          response.data['message'] ?? 'Payment verification failed',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
        return false;
      }
    } catch (e) {
      Get.snackbar(
        'Verification Error',
        'Failed to verify payment with server',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return false;
    }
  }
}
