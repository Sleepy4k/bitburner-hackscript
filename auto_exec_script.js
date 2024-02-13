import { getRootedDomains } from "/helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
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

  // Script template name, please provided file script name file
	const scriptTemplateName = "nuke-template.js";

  // Get domains that already have root access
  const rootedDomains = await getRootedDomains(ns);

  for (let i = 0; i < servers.length; i++) {
    // Get server name with index same as iterator
    const server  = servers[i];

    // Get server max ram, with logic, server max ram - current free ram = max server ram
    const serverMaxRAM = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

    // Get current template script ram used
    const totalScriptRAM = ns.getScriptRam(scriptTemplateName, server);
    
    // Get script max thread to run
    const scriptThread = Math.floor(serverMaxRAM / totalScriptRAM);

    // Get each domain thread
    let eachDomainThread = Math.ceil(scriptThread / rootedDomains.length);

    // Make an iterator for our loop
    let iterator = 0;

    // Init checker array with length same as rooted domains length and 0 for default value
    let checker = new Array(rootedDomains.length).fill(0);

    for (let t = 0; t < scriptThread; t++) {
      // Here some explain, If checker with index (iterator) less or equal than each domain thread
      // Then make a proccess to execute, else increase iterator value by one
      if (checker[iterator] <= eachDomainThread) {
        // And if index (t) is even then we get current domain and execute script template
        if (t % 2 == 0) {
          const domain = rootedDomains[iterator];

          ns.exec(scriptTemplateName, server, 2, 2, false, domain);
        }
      } else {
        // Just increase iterator value
        iterator++;
      }

      // After we done our stuff above, make sure we increase checker with index (iterator) by one
      checker[iterator]++;
    }
  }

  // Adding some sleep, just for adding some time to see tail log
  await ns.sleep(5000);

  // Yea yea yea, i know, just cleaning up tail
  ns.closeTail(ns.pid);
}
