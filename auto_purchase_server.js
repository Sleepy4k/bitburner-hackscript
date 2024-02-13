import { serverDomain, getRootedDomains } from "./helpers";

/**
 * Main thread to exec hack script
 * @param {NS} ns provide main native hack function
 * @return void
 */
export async function main(ns) {
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

  // Script template name, please provided file script name file
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
		if (totalServerCanBuy > 0) {
			// Check home domain money, if domain money equal to server cost then we make a purchase
			if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(baseRAM)) {
				const serverIndex = purchasedServers.length + 1;

				// Purchasing server and make unique domain with lastest server number
				const server = ns.purchaseServer(serverDomain + "-" + serverIndex, baseRAM);

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

				// Get domains that already have root access
				const rootedDomains = await getRootedDomains(ns);

				// Get each domain thread
				let eachDomainThread = Math.ceil(scriptThread / rootedDomains.length);

				// Make an iterator for our loop
				let iterator = 0;

				// Init checker array with length same as rooted domains length and 0 for default value
				let checker = new Array(rootedDomains.length).fill(0);

				for (let t = 0; t < scriptThread; t++) {
					// Here some explain, If checker with index (iterator) less or equal than each domain thread
					// Then make a proccess to execute, else increase iterator value by one
					if (checker[iterator] <= eachDomainThread) {
						// And if index (t) is even then we get current domain and execute script template
						if (t % 2 == 0) {
							const domain = rootedDomains[iterator];

							ns.exec(scriptTemplateName, server, 2, 2, false, domain);
						}
					} else {
						// Just increase iterator value
						iterator++;
					}

					// After we done our stuff above, make sure we increase checker with index (iterator) by one
					checker[iterator]++;
				}
			}
		} else if (purchasedServers.length > 1) {
			// Loop all purchased server and check if we can upgrade some server ram? maybe
			for (let i = 0; i < purchasedServers.length; i++) {
				const server = purchasedServers[i];

				// Get current server max ram
				let currentServerRam = ns.getServerMaxRam(server);

				// Basically it's same as above, just we change some logic such as, purchase server and kill all running script
				if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerUpgradeCost(server, currentServerRam * 2) && currentServerRam < totalMaxUpgradeRAM) {
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

					// Get domains that already have root access
					const rootedDomains = await getRootedDomains(ns);

					// Get each domain thread
					let eachDomainThread = Math.ceil(scriptThread / rootedDomains.length);

					// Make an iterator for our loop
					let iterator = 0;

					// Init checker array with length same as rooted domains length and 0 for default value
					let checker = new Array(rootedDomains.length).fill(0);

					for (let t = 0; t < scriptThread; t++) {
						// Here some explain, If checker with index (iterator) less or equal than each domain thread
						// Then make a proccess to execute, else increase iterator value by one
						if (checker[iterator] <= eachDomainThread) {
							// And if index (t) is even then we get current domain and execute script template
							if (t % 2 == 0) {
								const domain = rootedDomains[iterator];

								ns.exec(scriptTemplateName, server, 2, 2, false, domain);
							}
						} else {
							// Just increase iterator value
							iterator++;
						}

						// After we done our stuff above, make sure we increase checker with index (iterator) by one
						checker[iterator]++;
					}
				}	
			}
		}

		// How about some delay for 10 seconds? Make it use less cpu (i hope its true xD)
		await ns.sleep(10000);
	}
}
