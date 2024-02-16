import { execScript } from "./auto_exec_script";
import { stopScript } from "../stop_all_running_script";
import { getNukedDomains, scriptTemplateName } from "./helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
	const rootedDomains = getNukedDomains(ns);

  stopScript(ns, "home", null, true);

  ns.exec("auto_upgrade_hacknet.js", "home", 1);
  ns.exec("auto_purchase_server.js", "home", 1);

  execScript(ns, "home", scriptTemplateName, rootedDomains);
}
