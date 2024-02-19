// Set minimum server money check, if server max money lower or equal than this then we dont hack this
const serverMinimumMaxMoney = 100;

// Define blacklisted domain, this domain will not listed in all get domains function
const blacklistedDomain = ["darkweb", "home"];

// How about make server domain like a config?
export const serverDomainPrefix = "pserv";

// Define template script name, please make sure it's real file name in home server, otherwise game will freezing
export const scriptTemplateName = "nuke-template.js";

/**
 * Get all domains from scan list, default scan is home server
 * @param {NS} ns provide main native hack function
 * @param {string=} domain server domain that will be main scan
 * @return array
 */
function deepScan(ns, domain = "home") {
  // Disable log for scan function
  ns.disableLog("scan");

  // Init array to store all domain list
  let domainList = [];

  /**
   * Scan child domain from parent domain
   * @param {string} domain server domain that will be scanned
   * @return void
   */
  function digging(domain) {
    // Get current scan list from domain
    const currentScan = ns.scan(domain);

    // Loop each data from current scan list
    for (const server of currentScan) {
      // If current server already in domain list then skip current loop
      if (domainList.includes(server)) return;

      // If current server have name like in blacklisted domain then skip current loop
      if (blacklistedDomain.includes(server)) return;

      // If current server have prefix name as server domain prefix then skip current loop
      if (server.search(serverDomainPrefix) != -1) return;

      // Insert into domain list data
      domainList.push(server);

      // Deep down into current server, check if current server have a child server
      digging(server);
    }
  }

  // Deep down into current server, check if current server have a child server
  digging(domain);

  // Return all domain list array data
  return domainList;
}

/**
 * Get root access for provided domain
 * @param {NS} ns provide main native hack function
 * @param {string} domain server domain that will be main scan
 * @return boolean
 */
function gainRootAccess(ns, domain) {
  // Disable default ns log
  ns.disableLog("nuke");
  ns.disableLog("brutessh");
  ns.disableLog("ftpcrack");
  ns.disableLog("httpworm");
  ns.disableLog("getServer");
  ns.disableLog("relaysmtp");
  ns.disableLog("sqlinject");
  ns.disableLog("getHackingLevel");

  // Get current domain server analyze data
  const serverData = ns.getServer(domain);

  // Check if we can do brute ssh on current server, if we already make it then skip it
  if (ns.fileExists("BruteSSH.exe", "home") && !serverData.sshPortOpen) ns.brutessh(domain);

  // Check if we can do crack ftp on current server, if we already make it then skip it
  if (ns.fileExists("FTPCrack.exe", "home") && !serverData.ftpPortOpen) ns.ftpcrack(domain);

  // Check if we can do relay smtp on current server, if we already make it then skip it
  if (ns.fileExists("relaySMTP.exe", "home") && !serverData.smtpPortOpen) ns.relaysmtp(domain);

  // Check if we can do http worm on current server, if we already make it then skip it
  if (ns.fileExists("HTTPWorm.exe", "home") && !serverData.httpPortOpen) ns.httpworm(domain);
  
  // Check if we can do sql inject on current server, if we already make it then skip it
  if (ns.fileExists("SQLInject.exe", "home") && !serverData.sqlPortOpen) ns.sqlinject(domain);

  // Check if current server already have root access, if yes then return true
  if (serverData.hasAdminRights && serverData.moneyMax > serverMinimumMaxMoney) return true;

  // Check if server minimal hacking skill is less then player hacking skill, otherwise it will return false
  if (serverData.requiredHackingSkill >= ns.getHackingLevel()) return false;

  // Check if we can do nuke, when required open port number is less then current open port total otherwise return false
  if (serverData.numOpenPortsRequired >= serverData.openPortCount) return false;

  // Gain admin rights
  ns.nuke(domain);

  // Check if server data max money is less than 100, it's prevent faction server, otherwise it will return false
  if (serverData.moneyMax <= serverMinimumMaxMoney) return false;

  return true;
}

/**
 * Get all domains that already been nuked before
 * @param {NS} ns provide main native hack function
 * @return array
 */
export function getNukedDomains(ns) {
  // Init array data to store domains that already been nuked
  let nukedDomains = [];

  // Make variable to store all domains data
  const domains = deepScan(ns);

  // Loop each data from domains list
  for (const domain of domains) {
    // Check if current server have admin rights or not
    const nukeStatus = gainRootAccess(ns, domain);

    // If current server doesn't have admin rights then skip current loop
    if (!nukeStatus) return;

    // Insert into nuked domains list
    nukedDomains.push(domain);
  }

  // Return all nuked domains data
  return nukedDomains;
}

/**
 * Get all purchased server, optimize then native ns function
 * @param {NS} ns provide main native hack functioon
 * @return array
 */
export function getPurchasedServer(ns) {
  // Init array data to store purchased server
  let purchasedServer = [];

  // Make variable to store home scan result
  const homeScan = ns.scan("home");

  // Loop each data from home scan data list
  for (const server of homeScan) {
    // Check if current server if contain server domain prefix, if not then we skip this server
    if (server.search(serverDomainPrefix) == -1) continue;

    // Insert current server into purchased server data list
    purchasedServer.push(server);
  }

  // Return all purchased server list
  return purchasedServer;
}
