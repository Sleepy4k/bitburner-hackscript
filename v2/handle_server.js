import { execScript } from "./execute_script";
import { serverDomainPrefix, getPurchasedServer, getNukedDomains, scriptTemplateName } from "./helpers";

const LOOP_SLEEP = 5;
const MINIMUM_SERVER_RAM = 8;
const UPGRADE_EACH_X_SERVER = 5;

/**
 * Update the list of purchased servers
 * @param {NS} ns provide main native hack function
 * @param {Array} purchasedServer list of purchased servers
 * @return {Array} updated list of purchased servers
 */
function updatePurchasedServerList(ns, purchasedServer) {
  return purchasedServer.length > 1 ? purchasedServer.sort((a, b) => ns.getServerMaxRam(a) - ns.getServerMaxRam(b)) : purchasedServer;
}

/**
 * Purchase a new server
 * @param {NS} ns provide main native hack function
 * @param {Number} totalPurchasedServer total number of purchased servers
 * @param {Array} purchasedServer list of purchased servers
 * @param {Array} rootedDomains list of rooted domains
 * @return {Array} updated list of purchased servers
 */
function purchaseServer(ns, totalPurchasedServer, purchasedServer, rootedDomains) {
  const serverCost = ns.getPurchasedServerCost(MINIMUM_SERVER_RAM);

  if (ns.getServerMoneyAvailable("home") >= serverCost) {
    totalPurchasedServer++;

    const serverName = ns.purchaseServer(`${serverDomainPrefix}-${totalPurchasedServer}`, MINIMUM_SERVER_RAM);
    purchasedServer.push(serverName);

    ns.print(`buying new server with ram ${MINIMUM_SERVER_RAM}GB with name ${serverName}`);
    ns.scp(scriptTemplateName, serverName, "home");

    execScript(ns, serverName, scriptTemplateName, rootedDomains);
    purchasedServer = updatePurchasedServerList(ns, purchasedServer);
  }

  return purchasedServer;
}

/**
 * Upgrade a server
 * @param {NS} ns provide main native hack function
 * @param {Number} currentMaxRAMUpgrade current maximum server RAM upgrade
 * @param {Array} purchasedServer list of purchased servers
 * @param {Array} rootedDomains list of rooted domains
 * @return {Boolean} flag indicating whether upgrade is needed
 */
function upgradeServer(ns, currentMaxRAMUpgrade, purchasedServer, rootedDomains) {
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
      purchasedServer = updatePurchasedServerList(ns, purchasedServer);
    }
  }

  return !isServerAlreadyMax;
}

/**
 * Upgrade the current maximum server RAM with the next upgrade
 * @param {NS} ns provide main native hack function
 * @param {Number} currentMaxRAMUpgrade current maximum server RAM upgrade
 * @param {Number} maxPurchaseableRAM maximum server RAM that can be purchased
 * @return {Number} the next maximum server RAM upgrade
 */
function upgradeCurrentMaxServerRAM(ns, currentMaxRAMUpgrade, maxPurchaseableRAM) {
  if (currentMaxRAMUpgrade * 2 > maxPurchaseableRAM) {
    ns.print(`All server reach max server ram upgrade that can be purchased, preparing to shutdown current script after ${loopSleep * 1000} seconds`);
    return maxPurchaseableRAM;
  }

  ns.print(`All server already upgraded to current max ram upgrade ${currentMaxRAMUpgrade}GB, doubling current server max ram upgrade to ${currentMaxRAMUpgrade * 2}`);
  return currentMaxRAMUpgrade * 2;
}

/**
 * Clean up tail log
 * @param {NS} ns provide main native hack function
 * @param {Number} sleepTime sleep time before cleaning up tail
 * @return void
 */
async function cleanUpTail(ns, sleepTime) {
  // Adding some sleep, just for adding some time to see tail log
  await ns.sleep(sleepTime);

  // Yea yea yea, i know, just cleaning up tail
  ns.closeTail(ns.pid);
}

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  // Disable ns log
  ns.disableLog("ALL");

  // Passing argument from console or script to enable tail mode
  const enableTail = ns.args[0] || false;
  if (enableTail) ns.tail(ns.pid);

  const ramLimit = ns.getPurchasedServerMaxRam();
  const totalPurchaseableServer = ns.getPurchasedServerLimit();

  let upgradeFlag = false;
  let lowestServerRAM = MINIMUM_SERVER_RAM;
  let purchasedServer = getPurchasedServer(ns);
  let currentMaxRAMUpgrade = MINIMUM_SERVER_RAM * 2;
  let maxPurchaseableRAM = Math.min(ns.getServerMaxRam("home"), ramLimit);

  ns.print(`Initial server handler with minimum ram ${MINIMUM_SERVER_RAM}GB and max ram ${maxPurchaseableRAM}GB`);

  while (true) {
    const rootedDomains = getNukedDomains(ns);
    let totalPurchasedServer = purchasedServer.length;

    purchasedServer = updatePurchasedServerList(ns, purchasedServer);

    while (totalPurchasedServer < totalPurchaseableServer && !upgradeFlag) {
      purchasedServer = purchaseServer(ns, totalPurchasedServer, purchasedServer, rootedDomains);
      totalPurchasedServer = purchasedServer.length;
      upgradeFlag = totalPurchasedServer % UPGRADE_EACH_X_SERVER === 0;
      await ns.sleep(LOOP_SLEEP * 1000);
    }

    while (upgradeFlag) {
      upgradeFlag = upgradeServer(ns, currentMaxRAMUpgrade, purchasedServer, rootedDomains);
      await ns.sleep(LOOP_SLEEP * 1000);
    }

    if (totalPurchasedServer === totalPurchaseableServer && !upgradeFlag && currentMaxRAMUpgrade === maxPurchaseableRAM && lowestServerRAM === currentMaxRAMUpgrade) break;
    else if (lowestServerRAM < currentMaxRAMUpgrade && !upgradeFlag) upgradeFlag = true;
    else if (currentMaxRAMUpgrade < maxPurchaseableRAM && totalPurchasedServer === totalPurchaseableServer && !upgradeFlag) {
      upgradeFlag = true;
      purchasedServer = updatePurchasedServerList(ns, purchasedServer);  

      if (ns.getServerMaxRam(purchasedServer[0]) >= currentMaxRAMUpgrade) {
        currentMaxRAMUpgrade = upgradeCurrentMaxServerRAM(ns, currentMaxRAMUpgrade, maxPurchaseableRAM);
      }
    }

    await ns.sleep(LOOP_SLEEP * 1000);
  }

  if (enableTail) await cleanUpTail(ns, 5000);
}
