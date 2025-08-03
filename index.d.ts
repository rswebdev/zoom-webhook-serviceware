type WebHookBody<T> = {
  event: string;
  payload: T;
  event_ts?: number;
};

type WebHookBodyCallConnect = {
  call_id: string;
  caller: CallerCalleeEventData;
  callee: CallerCalleeEventData;
  ringing_start_time: string;
  connected_start_time: string;
}

type WebHookBodyCallDisconnect = {
  call_id: string;
  caller: CallerCalleeEventData;
  callee: CallerCalleeEventData;
  ringing_start_time: string;
  answer_start_time: string;
  call_end_time: string;
  // Note: "handup_result" is a typo in the original Zoom documentation, probably meant to be "hangup_result"
  handup_result: "Call connected" | "Call Cancel" | "Voicemail";
}

type WebHookBodyURLValidation = {
  plainToken: string;
}

type WebHookBodyValidationResponse = {
  plainToken: string;
  encryptedToken: string;
}

type CallerCalleeEventData = {
  extension_id?: string;
  extension_type?: "user"|"callQueue"|"autoReceptionist"|"commonArea"|"commonAreaPhone"|"sharedLineGroup"|"zoomRoom"|"ciscoRoom/PolycomRoom"|"contactCenter"|"pstn"|"five9"|"twilio";
  extension_number?: string;
  timezone?: string;
  device_type?: string;
  device_id?: string;
  connection_type?: "pstn_off_net"|"voip"|"pstn_on_net"|"contact_center"|"byop";
  user_id?: string;
  name?: string;
  phone_number: string;
}

type ServicewareOnCallPostData = {
  toNumber: string;
  fromNumber: string;
}