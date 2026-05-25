class ServiceModel {
  int? id;
  int? businessId;
  String? serviceName;
  double? durationMinutes;
  double? price;
  double? minimumBookingCharge;
  bool? status;

  ServiceModel({
    this.id,
    this.businessId,
    this.serviceName,
    this.durationMinutes,
    this.price,
    this.minimumBookingCharge,
    this.status,
  });

  ServiceModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    businessId = json['business_id'];
    serviceName = json['service_name'];
    durationMinutes = json['duration_minutes'] != null 
        ? double.tryParse(json['duration_minutes'].toString()) 
        : null;
    price = json['price'] != null 
        ? double.tryParse(json['price'].toString()) 
        : null;
    minimumBookingCharge = json['minimum_booking_charge'] != null 
        ? double.tryParse(json['minimum_booking_charge'].toString()) 
        : null;
    status = json['status'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_id'] = businessId;
    data['service_name'] = serviceName;
    data['duration_minutes'] = durationMinutes;
    data['price'] = price;
    data['minimum_booking_charge'] = minimumBookingCharge;
    data['status'] = status;
    return data;
  }
}
