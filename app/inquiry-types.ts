export type InquiryState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export const initialInquiryState: InquiryState = {
  status: 'idle',
  message: '',
}

export type InquiryConnection = {
  authorized: boolean
  message: string
  publicFormOpen: boolean
  checks: { id: string; label: string; ok: boolean }[]
}
