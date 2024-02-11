/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  const servers = ns.getPurchasedServers();
	const scriptTemplateName = "nuke-template.js";

  ns.tail(ns.pid);

  for (let i = 0; i < servers.length; i++) {
    const server  = servers[i];

    // Get server max ram, with logic, server max ram - current free ram = max server ram
    const serverMaxRAM = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

    // Get current template script ram used
    const totalScriptRAM = ns.getScriptRam(scriptTemplateName, server);
    
    // Get script max thread to run
    const scriptThread = Math.floor(serverMaxRAM / totalScriptRAM);

    const eachDomainThread = scriptThread / 2;

    for (let t = 0; t < scriptThread; t++) {
      const domain = (t < eachDomainThread) ? "n00dles" : "foodnstuff";

      ns.exec(scriptTemplateName, server, 1, 1, false, domain);
    }
  }
}
