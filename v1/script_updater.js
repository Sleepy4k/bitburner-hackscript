import { scriptTemplateName } from "./helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  ns.disableLog("rm");
  ns.disableLog("scp");
  ns.disableLog("scriptKill");

  /**
   * In this script i want to make script template updater
   * With logic:
   * 1. Remove old file
   * 2. Copy the newest script template from home source
   */

  // Get list of all purchased server
  const servers = ns.getPurchasedServers();

  ns.tail(ns.pid);

  ns.print(`Found ${servers.length} total purchased server`);

  servers.forEach(server => {
    ns.print(`Starting update on server ${server}`);

    // Kill all running script, prevent any error or bug
    ns.scriptKill(scriptTemplateName, server);

    // Remove old script template
    const templateStatus = ns.rm(scriptTemplateName, server);

    // Check if file get removed or not, if removed then we copy new script template
    if (templateStatus) ns.scp(scriptTemplateName, server, "home");
    else ns.alert(`Something went wrong when deleting old template (${scriptTemplateName}) in server ${server}`);

    ns.print(`Job finished on server ${server}`);
  });

  ns.print("Update process is complete");

  await ns.sleep(5000);

  ns.closeTail(ns.pid);
}
