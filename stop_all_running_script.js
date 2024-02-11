/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  /**
   * In this script, i want to make automatic kill running script
   * With logic:
   * 1. Get all purchased server
   * 2. Check if current script is running on that server
   * 3. If running then we stop that script
   */

  const stopAllScript = false;
  const scriptName = "nuke-template.js";

  ns.tail(ns.pid);

  const servers = ns.getPurchasedServers();

  ns.print(`Found ${servers.length} total purchased server`);

  for (let i = 0; i < servers.length; i++) {
    const server = servers[i];

    const isScriptRunning = ns.scriptRunning(scriptName, server);

    if (isScriptRunning) {
      ns.print(`Stopping script ${scriptName} on server ${server}`);

      if (stopAllScript) ns.killall(server);
      else ns.scriptKill(scriptName, server);
    }
  }

  ns.print("Job finished");

  await ns.sleep(5000);

  ns.closeTail(ns.pid);
}
