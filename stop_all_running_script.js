/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  ns.tail(ns.pid);

  const servers = ns.getPurchasedServers();

  for (let i = 0; i < servers.length; i++) {
    const server = servers[i];
    ns.killall(server);
  }
}
