import 'package:intl/intl.dart';

class BookingModel {
  int? id;
  int? businessId;
  int? customerId;
  String? bookingDate;
  String? startTime;
  String? endTime;
  String? status; // We'll store it as a string for the UI (Confirmed/Pending)
  double? totalAmount;
  double? paidAmount;

  String? customerName;
  String? serviceName;

  BookingModel({
    this.id,
    this.businessId,
    this.customerId,
    this.bookingDate,
    this.startTime,
    this.endTime,
    this.status,
    this.totalAmount,
    this.paidAmount,
    this.customerName,
    this.serviceName,
  });

  BookingModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    businessId = json['business_id'];
    customerId = json['customer_id'];
    bookingDate = json['booking_date'];
    startTime = json['start_time'];
    endTime = json['end_time'];
    
    // Backend status is BOOLEAN (true = Active/Confirmed, false = Pending/Inactive)
    if (json['status'] is bool) {
      status = json['status'] == true ? 'Confirmed' : 'Pending';
    } else {
      status = json['status']?.toString() ?? 'Pending';
    }
    
    // Parse payments to compute totalAmount and paidAmount
    double totalAmt = 0.0;
    double paidAmt = 0.0;
    if (json['payments'] != null && (json['payments'] as List).isNotEmpty) {
      final paymentsList = json['payments'] as List;
      for (var paymentJson in paymentsList) {
        final double amt = double.tryParse(paymentJson['amount']?.toString() ?? '0.0') ?? 0.0;
        final double paid = double.tryParse(paymentJson['paid_amount']?.toString() ?? '0.0') ?? 0.0;
        final bool isPaid = paymentJson['payment_status'] == true || paymentJson['payment_status'] == 1 || paymentJson['payment_status'] == '1';
        
        totalAmt += amt;
        if (isPaid) {
          paidAmt += paid;
        }
      }
    }
    
    totalAmount = totalAmt > 0 ? totalAmt : (json['total_amount'] != null ? double.tryParse(json['total_amount'].toString()) : 0.0);
    paidAmount = paidAmt;
    
    // Handle nested customer object if provided by backend
    if (json['customer'] != null) {
      customerName = json['customer']['name'];
    } else {
      customerName = 'Customer #$customerId';
    }

    // Extract service names from nested services array (returned by backend)
    if (json['services'] != null && (json['services'] as List).isNotEmpty) {
      final List services = json['services'];
      serviceName = services.map((s) => s['service_name'] ?? 'Unknown Service').join(', ');
    } else {
      serviceName = 'No Service Assigned';
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_id'] = businessId;
    data['customer_id'] = customerId;
    data['booking_date'] = bookingDate;
    data['start_time'] = startTime;
    data['end_time'] = endTime;
    data['status'] = status;
    data['total_amount'] = totalAmount;
    data['paid_amount'] = paidAmount;
    data['customer_name'] = customerName;
    data['service_name'] = serviceName;
    return data;
  }

  String get formattedStartTime {
    if (startTime == null || startTime!.isEmpty) return 'N/A';
    try {
      // Handle HH:mm:ss or HH:mm
      final parts = startTime!.split(':');
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      
      final dateTime = DateTime(2024, 1, 1, hour, minute);
      return DateFormat('h:mm a').format(dateTime);
    } catch (e) {
      return startTime!;
    }
  }
}
