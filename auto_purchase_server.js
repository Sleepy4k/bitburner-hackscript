/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
	const ram = 8.00;
	const maxServerPurchased = 25;
	const baseServerHostName = "pserv";
	const enableTail = ns.args[0] || false;
	const scriptTemplateName = "nuke-template.js";

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
		if (totalServerCanBuy > 0 && purchasedServers.length < maxServerPurchased) {
			// Check home domain money, if domain money equal to server cost then we make a purchase
			if (ns.getServerMoneyAvailable("home") >= ns.getPurchasedServerCost(ram)) {
				const serverIndex = purchasedServers.length + 1;

				// Purchasing server and make unique domain with lastest server number
				const server = ns.purchaseServer(baseServerHostName + "-" + serverIndex, ram);

				// Hard copy template file to new server from home domain
				ns.scp(scriptTemplateName, server, "home");

				// Get server max ram, with logic, server max ram - current free ram = max server ram
				const serverMaxRAM = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

				// Get current template script ram used
				const totalScriptRAM = ns.getScriptRam(scriptTemplateName, server);

				// Get script max thread to run
				const scriptThread = Math.floor(serverMaxRAM / totalScriptRAM);

				/**
				 * Its old enough to understand why we don't use loop any more
				 * Yups, because we need more time to load server data, just for thread
				 */
				// // Make an iterator for loop
				// let iterator = 1;

				// // Check if total script ram if not equal to server ram, then double it
				// while (totalScriptRAM <= ram) {
				// 	iterator++;
				// 	const newScriptRAM = totalScriptRAM *= iterator;

				// 	// If new script ram bigger than server ram then abort it and stop the loop
				// 	if (newScriptRAM <= ram) {
				// 		totalScriptRAM = newScriptRAM;
				// 	} else {
				// 		iterator--;
				// 		break;
				// 	}
				// }

				const domain = (serverIndex < 12) ? "n00dles" : "foodnstuff";

				// Run script in new server domain with current configuration
				ns.exec(scriptTemplateName, server, scriptThread, scriptThread, false, domain);
			}
		} else if (purchasedServers.length > 1) {
			// Loop all purchased server and check if we can upgrade some server ram? maybe
			for (let i = 0; i < purchasedServers.length; i++) {
				const server = purchasedServers[i];
				const serverIndex = i + 1;

				// Get current server max ram
				let currentServerRam = ns.getServerMaxRam(server);

				// Basically it's same as above, just we change some logic such as, purchase server and kill all running script
				if (ns.getServerMoneyAvailable("home") >= ns.getPurchasedServerUpgradeCost(server, currentServerRam * 2) && currentServerRam <= 32) {
					// Upgrade current server ram
					ns.upgradePurchasedServer(server, currentServerRam * 2);

					// Update current server ram
					currentServerRam = ns.getServerMaxRam(server);

					// Kill all running script
					ns.killall(server);

					// Remove old script file
					ns.rm(scriptTemplateName, server);

					// Hard copy template file to new server from home domain
					ns.scp(scriptTemplateName, server, "home");

					// Get server max ram, with logic, server max ram - current free ram = max server ram
					const serverMaxRAM = currentServerRam - ns.getServerUsedRam(server);

					// Get current template script ram used
					const totalScriptRAM = ns.getScriptRam(scriptTemplateName, server);

					// Get script max thread to run
					const scriptThread = Math.floor(serverMaxRAM / totalScriptRAM);

					/**
					 * Its old enough to understand why we don't use loop any more
					 * Yups, because we need more time to load server data, just for thread
					 */
					// // Make an iterator for loop
					// let iterator = 1;

					// // Check if total script ram if not equal to server ram, then double it
					// while (totalScriptRAM <= ram) {
					// 	iterator++;
					// 	const newScriptRAM = totalScriptRAM *= iterator;

					// 	// If new script ram bigger than server ram then abort it and stop the loop
					// 	if (newScriptRAM <= ram) {
					// 		totalScriptRAM = newScriptRAM;
					// 	} else {
					// 		iterator--;
					// 		break;
					// 	}
					// }

					const domain = (serverIndex < 12) ? "n00dles" : "foodnstuff";

					// Run script in new server domain with current configuration
					ns.exec(scriptTemplateName, server, scriptThread, scriptThread, false, domain);
				}	
			}
		}

		// How about some delay for 10 seconds? Make it use less cpu (i hope its true xD)
		await ns.sleep(10000);
	}
}
