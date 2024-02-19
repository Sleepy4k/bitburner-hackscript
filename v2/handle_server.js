import { execScript } from "./v2/execute_script";
import { serverDomainPrefix, getPurchasedServer, getNukedDomains, scriptTemplateName } from "./v2/helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  // Disable ns log
  ns.disableLog("ALL");

  ns.tail(ns.pid);

  const loopSleep = 5;
  const minimumServerRAM = 8;
  const upgradeEachXServer = 5;
  const ramLimit = ns.getPurchasedServerMaxRam();
  const totalPurchaseableServer = ns.getPurchasedServerLimit();

  let upgradeFlag = false;
  let purchasedServer = getPurchasedServer(ns);
  let currentMaxRAMUpgrade = minimumServerRAM * 2;
  let maxPurchaseableRAM = Math.min(ns.getServerMaxRam("home"), ramLimit);

  if (purchasedServer.length > 0 && ns.getServerMaxRam(purchasedServer[0]) > currentMaxRAMUpgrade) {
    currentMaxRAMUpgrade = ns.getServerMaxRam(purchasedServer[0]);
  }

  ns.print(`Initial server handler with minimum ram ${minimumServerRAM}GB and max ram ${maxPurchaseableRAM}GB`);

  function updatePurchasedServerList() {
    purchasedServer = purchasedServer.length > 1 ? purchasedServer.sort((a, b) => ns.getServerMaxRam(a) - ns.getServerMaxRam(b)) : purchasedServer;
  }

  while (true) {
    const rootedDomains = getNukedDomains(ns);
    let totalPurchasedServer = purchasedServer.length;

    updatePurchasedServerList();

    while (totalPurchasedServer < totalPurchaseableServer && !upgradeFlag) {
      const serverCost = ns.getPurchasedServerCost(minimumServerRAM);

      if (ns.getServerMoneyAvailable("home") >= serverCost) {
        totalPurchasedServer++;

        const serverName = ns.purchaseServer(`${serverDomainPrefix}-${totalPurchasedServer}`, minimumServerRAM);

        purchasedServer.push(serverName);
        updatePurchasedServerList();

        ns.print(`buying new server with ram ${minimumServerRAM}GB with name ${serverName}`);
        ns.scp(scriptTemplateName, serverName, "home");

        execScript(ns, serverName, scriptTemplateName, rootedDomains);
      }

      upgradeFlag = totalPurchasedServer % upgradeEachXServer === 0;
      await ns.sleep(loopSleep * 1000);
    }

    while (upgradeFlag) {
      let isServerAlreadyMax = true;

      for (const server of purchasedServer) {
        if (ns.getServerMaxRam(server) >= currentMaxRAMUpgrade) continue;

        if (ns.getServerMoneyAvailable("home") >= ns.getPurchasedServerUpgradeCost(server, currentMaxRAMUpgrade)) {
          ns.killall(server);

          ns.upgradePurchasedServer(server, currentMaxRAMUpgrade);

          ns.print(`Upgrade server ${server} to new ram ${currentMaxRAMUpgrade}GB`);

          ns.scp(scriptTemplateName, server, "home");

          execScript(ns, server, scriptTemplateName, rootedDomains);

          isServerAlreadyMax = false;
          updatePurchasedServerList();
        }
      }

      upgradeFlag = !isServerAlreadyMax;
      await ns.sleep(loopSleep * 1000);
    }

    if (totalPurchasedServer === totalPurchaseableServer && !upgradeFlag && currentMaxRAMUpgrade === maxPurchaseableRAM) break;
    else if (currentMaxRAMUpgrade < maxPurchaseableRAM && totalPurchasedServer === totalPurchaseableServer && !upgradeFlag) {
      upgradeFlag = true;
      updatePurchasedServerList();

      if (ns.getServerMaxRam(purchasedServer[0]) >= currentMaxRAMUpgrade) {
        currentMaxRAMUpgrade = currentMaxRAMUpgrade * 2 >= maxPurchaseableRAM ? maxPurchaseableRAM : currentMaxRAMUpgrade * 2;
      }
    }

    await ns.sleep(loopSleep * 1000);
  }
}
