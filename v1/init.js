import { execScript } from "./auto_exec_script";
import { stopScript } from "./stop_all_running_script";
import { getNukedDomains, scriptTemplateName } from "./helpers";

const options = [
  ["help", false],
  ["enableTail", false],
  ["disableHomeExec", true]
];

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  ns.disableLog("sleep");

  const flags = ns.flags(options);

  if (flags.help) {
    ns.tprint("Run default auto script file and exec nuke template for home server");
    ns.tprint("To run this script you can use flag like this : ");
    ns.tprint("run init.js --help --enableTail --disableHomeExec");
    ns.exit();
  }

  if (flags.enableTail) ns.tail(ns.pid);

  stopScript(ns, "home", null, true);

  ns.exec("auto_upgrade_hacknet.js", "home", 1);
  ns.exec("auto_purchase_server.js", "home", 1);

  if (flags.disableHomeExec) {
    const rootedDomains = getNukedDomains(ns);

    execScript(ns, "home", scriptTemplateName, rootedDomains);
  }

  if (flags.enableTail) {
    await ns.sleep(5000);
    ns.closeTail(ns.pid);
  }
}
