import { execScript } from "./auto_exec_script";
import { serverDomainPrefix, getNukedDomains, scriptTemplateName } from "./helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
	ns.disableLog("purchaseServer");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getPurchasedServers");
	ns.disableLog("upgradePurchasedServer");
	ns.disableLog("getPurchasedServerCost");
	ns.disableLog("getPurchasedServerLimit");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getPurchasedServerUpgradeCost");

	/**
	 * In this script i want to make automatic server purchase and upgrade it when we already have max server
	 * With logic:
	 * 1. Get total server that we can buy
	 * 2. If we already reach max server that we can purchase then we jump to point 5
	 * 3. If we still can purchase server, then we check if home server money equal or more than purchase cost
	 * 4. After that, we copy script template and do some thread distribution, then exec that script
	 * 5. When we reach the maximum number of server we can purchased, we make it upgrade system
	 * 6. First we check if upgrade cost is less or equal to home server money
	 * 7. If we can upgrade then do upgrade, also we do same thing like poin 4
	 */

	// Define base ram when we purchase server
	const baseRAM = 8.00;

	// Define max ram that we can upgrade, By default,
	// We just get home server max ram, if you want to make it more
	// Feel free to change this value, remember ram format, 2, 4, 8, 16, ...
	const totalMaxUpgradeRAM = ns.getServerMaxRam("home");

	// Passing argument from console or script to enable tail mode
	const enableTail = ns.args[0] || false;

	// Check if script will run tail or not
	if (enableTail) ns.tail(ns.pid);

	while (true) {
		// In this case we need to get our purchased server list for upgrade server ram
		const purchasedServers = ns.getPurchasedServers();

		// Also we need to know how many server we can purchase
		const totalServerCanBuy = ns.getPurchasedServerLimit();

		/**
		 * Check server that can we buy, if we can buy atleast 1 server than we buy it and run template hack script
		 * If not, we check if we can upgrade server component
		 */
		if (purchasedServers.length < totalServerCanBuy) {
			// Check home domain money, if domain money equal to server cost then we make a purchase
			if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(baseRAM)) {
				const serverIndex = purchasedServers.length + 1;

				// Purchasing server and make unique domain with lastest server number
				const server = ns.purchaseServer(serverDomainPrefix + "-" + serverIndex, baseRAM);

				// Hard copy template file to new server from home domain
				ns.scp(scriptTemplateName, server, "home");

				// Get domains that already have root access
				const rootedDomains = getNukedDomains(ns);

				// Execute script with current options
				execScript(ns, server, scriptTemplateName, rootedDomains);
			}
		} else if (purchasedServers.length > 1) {
			// Loop all purchased server and check if we can upgrade some server ram? maybe
			purchasedServers.forEach(server => {
				// Get current server max ram
				const currentServerRAM = ns.getServerMaxRam(server);

				// Get total ram for upgrade
				const upgradedServerRAM = currentServerRAM * 2;

				// Check if current server ram less then home server ram, if not then skip this server
				if (currentServerRAM >= totalMaxUpgradeRAM) return;

				// Check if home server can afford server upgrade cost, if not then skip this server
				if (ns.getServerMoneyAvailable("home") < ns.getPurchasedServerUpgradeCost(server, upgradedServerRAM)) return;

				// Upgrade current server ram
				ns.upgradePurchasedServer(server, upgradedServerRAM);

				// Kill all running script
				ns.killall(server);

				// Remove old script file
				ns.rm(scriptTemplateName, server);

				// Hard copy template file to new server from home domain
				ns.scp(scriptTemplateName, server, "home");

				// Get domains that already have root access
				const rootedDomains = getNukedDomains(ns);

				// Execute script with current options
				execScript(ns, server, scriptTemplateName, rootedDomains);
			});
		}

		// How about some delay for 10 seconds? Make it use less cpu (i hope its true xD)
		await ns.sleep(10000);
	}
}
