import { execScript } from "./execute_script";
import { serverDomainPrefix, getNukedDomains, scriptTemplateName } from "./helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  // Disable ns log
  ns.disableLog("ALL");

  const loopSleep = 5;

  const minimumServerRAM = 8;

  const upgradeEachXServer = 5;

  const ramLimit = ns.getPurchasedServerMaxRam();

  let maxPurchaseableRAM = ns.getServerMaxRam("home");

  if (maxPurchaseableRAM > ramLimit) maxPurchaseableRAM = ramLimit;

  ns.print(`Initial server handler with minimum ram ${minimumServerRAM}GB and max ram ${maxPurchaseableRAM}GB`);

  // Also we need to know how many server we can purchase
  const totalPurchaseableServer = ns.getPurchasedServerLimit() + upgradeEachXServer;

  while (true) {
    // Get domains that already have root access
    const rootedDomains = getNukedDomains(ns);

    const purchasedServer = ns.getPurchasedServers();
    let totalPurchasedServer = purchasedServer.length + upgradeEachXServer;

    const serverMoneyAvailable = ns.getServerMoneyAvailable("home");

    if (totalPurchasedServer < totalPurchaseableServer) {
      if (totalPurchasedServer % upgradeEachXServer != 0 && serverMoneyAvailable >= ns.getPurchasedServerCost(minimumServerRAM)) {
        totalPurchaseableServer++;
        const serverName = serverDomainPrefix + "-" + totalPurchaseableServer;

        ns.purchaseServer(serverName, minimumServerRAM);
        ns.print(`buying new server with ram ${minimumServerRAM}GB with name ${serverName}`);

        // Hard copy template file to new server from home domain
        ns.scp(scriptTemplateName, server, "home");

        // Execute script with current options
        execScript(ns, serverName, scriptTemplateName, rootedDomains);
      } else {
        const serverAlreadyUpgraded = totalPurchasedServer - upgradeEachXServer;

        for (let i = 1; i <= totalPurchasedServer; i++) {
          if (i < serverAlreadyUpgraded) continue;

          const server = purchasedServer[i];
          const amoutNewRAM = ns.getServerMaxRam(server) * 2;

          if (serverMoneyAvailable < ns.getPurchasedServerUpgradeCost(server, amoutNewRAM)) return;

          ns.print(`Upgrade server ${server} to new ram ${amoutNewRAM}GB`);

          // Kill all running script
          ns.killall(server);

          ns.upgradePurchasedServer(server, amoutNewRAM);
          
          // Hard copy template file to new server from home domain
          ns.scp(scriptTemplateName, server, "home");

          // Execute script with current options
          execScript(ns, server, scriptTemplateName, rootedDomains);
        }
      }
    }

    if (totalPurchasedServer == totalPurchaseableServer) {
      const reversedPurchasedServer = purchasedServer.reverse();
      const lastestServerMaxRAM = ns.getServerMaxRam(reversedPurchasedServer[0]);

      if (lastestServerMaxRAM >= maxPurchaseableRAM) {
        ns.print("All server already maxed out, stopping script");
        break;
      }
    }

    await ns.sleep(loopSleep * 1000);
  }
}
