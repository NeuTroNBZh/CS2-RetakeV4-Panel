import { BlockList, isIP } from 'node:net'

const privateRanges = new BlockList()
for (const [network, prefix] of [
  ['127.0.0.0', 8],
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['169.254.0.0', 16],
] as const) {
  privateRanges.addSubnet(network, prefix, 'ipv4')
}
for (const [network, prefix] of [
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
] as const) {
  privateRanges.addSubnet(network, prefix, 'ipv6')
}

const IPV4_MAPPED_PREFIX = '::ffff:'

/**
 * True for loopback, link-local and private (RFC1918 / unique local) peers,
 * i.e. a reverse proxy running on the same host or on a docker network.
 */
export function isPrivateProxy(address: string): boolean {
  const ip = address.toLowerCase().startsWith(IPV4_MAPPED_PREFIX)
    ? address.slice(IPV4_MAPPED_PREFIX.length)
    : address
  const family = isIP(ip)
  if (family === 0) {
    return false
  }
  return privateRanges.check(ip, family === 4 ? 'ipv4' : 'ipv6')
}
