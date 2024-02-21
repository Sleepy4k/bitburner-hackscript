import { execScript } from "./execute_script";
import { stopScript } from "./stop_server_script";
import { getPurchasedServer, getNukedDomains, scriptTemplateName } from "./helpers";

const options = [
  ["help", false],
  ["enableTail", false],
  ["disableHomeExec", false]
];

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  // Disable default ns log
  ns.disableLog("ALL");

  // Register flags schema
  const flags = ns.flags(options);

  // Check if help flag is on
  if (flags.help) {
    ns.tprint("Run default auto script file and exec nuke template for home server");
    ns.tprint("To run this script you can use flag like this : ");
    ns.tprint("run init.js --help --enableTail --disableHomeExec");
    ns.exit();
  }

  // Check if enable tail flag is on
  if (flags.enableTail) ns.tail(ns.pid);

  // Scan home server, don't remove this, prevent error in execute script due no server has been nuked
  getNukedDomains(ns);

  // Kill all running script in home server, prevent lack of ram in home server
  stopScript(ns, "home", null, true);

  // Run handler server script
  ns.exec("handle_server.js", "home", 1);

  // Run handle hacknet node script
  ns.exec("handle_hacknet.js", "home", 1);

  // Get rooted domain data list
  const rootedDomains = getNukedDomains(ns);

  // Check if disable home is on, if true then we run script template on home server too
  if (!flags.disableHomeExec) {

    // Execute script template on home server
    execScript(ns, "home", scriptTemplateName, rootedDomains);
  }

  const servers = getPurchasedServer(ns);

  if (servers.length >= 1) {
    for (const server of servers) {
      stopScript(ns, server, scriptTemplateName, true);
    }

    for (const server of servers) {
      execScript(ns, server, scriptTemplateName, rootedDomains);
    }
  }

  // Check if enable tail flag is on, if on then we close tail
  if (flags.enableTail) {
    await ns.sleep(5000);
    ns.closeTail(ns.pid);
  }
}
