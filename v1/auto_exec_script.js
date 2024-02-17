import { getNukedDomains, scriptTemplateName } from "/helpers";

/**
 * Execute script name from targeted server, slice thread into all rooted domains
 * @param {NS} ns provide main native hack function
 * @param {string} server provided targeted server that will handle running script
 * @param {string} scriptName provided script template name
 * @param {array} rootedDomains list domains that already have root access
 * @param {integer=} threadEachScript set thread each script will have, default is 2, better not change this in args
 * @return void
 */
export function execScript(ns, server, scriptName, rootedDomains, threadEachScript = 2) {
  // Get server max ram, with logic, server max ram - current free ram = max server ram
  const serverMaxRAM = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

  // Get current template script ram used
  const totalScriptRAM = ns.getScriptRam(scriptName, server);
  
  // Get script max thread to run
  const scriptThread = Math.floor(serverMaxRAM / totalScriptRAM);

  // Get each domain thread
  const eachDomainThread = Math.ceil(scriptThread / rootedDomains.length);

  // Make an iterator for our loop
  let iterator = 0;

  // Init checker variable to save current iterator domain thread
  let checker = eachDomainThread;

  // Check if thread each script more than each domain thread, or it could make it logic error
  threadEachScript = (threadEachScript > eachDomainThread) ? 1 : threadEachScript;

  for (let i = 0; i < scriptThread; i++) {
    if (i % threadEachScript === 0) {
      const domain = rootedDomains[iterator];

      ns.exec(scriptName, server, threadEachScript, threadEachScript, false, domain);

      if (checker - threadEachScript <= 0) {
        iterator++;
        checker = eachDomainThread;
      } else checker -= threadEachScript
    }
  }
}

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  ns.disableLog("exec");
  ns.disableLog("getScriptRam");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerUsedRam");
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

  ns.tail(ns.pid);

  // Get all purchased server
  const servers = ns.getPurchasedServers();

  // Get domains that already have root access
  const rootedDomains = getNukedDomains(ns);

  // Execute script with current options
  servers.forEach(server => execScript(ns, server, scriptTemplateName, rootedDomains));

  // Adding some sleep, just for adding some time to see tail log
  await ns.sleep(5000);

  // Yea yea yea, i know, just cleaning up tail
  ns.closeTail(ns.pid);
}
