/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  /**
   * In this script, i want to make automatic refresh all server with cooldown 5 minute
   */

  // Get list of all purchased server
  const servers = ns.getPurchasedServers();

  ns.tail(ns.pid);

  ns.print(`Found ${servers.length} total purchased server`);

  while (true) {
    // Stop all running script
    ns.exec("stop_all_script.js", "home");

    // Adding some delay so server have some time to prepare it
    await ns.sleep(1000);

    // Run all script
    ns.exec("auto_exec_script.js", "home");
    
    // Cooldown about 5 minute, so we won't to refresh all server everytime
    await ns.sleep(60000 * 5);
  }
}
