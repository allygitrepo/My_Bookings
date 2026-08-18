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
    id = json['id'];
    staffId = json['staff_id'];
    businessId = json['business_id'];
    leaveType = json['leave_type'];
    startDate = json['start_date'];
    endDate = json['end_date'];
    startTime = json['start_time'];
    endTime = json['end_time'];
    isAllDay = json['is_all_day'] == true || json['is_all_day'] == 1 || json['is_all_day'] == '1';
    approvalStatus = json['approval_status'];
    reason = json['reason'];

    if (json['staff'] != null) {
      staffName = json['staff']['staff_name'];
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
