export const APP_STATUS = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' }

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
