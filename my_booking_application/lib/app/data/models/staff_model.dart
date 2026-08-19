import 'staff_availability_model.dart';
import 'location_model.dart';

class StaffModel {
  int? id;
  int? businessId;
  String? staffName;
  String? role;
  String? phone;
  String? photo;
  int? slotDurationMinutes;
  bool? status;
  List<StaffAvailabilityModel>? availabilities;
  List<LocationModel>? locations;
  List<int>? serviceIds;

  StaffModel({
    this.id,
    this.businessId,
    this.staffName,
    this.role,
    this.phone,
    this.photo,
    this.slotDurationMinutes,
    this.status,
    this.availabilities,
    this.locations,
    this.serviceIds,
  });

  StaffModel.fromJson(Map<String, dynamic> json) {
    id = json['id'] is int
        ? json['id']
        : (json['id'] != null ? int.tryParse(json['id'].toString()) : null);
    businessId = json['business_id'] is int
        ? json['business_id']
        : (json['business_id'] != null ? int.tryParse(json['business_id'].toString()) : null);
    staffName = json['staff_name']?.toString();
    role = json['role']?.toString();
    phone = json['phone']?.toString();
    photo = json['photo']?.toString();
    slotDurationMinutes = json['slot_duration_minutes'] != null
        ? int.tryParse(json['slot_duration_minutes'].toString())
        : null;
    status = json['status'] == true || json['status'] == 1 || json['status'] == '1' || json['status'] == 'true';

    if (json['availabilities'] != null && (json['availabilities'] as List).isNotEmpty) {
      availabilities = (json['availabilities'] as List)
          .map((a) => StaffAvailabilityModel.fromJson(a))
          .toList();
    }

    if (json['locations'] != null && (json['locations'] as List).isNotEmpty) {
      locations = (json['locations'] as List)
          .map((l) => LocationModel.fromJson(l))
          .toList();
    }

    if (json['service_ids'] != null && (json['service_ids'] as List).isNotEmpty) {
      serviceIds = (json['service_ids'] as List)
          .map((id) => int.tryParse(id.toString()) ?? 0)
          .where((id) => id > 0)
          .toList();
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_id'] = businessId;
    data['staff_name'] = staffName;
    data['role'] = role;
    data['phone'] = phone;
    data['photo'] = photo;
    data['slot_duration_minutes'] = slotDurationMinutes;
    data['status'] = status;
    if (availabilities != null) {
      data['availabilities'] = availabilities!.map((v) => v.toJson()).toList();
    }
    if (locations != null) {
      data['locations'] = locations!.map((v) => v.toJson()).toList();
    }
    if (serviceIds != null) {
      data['service_ids'] = serviceIds;
    }
    return data;
  }
}
