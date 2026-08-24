class StaffAvailabilityModel {
  int? id;
  int? staffId;
  int? locationId;
  String? dayOfWeek;
  String? startTime;
  String? endTime;
  bool? status;

  StaffAvailabilityModel({
    this.id,
    this.staffId,
    this.locationId,
    this.dayOfWeek,
    this.startTime,
    this.endTime,
    this.status,
  });

  StaffAvailabilityModel.fromJson(Map<String, dynamic> json) {
    id = json['id'] is int
        ? json['id']
        : (json['id'] != null ? int.tryParse(json['id'].toString()) : null);
    staffId = json['staff_id'] is int
        ? json['staff_id']
        : (json['staff_id'] != null ? int.tryParse(json['staff_id'].toString()) : null);
    locationId = json['location_id'] is int
        ? json['location_id']
        : (json['location_id'] != null ? int.tryParse(json['location_id'].toString()) : null);
    dayOfWeek = json['day_of_week']?.toString();
    startTime = json['start_time']?.toString();
    endTime = json['end_time']?.toString();
    status = json['status'] == true || json['status'] == 1 || json['status'] == '1' || json['status'] == 'true';
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['staff_id'] = staffId;
    data['location_id'] = locationId;
    data['day_of_week'] = dayOfWeek;
    data['start_time'] = startTime;
    data['end_time'] = endTime;
    data['status'] = status;
    return data;
  }
}
