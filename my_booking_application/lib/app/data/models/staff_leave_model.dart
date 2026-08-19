class StaffLeaveModel {
  int? id;
  int? staffId;
  int? businessId;
  String? leaveType;
  String? startDate;
  String? endDate;
  String? startTime;
  String? endTime;
  bool? isAllDay;
  String? approvalStatus;
  String? reason;
  String? staffName;

  StaffLeaveModel({
    this.id,
    this.staffId,
    this.businessId,
    this.leaveType,
    this.startDate,
    this.endDate,
    this.startTime,
    this.endTime,
    this.isAllDay,
    this.approvalStatus,
    this.reason,
    this.staffName,
  });

  StaffLeaveModel.fromJson(Map<String, dynamic> json) {
    id = json['id'] is int
        ? json['id']
        : (json['id'] != null ? int.tryParse(json['id'].toString()) : null);
    staffId = json['staff_id'] is int
        ? json['staff_id']
        : (json['staff_id'] != null ? int.tryParse(json['staff_id'].toString()) : null);
    businessId = json['business_id'] is int
        ? json['business_id']
        : (json['business_id'] != null ? int.tryParse(json['business_id'].toString()) : null);
    leaveType = json['leave_type']?.toString();
    startDate = json['start_date']?.toString();
    endDate = json['end_date']?.toString();
    startTime = json['start_time']?.toString();
    endTime = json['end_time']?.toString();
    isAllDay = json['is_all_day'] == true || json['is_all_day'] == 1 || json['is_all_day'] == '1' || json['is_all_day'] == 'true';
    approvalStatus = json['approval_status']?.toString();
    reason = json['reason']?.toString();

    if (json['staff'] != null) {
      staffName = json['staff']['staff_name']?.toString();
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'staff_id': staffId,
      'business_id': businessId,
      'leave_type': leaveType,
      'start_date': startDate,
      'end_date': endDate,
      'start_time': startTime,
      'end_time': endTime,
      'is_all_day': isAllDay,
      'approval_status': approvalStatus,
      'reason': reason,
      'staff_name': staffName,
    };
  }
}
