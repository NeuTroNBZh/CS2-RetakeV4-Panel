export function assertProductionUrl(appUrl: string, nodeEnv: string): void {
  if (nodeEnv !== 'production') {
    return
  }
  let protocol = ''
  try {
    protocol = new URL(appUrl).protocol
  } catch {
    protocol = ''
  }
  if (protocol !== 'https:') {
    throw new Error('APP_URL must use https in production (Steam login and secure cookies need it)')
  }
}
