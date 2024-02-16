/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  ns.disableLog("getServerMaxMoney");
  ns.disableLog("getServerSecurityLevel");
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("getServerMinSecurityLevel");

  /**
   * In this script, basically we just make system weak
   * When we don't reach min server security level
   * And grow server money when don't reach our minimum threshold
   * Then we steal server money done
   */

  // This is some argument, please don't mind it
  const threadCount = ns.args[0] || 1;
  const tailOnRun = ns.args[1] || false;
  const hostName = ns.args[2] || "foodnstuff"; // Keep in note, that you can change this default value with n00dles or something

  if (tailOnRun) ns.tail(ns.pid);

  // Get hostname maximum money, ofcouse with formula, max money * 0.85
  const moneyThreshold = ns.getServerMaxMoney(hostName) * .85;

  // Get minimum security level for hostname, i increase it with 2
  // So we can do some stuff first
  const securityThreshold  = ns.getServerMinSecurityLevel(hostName) + 2;

  while (true) {
    // Check if current server security level is less than minimum server security level
    // If not, then we make server security level weak
    if (ns.getServerSecurityLevel(hostName) < securityThreshold) {
      // After we reach server minimum security level
      // First we check if current server money is less than maximum server money
      // If not then we spoof their money, before we steal it (senku moment, please don't mind it haha)
      if (ns.getServerMoneyAvailable(hostName) < moneyThreshold) await ns.grow(hostName, { threads: threadCount });
      else await ns.hack(hostName, { threads: threadCount });
    } else {
      // Just make server security weak
      await ns.weaken(hostName, { threads: threadCount });
    }

    // Sleep ah moment, yea we don't want to get infinity loop right? sleep now
    await ns.sleep(1000);
  }
}
