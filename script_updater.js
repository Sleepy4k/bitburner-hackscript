/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  /**
   * In this script i want to make script template updater
   * With logic:
   * 1. Remove old file
   * 2. Copy the newest script template from home source
   */

  // Get list of all purchased server
  const servers = ns.getPurchasedServers();

  // Script template name
	const scriptTemplateName = "nuke-template.js";

  ns.tail(ns.pid);

  ns.print(`Found ${servers.length} total purchased server`);

  for (let i = 0; i < servers.length; i++) {
    const server  = servers[i];

    ns.print(`Starting update on server ${server}`);

    // Kill all running script, prevent any error or bug
    ns.scriptKill(scriptTemplateName, server);

    // Remove old script template
    const status = ns.rm(scriptTemplateName, server);

    // Check if file get removed or not, if removed then we copy new script template
    if (status) ns.scp(scriptTemplateName, server, "home");
    else ns.alert(`Something went wrong when deleting old script (${scriptTemplateName}) in server ${server}`);

    ns.print("Job finished");
  }

  ns.print("Update process is complete");

  await ns.sleep(5000);

  ns.closeTail(ns.pid);
}
