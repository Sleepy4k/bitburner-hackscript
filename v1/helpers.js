// How about make server domain like a config?
export const serverDomainPrefix = "pserv";

// Define blacklisted domain, this domain will not listed in all get domains function
export const blacklistedDomain = ["darkweb", "home"];

// Define template script name, please make sure it's real file name in home server, otherwise game will freezing
export const scriptTemplateName = "nuke-template.js";

/**
 * Get all domains except darkweb, home, and purchased server
 * @param {NS} ns provide main native hack function
 * @deprecated please use deepscan to get all domain list
 * @return array
 */
export async function getAllDomains(ns) {
  // Init array to save filtered domains
  let filteredDomains = [];

  // Scan server from home, including purchased server
  const domains = ns.scan("home");

  domains.forEach(domain => {
    // Get domain and make it lower cased
    domain = domain.toLowerCase();

    // Check if domains not included blacklisted domain
    if (blacklistedDomain.includes(domain)) return;

    // Check if domains not included server domain
    if (domain.search(serverDomainPrefix) != -1) return;

    // Push to filtered domains array
    filteredDomains.push(domain);
  });

  // Sent back filtered domains, otherwise it return empty array (just in case)
  return filteredDomains;
}

/**
 * Get all domains that already have root access except darkweb, home, and purchased server
 * @param {NS} ns provide main native hack function
 * @deprecated please use deepscan to get all domain list
 * @return array
 */
export async function getRootedDomains(ns) {
  // Init array to save domains that have root access
  let rootedDomains = [];

  // Get all domains that already filtered
  const filteredDomains = await getAllDomains(ns);

  filteredDomains.forEach(domain => {
    // Get domain and make it lower cased
    domain = domain.toLowerCase();

    // Check if current domain already have root access or not
    const isRootGranted = ns.hasRootAccess(domain);

   // If current domain have root access then push it to rooted domains array
    if (isRootGranted) rootedDomains.push(domain);
  });

  // Sent back filtered domains, otherwise it return empty array (just in case)
  return rootedDomains;
}

/**
 * Get all domains from scan list, default scan is home server
 * @param {NS} ns provide main native hack function
 * @param {string=} domain server domain that will be main scan
 * @return array
 */
export function deepScan(ns, domain = "home") {
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
    const currentScan = ns.scan(domain);

    currentScan.forEach(server => {
      if (domainList.includes(server)) return;
      if (blacklistedDomain.includes(server)) return;
      if (server.search(serverDomainPrefix) != -1) return;

      domainList.push(server);
      digging(server);
    });
  }

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
export function gainRootAccess(ns, domain) {
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

  // Check if server data max money is less than 100, it's prevent faction server, otherwise it will return false
  if (serverData.moneyMax < 100) return false;

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
  if (serverData.hasAdminRights) return true;

  // Check if server minimal hacking skill is less then player hacking skill, otherwise it will return false
  if (serverData.requiredHackingSkill >= ns.getHackingLevel()) return false;

  // Check if we can do nuke, when required open port number is less then current open port total otherwise return false
  if (serverData.numOpenPortsRequired >= serverData.openPortCount) return false;

  ns.nuke(domain);

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

  domains.forEach(domain => {
    const nukeStatus = gainRootAccess(ns, domain);
    if (!nukeStatus) return;

    nukedDomains.push(domain);
  });

  // Return all nuked domains data
  return nukedDomains;
}
