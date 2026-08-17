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
    id = json['id'];
    staffId = json['staff_id'];
    locationId = json['location_id'];
    dayOfWeek = json['day_of_week'];
    startTime = json['start_time'];
    endTime = json['end_time'];
    status = json['status'] is bool ? json['status'] : json['status'] == 1;
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
