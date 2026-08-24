import 'package:intl/intl.dart';

class BookingModel {
  int? id;
  int? businessId;
  int? customerId;
  int? staffId;
  int? locationId;
  String? bookingDate;
  String? startTime;
  String? endTime;
  String? status; // We'll store it as a string for the UI (Confirmed/Pending)
  double? totalAmount;
  double? paidAmount;

  String? customerName;
  String? serviceName;
  String? staffName;

  BookingModel({
    this.id,
    this.businessId,
    this.customerId,
    this.staffId,
    this.locationId,
    this.bookingDate,
    this.startTime,
    this.endTime,
    this.status,
    this.totalAmount,
    this.paidAmount,
    this.customerName,
    this.serviceName,
    this.staffName,
  });

  BookingModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    businessId = json['business_id'];
    if (json['staff_id'] != null) {
      staffId = int.tryParse(json['staff_id'].toString());
    } else if (json['staff'] != null && json['staff']['id'] != null) {
      staffId = int.tryParse(json['staff']['id'].toString());
    }

    if (json['location_id'] != null) {
      locationId = int.tryParse(json['location_id'].toString());
    } else if (json['location'] != null && json['location']['id'] != null) {
      locationId = int.tryParse(json['location']['id'].toString());
    }

    if (json['booking_date'] != null) {
      final String rawDate = json['booking_date'].toString();
      bookingDate = rawDate.contains('T') ? rawDate.split('T')[0] : rawDate;
    }

    startTime = json['start_time'];
    endTime = json['end_time'];
    
    bool? paymentStatus;
    if (json['payment_status'] is bool) {
      paymentStatus = json['payment_status'];
    } else if (json['payment_status'] != null) {
      paymentStatus = json['payment_status'] == 1 || json['payment_status'].toString() == 'true' || json['payment_status'].toString() == '1';
    }

    // Backend uses `booking_status` ('Pending', 'Confirmed', 'Cancelled', 'Completed') for operational status
    if (json['booking_status'] != null && json['booking_status'].toString().isNotEmpty) {
      status = json['booking_status'].toString();
    } else if (json['status'] is String) {
      status = json['status'];
    } else if (json['status'] is bool) {
      status = json['status'] == true ? (paymentStatus == true ? 'Confirmed' : 'Pending') : 'Cancelled';
    } else {
      status = 'Pending';
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

    // Handle nested staff object if provided by backend
    if (json['staff'] != null) {
      staffName = json['staff']['staff_name'];
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_id'] = businessId;
    data['customer_id'] = customerId;
    data['staff_id'] = staffId;
    data['location_id'] = locationId;
    data['booking_date'] = bookingDate;
    data['start_time'] = startTime;
    data['end_time'] = endTime;
    data['status'] = status;
    data['total_amount'] = totalAmount;
    data['paid_amount'] = paidAmount;
    data['customer_name'] = customerName;
    data['service_name'] = serviceName;
    data['staff_name'] = staffName;
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
