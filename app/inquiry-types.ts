export type InquiryState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export const initialInquiryState: InquiryState = {
  status: 'idle',
  message: '',
}
