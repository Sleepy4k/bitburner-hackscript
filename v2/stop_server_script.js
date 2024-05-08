import { getPurchasedServer, scriptTemplateName } from "./helpers";

/**
 * Function that stop all script
 * @param {NS} ns provide main nat
ive hack function
 * @param {string} server provide server target that currently running the script
 * @param {string} scriptName provide script name that we want to kill
 * @param {boolean=} stopAllScript is we want to kill all script, or maybe just kill script that have same name
 * @return void
 */
export function stopScript(ns, server, scriptName, stopAllScript = false) {
  if (stopAllScript) {
    ns.print(`Stopping all script on server ${server}`);
    ns.killall(server);
    return;
  }

  const isScriptRunning = ns.scriptRunning(scriptName, server);
  if (!isScriptRunning) return;

  ns.print(`Stopping script ${scriptName} on server ${server}`);

  if (stopAllScript) ns.killall(server);
  else ns.scriptKill(scriptName, server);
}

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  // Disable default ns log
  ns.disableLog("sleep");

	/**
   * In this script, i want to make automatic kill running script
   * With logic:
   * 1. Get all purchased server
   * 2. Check if current script is running on that server
   * 3. If running then we stop that script
   */

  // Passing argument from console or script to enable tail mode
  const tailOnRun = ns.args[0] || false;
  if (tailOnRun) ns.tail(ns.pid);

  const stopAllScript = false;

  const servers = getPurchasedServer(ns);

  ns.print(`Found ${servers.length} total purchased server`);

  for (const server of servers) {
    stopScript(ns, server, scriptTemplateName, stopAllScript);
  }

  ns.print("Job finished");

  if (tailOnRun) {
    await ns.sleep(5000);

    ns.closeTail(ns.pid);
  }
}
