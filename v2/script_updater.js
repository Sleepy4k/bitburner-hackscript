import { getPurchasedServer, scriptTemplateName } from "./helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  ns.disableLog("ALL");

  /**
   * In this script i want to make script template updater
   * With logic:
   * 1. Remove old file
   * 2. Copy the newest script template from home source
   */

  // Passing argument from console or script to enable tail mode
  const enableTail = ns.args[0] || false;
  if (enableTail) ns.tail(ns.pid);

  // Get list of all purchased server
  const servers = getPurchasedServer(ns);

  ns.print(`Found ${servers.length} total purchased server`);

  // Loop each server from servers data
  for (const server of servers) {
    ns.print(`Starting update on server ${server}`);

    // Kill all running script, prevent any error or bug
    ns.scriptKill(scriptTemplateName, server);

    // Remove old script template
    const templateStatus = ns.rm(scriptTemplateName, server);

    // Check if file get removed or not, if removed then we copy new script template
    if (templateStatus) ns.scp(scriptTemplateName, server, "home");
    else ns.alert(`Something went wrong when deleting old template (${scriptTemplateName}) in server ${server}`);

    ns.print(`Job finished on server ${server}`);
  }

  ns.print("Update process is complete");

  if (enableTail) {
    // Adding some sleep, just for adding some time to see tail log
    await ns.sleep(5000);

    // Yea yea yea, i know, just cleaning up tail
    ns.closeTail(ns.pid);
  }
}
