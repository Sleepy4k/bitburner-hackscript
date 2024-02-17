// How about make an options for passing argument from console run command
const options = [
  ["help", false],
  ["threadTotal", 1],
  ["enableTail", false]
];

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  /**
   * In this script, we want to make server mining more easier
   * So, we must to set domain target name, that we're going to hack
   * Then, open some port if we can and if we have that tools
   * After that, gain root access or admin rights
   * If all done, we do grow, hack, and weaken function
   * 
   * Note : this script only takes 2.80GB which mean, beginner friendly
   */

  // Disable default ns log and enable for grow, hack, and weaken
  ns.disableLog("ALL");
  ns.enableLog("grow");
  ns.enableLog("hack");
  ns.enableLog("weaken");

  // Setup ns flags
  const flags = ns.flags(options);

  // Check if hacker need help
  if (flags.help) {
    ns.tail(ns.pid);
    ns.print("This script function is to make mining server easier");
    ns.print("To run this script you can type");
    ns.print("run ${ns.getScriptName} --enableTail");
    ns.exit();
  }

  // Passing ns args
  const enableTail = flags.enableTail;
  const threadTotal = flags.threadTotal;

  // Check if tail is enabled
  if (enableTail) ns.tail(ns.pid);

  // Defines the "domain server", which is the server
  // that we're going to hack. In this case, it's "n00dles"
  const domain = "n00dles";

  // Defines how much money a server should have before we hack it
  // In this case, it is set to the maximum amount of money.
  const moneyThresh = ns.getServerMaxMoney(domain);

  // Defines the maximum security level the domain server can
  // have. If the domain's security level is higher than this,
  // we'll weaken it before doing anything else
  const securityThresh = ns.getServerMinSecurityLevel(domain);

  // Check if we can do brute ssh on current server, if we already make it then skip it
  if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(domain);

  // Check if we can do crack ftp on current server, if we already make it then skip it
  if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(domain);

  // Check if we can do relay smtp on current server, if we already make it then skip it
  if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(domain);

  // Check if we can do http worm on current server, if we already make it then skip it
  if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(domain);
  
  // Check if we can do sql inject on current server, if we already make it then skip it
  if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(domain);

  // Get root access to domain server
  ns.nuke(domain);

  // Infinite loop that continously hacks/grows/weakens the domain server
  while(true) {
    // If the server's security level is above our threshold, weaken it
    // Else if the server's money is less than our threshold, grow it
    // Otherwise, hack it
    if (ns.getServerSecurityLevel(domain) > securityThresh) await ns.weaken(domain, { threads: threadTotal });
    else if (ns.getServerMoneyAvailable(domain) < moneyThresh) await ns.grow(domain, { threads: threadTotal });
    else await ns.hack(domain, { threads: threadTotal });

    // Set loop wait, prevent infinity loop and make game freezing
    ns.sleep(1000);
  }
}
