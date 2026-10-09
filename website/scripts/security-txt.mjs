// Writes https://lupios.org/.well-known/security.txt (RFC 9116): where to report a security problem
// privately. The standard requires an expiry date under a year away, so it's made at every build,
// one year ahead (the file is git-ignored). If the site isn't rebuilt for a year, it expires, which
// is the honest signal that nobody is looking after it.
import { mkdirSync, writeFileSync } from "node:fs";

const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000);
expires.setUTCHours(0, 0, 0, 0);
const dir = new URL("../public/.well-known/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL("security.txt", dir), `# Found a security problem in LupiOS? Please report it privately, so it can be fixed before
# anyone else knows. What LupiOS protects, and how: https://lupios.org/security/
Contact: https://github.com/vukkz/lupios/security/advisories/new
Expires: ${expires.toISOString()}
Preferred-Languages: en
Canonical: https://lupios.org/.well-known/security.txt
Policy: https://lupios.org/security/#reporting-a-security-problem
`);
console.log(`security.txt: expires ${expires.toISOString().slice(0, 10)}`);
