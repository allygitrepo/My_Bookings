class StaffModel {
  int? id;
  int? businessId;
  String? staffName;
  String? role;
  String? phone;
  String? photo;
  int? slotDurationMinutes;
  bool? status;

  StaffModel({
    this.id,
    this.businessId,
    this.staffName,
    this.role,
    this.phone,
    this.photo,
    this.slotDurationMinutes,
    this.status,
  });

  StaffModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    businessId = json['business_id'];
    staffName = json['staff_name'];
    role = json['role'];
    phone = json['phone'];
    photo = json['photo'];
    slotDurationMinutes = json['slot_duration_minutes'];
    status = json['status'];
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
    return data;
  }
}
