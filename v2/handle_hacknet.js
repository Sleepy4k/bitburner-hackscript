/**
 * Init Upgrade Cost Const
 */
const nodeLeveMulti = 5;
const nodeRAMMulti = 1.7;
const nodeCoreMulti = 1;

/**
 * Handle upgrading hacknet node
 * @param {NS} ns provide main native hack function
 * @param {integer} homeServerMoney get current home server money
 * @return void
 */
function upgradeNodes(ns, hn, homeServerMoney) {
  // Make a loop to get all nodes
  for (let i = 0; i < hn.numNodes(); i++) {
    // Get current node upgrade cost including level, ram and core
    const levelUpgradeCost = hn.getLevelUpgradeCost(i, 1) * nodeLeveMulti;
    const ramUpgradeCost = hn.getRamUpgradeCost(i, 1) * nodeRAMMulti;
    const coreUpgradeCost = hn.getCoreUpgradeCost(i, 1) * nodeCoreMulti;

    // Check if we can upgrade it or nah
    if (levelUpgradeCost != Infinity && levelUpgradeCost <= homeServerMoney) hn.upgradeLevel(i, 1);
    else if (ramUpgradeCost != Infinity && ramUpgradeCost <= homeServerMoney) hn.upgradeRam(i, 1);
    else if (coreUpgradeCost != Infinity && coreUpgradeCost <= homeServerMoney) hn.upgradeCore(i, 1);
  }
}

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
  // Disable default ns log
  ns.disableLog("ALL");

  /**
   * Basically we just upgrade that we can affort for it
   * With logic:
   * 1. Check if buy node cost is less or equal than home server money
   * 2. If so, then we buy new node
   * 3. If we can't buy it, then we upgrade our nodes
   * 4. priority list is, level, ram and then core
   */

  // Passing argument from console or script to enable tail mode
  const enableTail = ns.args[0] || false;
  if (enableTail) ns.tail(ns.pid);

  // Init ns hacknet function
  const hn = ns.hacknet

  while (true) {
    // Only get 5% of home server money, don't worry about it
    // Unless you change the formula number haha
    const homeServerMoney = ns.getServerMoneyAvailable("home") * .05;

    // Check home server money is enough to purchase new node
    const canPurchaseNode = hn.getPurchaseNodeCost() <= homeServerMoney;

    // Check if we can purchase new node or nah
    if (!canPurchaseNode) upgradeNodes(ns, hn, homeServerMoney);
    else hn.purchaseNode();

    // Sleep for a while
    await ns.sleep(1000);
  }
}
