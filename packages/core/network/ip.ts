import os from "os";

/**
 * Retrieves the first non-internal IPv4 address of the machine.
 * Throws an error if no valid address is found.
 * Returns the IPv4 address as a string.
 */
export function getIpv4Address() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    if (!interfaces[name]) continue;
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  throw new Error("No external IPv4 address found");
}
