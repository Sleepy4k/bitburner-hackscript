import { getPurchasedServer, getNukedDomains, scriptTemplateName } from "./helpers";

/**
 * Execute script name from targeted server, slice thread into all rooted domains
 * @param {NS} ns provide main native hack function
 * @param {string} server provided targeted server that will handle running script
 * @param {string} scriptName provided script template name
 * @param {array} rootedDomains list domains that already have root access
 * @return void
 */
export function execScript(ns, server, scriptName, rootedDomains) {
  ns.disableLog("exec");
  ns.disableLog("getScriptRam");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerUsedRam");

  // Check if rooted domain data is empty, if true then skip execute scripts
  if (rootedDomains.filter(str => str !== '').length < 1) {
    ns.print("Execute skipped due total rooted domains is less than 1, please nuke 1 of those domaines");
    return;
  }

  // Get server max ram, with logic, server max ram - current free ram = max server ram
  const serverMaxRAM = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

  // Get current template script ram used
  const totalScriptRAM = ns.getScriptRam(scriptName, server);
  
  // Get script max thread to run
  const scriptThread = Math.floor(serverMaxRAM / totalScriptRAM);

  // Get each domain thread
  const eachDomainThread = Math.floor(scriptThread / rootedDomains.length);

  for (let i = 0; i < rootedDomains.length; i++) {
    ns.exec(scriptName, server, eachDomainThread, eachDomainThread, false, rootedDomains[i]);
  }
}

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  ns.disableLog("getPurchasedServers");

	/**
   * In this script, i want to make automation for exec script template on all purchased server
   * With logic:
   * 1. Get all purchased server
   * 2. Get current server max ram
   * 3. Get total thread that script template need
   * 4. Get all domains that have root access
   * 5. Calculate each domain thread,
   *    for example 4 domains and 32 script thread so we have 8 thread each domain
   * 6. Execute script template with 2 thread, so from 8 thread divided by 2, we got 4 script running
   */

  // Passing argument from console or script to enable tail mode
  const tailOnRun = ns.args[0] || false;
  if (tailOnRun) ns.tail(ns.pid);

  // Get all purchased server
  const servers = getPurchasedServer(ns);

  // Get domains that already have root access
  const rootedDomains = getNukedDomains(ns);

  // Execute script with current options
  for (const server of servers) {
    execScript(ns, server, scriptTemplateName, rootedDomains);
  }

  if (tailOnRun) {
    // Adding some sleep, just for adding some time to see tail log
    await ns.sleep(5000);

    // Yea yea yea, i know, just cleaning up tail
    ns.closeTail(ns.pid);
  }
}
