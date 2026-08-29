export interface WaitlistSignupRequest {
  name: string;
  email: string;
}

export interface WaitlistSignupResponse {
  id: string;
  position: number;
}
