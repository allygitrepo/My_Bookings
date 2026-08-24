class BusinessClosureModel {
  int? id;
  int? businessId;
  String? title;
  String? startDate;
  String? endDate;
  String? startTime;
  String? endTime;
  bool? isAllDay;
  String? reason;

  BusinessClosureModel({
    this.id,
    this.businessId,
    this.title,
    this.startDate,
    this.endDate,
    this.startTime,
    this.endTime,
    this.isAllDay,
    this.reason,
  });

  BusinessClosureModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    businessId = json['business_id'];
    title = json['title'];
    startDate = json['start_date'];
    endDate = json['end_date'];
    startTime = json['start_time'];
    endTime = json['end_time'];
    isAllDay = json['is_all_day'] == true || json['is_all_day'] == 1 || json['is_all_day'] == '1';
    reason = json['reason'];
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'business_id': businessId,
      'title': title,
      'start_date': startDate,
      'end_date': endDate,
      'start_time': startTime,
      'end_time': endTime,
      'is_all_day': isAllDay,
      'reason': reason,
    };
  }
}
