class ServiceModel {
  int? id;
  int? businessId;
  String? serviceName;
  double? durationMinutes;
  double? price;
  double? minimumBookingCharge;
  bool? status;
  List<int>? locationIds;

  List<int>? get safeLocationIds => locationIds;

  ServiceModel({
    this.id,
    this.businessId,
    this.serviceName,
    this.durationMinutes,
    this.price,
    this.minimumBookingCharge,
    this.status,
    this.locationIds,
  });

  ServiceModel.fromJson(Map<String, dynamic> json) {
    id = json['id'] is int
        ? json['id']
        : (json['id'] != null ? int.tryParse(json['id'].toString()) : null);
    businessId = json['business_id'] is int
        ? json['business_id']
        : (json['business_id'] != null ? int.tryParse(json['business_id'].toString()) : null);
    serviceName = json['service_name']?.toString();
    durationMinutes = json['duration_minutes'] != null 
        ? double.tryParse(json['duration_minutes'].toString()) 
        : null;
    price = json['price'] != null 
        ? double.tryParse(json['price'].toString()) 
        : null;
    minimumBookingCharge = json['minimum_booking_charge'] != null 
        ? double.tryParse(json['minimum_booking_charge'].toString()) 
        : null;
    status = json['status'] == true || json['status'] == 1 || json['status'] == '1' || json['status'] == 'true';

    try {
      if (json['locations'] != null && (json['locations'] as List).isNotEmpty) {
        locationIds = (json['locations'] as List)
            .map((loc) => int.tryParse(loc['id']?.toString() ?? '') ?? -1)
            .where((id) => id != -1)
            .toList();
      } else if (json['location_id'] != null) {
        final locId = int.tryParse(json['location_id'].toString());
        if (locId != null) locationIds = [locId];
      }
    } catch (_) {}
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
    data['location_ids'] = locationIds;
    return data;
  }
}
