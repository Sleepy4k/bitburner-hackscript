/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  // Disable default ns log
  ns.disableLog("ALL");

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

  ns.print(`Init nuke script for server ${hostName} with profile: ${moneyThreshold} max money and minimum ${securityThreshold} security level`);

  while (true) {
    const currentMoney = ns.getServerMoneyAvailable(hostName);
    const currentSecurityLevel = ns.getServerSecurityLevel(hostName);

    ns.print(`Server currently have ${currentMoney} money and ${currentSecurityLevel} security level`);

    if (currentSecurityLevel > securityThreshold) {
      ns.print(`Try to weaken security level with ${threadCount} total thread`);
      await ns.weaken(hostName, { threads: threadCount });
    } else if (currentMoney < moneyThreshold) {
      ns.print(`Try to grow up server money with ${threadCount} total thread`);
      await ns.grow(hostName, { threads: threadCount });
    } else {
      ns.print(`Try to steal server money with ${threadCount} total thread`);
      await ns.hack(hostName, { threads: threadCount });
    }

    // Sleep ah moment, yea we don't want to get infinity loop right? sleep now
    await ns.sleep(1000);
  }
}
