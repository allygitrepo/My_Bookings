class LocationModel {
  int? id;
  int? businessId;
  String? locationName;
  String? address;
  String? city;
  String? state;
  String? locationType;
  String? meetingLink;
  bool? status;

  LocationModel({
    this.id,
    this.businessId,
    this.locationName,
    this.address,
    this.city,
    this.state,
    this.locationType,
    this.meetingLink,
    this.status,
  });

  LocationModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    businessId = json['business_id'];
    locationName = json['location_name'] ?? json['name'];
    address = json['address'];
    city = json['city'];
    state = json['state'];
    locationType = json['location_type'];
    meetingLink = json['meeting_link'];
    status = json['status'] is bool ? json['status'] : json['status'] == 1;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_id'] = businessId;
    data['location_name'] = locationName;
    data['address'] = address;
    data['city'] = city;
    data['state'] = state;
    data['location_type'] = locationType;
    data['meeting_link'] = meetingLink;
    data['status'] = status;
    return data;
  }
}
