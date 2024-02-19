/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
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

  // So this is our formula, feel free if you want to change
  const levelWeight = 5;
  const ramWeight = 1.7;
  const coreWeight = 1;

  // I don't know about this, but it's make me easy to develop just make an alias
  const hn = ns.hacknet

  while (true) {
    // Only get 5% of home server money, don't worry about it
    // Unless you change the formula number haha
    const homeServerMoney = ns.getServerMoneyAvailable("home") * .05

    // Check it if we can purchase new node or nah
    if (hn.getPurchaseNodeCost() > homeServerMoney) {
      // Get current total node that already purchased
      const totalNodes = hn.numNodes();

      for (let i = 0; i < totalNodes; i++) {
        // I think i don't need to explain any code below, you what you do right?
        const levelUpgradeCost = hn.getLevelUpgradeCost(i, 1) * levelWeight;
        const ramUpgradeCost = hn.getRamUpgradeCost(i, 1) * ramWeight;
        const coreUpgradeCost = hn.getCoreUpgradeCost(i, 1) * coreWeight;

        if (levelUpgradeCost != Infinity && levelUpgradeCost <= homeServerMoney) hn.upgradeLevel(i, 1);
        else if (ramUpgradeCost != Infinity && ramUpgradeCost <= homeServerMoney) hn.upgradeRam(i, 1);
        else if (coreUpgradeCost != Infinity && coreUpgradeCost <= homeServerMoney) hn.upgradeCore(i, 1);
      }
    } else hn.purchaseNode();

    await ns.sleep(1000);
  }
}
