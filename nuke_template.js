/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  const threadCount = ns.args[0] || 1;
  const tailOnRun = ns.args[1] || false;
  const hostName = ns.args[2] || "foodnstuff";
  
  if (tailOnRun) ns.tail(ns.pid);

  while (true) {
    const isRootGranted = ns.hasRootAccess(hostName);

    if (!isRootGranted) {
      ns.nuke(hostName);
    } else {
	    const securityThreshold  = ns.getServerMinSecurityLevel(hostName) + 5;

      if (ns.getServerSecurityLevel(hostName) > securityThreshold) {
        await ns.weaken(hostName, { threads: threadCount });
        return;
      }

	    const moneyThreshold = ns.getServerMaxMoney(hostName) * .8;

      if (ns.getServerMoneyAvailable(hostName) < moneyThreshold) await ns.grow(hostName, { threads: threadCount });
      else await ns.hack(hostName, { threads: threadCount });
    }

    await ns.sleep(1000);
  }
}
