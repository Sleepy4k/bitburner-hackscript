// Define blacklisted domain, this domain will not listed in all get domains function
const blackListedDomain = ["darkweb", "home"];

// How about make server domain like a config?
export const serverDomain = "pserv";

/**
 * Get all domains except darkweb, home, and purchased server
 * @param {NS} ns provide main native hack function
 * @return array
 */
export async function getAllDomains(ns) {
  // Init array to save filtered domains
  let filteredDomains = [];

  // Scan server from home, including purchased server
  const domains = ns.scan("home");

  for (let i = 0; i < domains.length; i++) {
    // Get domain with index (i) and make it lower cased
    const domain = domains[i].toLowerCase();

    // Check if domains not included blacklisted domain or server domain, then push to filtered domains array
    if (!blackListedDomain.includes(domain) && domain.search(serverDomain) == -1) filteredDomains.push(domain);
  }

  // Sent back filtered domains, otherwise it return empty array (just in case)
  return filteredDomains;
}

/**
 * Get all domains that already have root access except darkweb, home, and purchased server
 * @param {NS} ns provide main native hack function
 * @return array
 */
export async function getRootedDomains(ns) {
  // Init array to save domains that have root access
  let rootedDomains = [];

  // Get all domains that already filtered
  const filteredDomains = await getAllDomains(ns);

  for (let i = 0; i < filteredDomains.length; i++) {
    // Get domain with index (i) and make it lower cased
    const domain = filteredDomains[i].toLowerCase();

    // Check if current domain already have root access or not
    const isRootGranted = ns.hasRootAccess(domain);

    // If current domain have root access then push it to rooted domains array
    if (isRootGranted) rootedDomains.push(domain);
  }

  // Sent back filtered domains, otherwise it return empty array (just in case)
  return rootedDomains;
}
