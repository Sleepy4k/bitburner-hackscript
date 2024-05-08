import { execScript } from "./execute_script";
import { serverDomainPrefix, getPurchasedServer, getNukedDomains, scriptTemplateName } from "./helpers";

/**
 * Init local config for server handler
 */
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
  purchasedServer = purchasedServer.length > 1 ? purchasedServer.sort((a, b) => ns.getServerMaxRam(a) - ns.getServerMaxRam(b)) : purchasedServer;

  const lowestServerRAM = purchasedServer.length > 0 ? ns.getServerMaxRam(purchasedServer[0]) : null;
  const currentMaxRAMUpgrade = purchasedServer.length > 1 ? ns.getServerMaxRam(purchasedServer[purchasedServer.length - 1]) : null;

  return [purchasedServer, lowestServerRAM, currentMaxRAMUpgrade];
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
  let updatePurchaseList = false;
  let purchasedServerName = null;
  const serverCost = ns.getPurchasedServerCost(MINIMUM_SERVER_RAM);

  if (ns.getServerMoneyAvailable("home") >= serverCost) {
    purchasedServerName = ns.purchaseServer(`${serverDomainPrefix}-${totalPurchasedServer + 1}`, MINIMUM_SERVER_RAM);

    ns.print(`buying new server with ram ${MINIMUM_SERVER_RAM}GB with name ${purchasedServerName}`);
    ns.scp(scriptTemplateName, purchasedServerName, "home");

    execScript(ns, purchasedServerName, scriptTemplateName, rootedDomains);
    updatePurchaseList = true;
  }

  return [purchasedServerName, updatePurchaseList];
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
  let isServerAlreadyMax = true, updatePurchaseList = false;

  for (const server of purchasedServer) {
    if (ns.getServerMaxRam(server) >= currentMaxRAMUpgrade) continue;

    if (ns.getServerMoneyAvailable("home") >= ns.getPurchasedServerUpgradeCost(server, currentMaxRAMUpgrade)) {
      ns.killall(server);

      ns.upgradePurchasedServer(server, currentMaxRAMUpgrade);

      ns.print(`Upgrade server ${server} to new ram ${currentMaxRAMUpgrade}GB`);

      ns.scp(scriptTemplateName, server, "home");

      execScript(ns, server, scriptTemplateName, rootedDomains);

      isServerAlreadyMax = false;
      updatePurchaseList = true;
    }
  }

  return [!isServerAlreadyMax, updatePurchaseList];
}

/**
 * Upgrade the current maximum server RAM with the next upgrade
 * @param {NS} ns provide main native hack function
 * @param {Number} currentMaxRAMUpgrade current maximum server RAM upgrade
 * @param {Number} maxPurchaseableRAM maximum server RAM that can be purchased
 * @return {Number} the next maximum server RAM upgrade
 */
function upgradeCurrentMaxServerRAM(ns, currentMaxRAMUpgrade, maxPurchaseableRAM) {
  const upgradedRAMServer = currentMaxRAMUpgrade * 2;

  if (upgradedRAMServer > maxPurchaseableRAM) {
    ns.print(`All server reach max server ram upgrade that can be purchased, preparing to shutdown current script after ${LOOP_SLEEP * 1000} seconds`);
    return maxPurchaseableRAM;
  }

  ns.print(`All server already upgraded to current max ram upgrade ${currentMaxRAMUpgrade}GB, doubling current server max ram upgrade to ${upgradedRAMServer}GB`);
  return upgradedRAMServer;
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

  function updateScriptState() {
    const updateState = updatePurchasedServerList(ns, purchasedServer);

    purchasedServer = updateState[0];
    lowestServerRAM = updateState[1] != null ? updateState[1] : lowestServerRAM;
    currentMaxRAMUpgrade = (updateState[2] != null && updateState[2] > currentMaxRAMUpgrade) ? updateState[2] : currentMaxRAMUpgrade;
  }

  while (true) {
    const rootedDomains = getNukedDomains(ns);
    let totalPurchasedServer = purchasedServer.length;

    updateScriptState();

    while (totalPurchasedServer < totalPurchaseableServer && !upgradeFlag) {
      const purchasedServerResult = purchaseServer(ns, totalPurchasedServer, purchasedServer, rootedDomains);

      if (purchasedServerResult[0] != null) purchasedServer.push(purchasedServerResult[0]);
      if (purchasedServerResult[1]) updateScriptState();

      totalPurchasedServer = purchasedServer.length;
      upgradeFlag = totalPurchasedServer % UPGRADE_EACH_X_SERVER === 0;

      await ns.sleep(LOOP_SLEEP * 1000);
    }

    while (upgradeFlag) {
      const upgradeServerResult = upgradeServer(ns, currentMaxRAMUpgrade, purchasedServer, rootedDomains);

      upgradeFlag = upgradeServerResult[0];
      
      if (upgradeServerResult[1]) updateScriptState();

      await ns.sleep(LOOP_SLEEP * 1000);
    }

    if (totalPurchasedServer === totalPurchaseableServer && !upgradeFlag && currentMaxRAMUpgrade === maxPurchaseableRAM && lowestServerRAM === currentMaxRAMUpgrade) break;
    else if (lowestServerRAM < currentMaxRAMUpgrade && !upgradeFlag) upgradeFlag = true;
    else if (currentMaxRAMUpgrade < maxPurchaseableRAM && totalPurchasedServer === totalPurchaseableServer && !upgradeFlag) {
      upgradeFlag = true;
      updateScriptState();

      if (ns.getServerMaxRam(purchasedServer[0]) >= currentMaxRAMUpgrade) {
        currentMaxRAMUpgrade = upgradeCurrentMaxServerRAM(ns, currentMaxRAMUpgrade, maxPurchaseableRAM);
      }
    }

    await ns.sleep(LOOP_SLEEP * 1000);
  }

  if (enableTail) await cleanUpTail(ns, 5000);
}
