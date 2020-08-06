# Firefox RCE CVE-2016-9079 nsSMILTimeContainer
Port of: https://www.exploit-db.com/exploits/41151

Tested On: Firefox 38.0.1esr on Windows 10 1903

How to Use:
1. cd into the folder containing index.html, and worker.js
2. Start http server in that directory
3. Visit http://attacker/index.html from the victim.

Note:
The metasploit exploit first fingerprints the browser, then checks the os version, browser version, and only then performs the exploit. This port however directly performs the exploit, so use with caution.

