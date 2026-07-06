# Firefox RCE (CVE-2016-9079) – Educational JavaScript Port

> **Educational implementation of the public exploit for CVE-2016-9079, adapted from the original Exploit-DB/Metasploit module for standalone use.**

> **Disclaimer**
>
> This repository is provided strictly for educational and research purposes. It contains a JavaScript port of a publicly available exploit for studying historical browser exploitation techniques. It is **not** intended for unauthorized use against systems you do not own or have permission to test.

---

## Overview

This repository contains a standalone JavaScript implementation of the public exploit for **CVE-2016-9079**, a **Use-After-Free (UAF)** vulnerability affecting older versions of Mozilla Firefox.

The vulnerability exists within Firefox's **SMIL (Synchronized Multimedia Integration Language)** animation subsystem and can allow **remote code execution** under specific conditions.

Unlike the original public exploit, which is distributed as a Metasploit module, this repository provides a browser-based implementation that can be served from a simple HTTP server.

This repository is intended as a historical educational reference rather than a modern exploitation tool.

---

## Background

While preparing for the **OSCP**, I encountered a CTF machine running an old vulnerable version of Firefox.

After enumeration, browser exploitation appeared to be the intended privilege escalation path.

The publicly available exploit on Exploit-DB was implemented as a Metasploit module. Since the OSCP examination restricts the use of Metasploit, I wanted a standalone version that could be executed without the framework.

After researching the public exploit, I adapted it into this JavaScript implementation.

It is important to note that:

* I **did not discover** CVE-2016-9079.
* I **did not develop** the original exploit.
* I also **do not claim to fully understand the low-level exploitation logic** or browser internals involved.
* This repository exists to preserve an educational standalone implementation that I used during OSCP preparation.

---

## About the Vulnerability

**CVE:** CVE-2016-9079

**Type:** Use-After-Free (UAF)

**Affected Component:** Firefox SMIL Animation (`nsSMILTimeContainer`)

**Impact:** Remote Code Execution

The vulnerability is triggered through specially crafted SVG animation objects that cause a use-after-free condition inside Firefox's animation engine. The exploit then performs heap manipulation before executing a ROP chain to achieve code execution.

This repository preserves the publicly documented exploitation technique for educational purposes.

---

## Repository Contents

### `index.html`

The main entry point.

Loads the JavaScript components and triggers the vulnerability when opened in a compatible Firefox version.

---

### `worker.js`

Contains the majority of the exploit logic, including:

* heap spraying
* memory preparation
* payload construction
* ROP setup
* vulnerability trigger

The implementation is adapted from the publicly available exploit.

---

### `README.md`

Documentation describing the vulnerability, repository purpose, and usage.

---

## Tested Environment

* Firefox ESR **38.0.1**
* Windows 10 Version 1903

No compatibility with newer Firefox releases is expected.

![Firefox Version](https://raw.githubusercontent.com/soham23/firefox-rce-nssmil/refs/heads/master/docs/screenshots/firefox-version.png)

---

## Running the Proof of Concept

### Prerequisites

* Firefox ESR 38.0.1 (or another vulnerable version)
* Windows test environment
* Python HTTP server (or equivalent)

### Start a local HTTP server

```bash
python3 -m http.server 8000
```

### Open the PoC

Navigate to:

```text
http://<server-ip>:8000/index.html
```

from the vulnerable Firefox instance.

---

## Exploit Demonstration
![Exploit](https://raw.githubusercontent.com/soham23/firefox-rce-nssmil/refs/heads/master/docs/screenshots/exploit-running.png)

**Note** - You may have to try the exploit multiple times.

## Limitations

This repository is intentionally minimal and should not be considered a general exploitation framework.

Compared to the original Metasploit implementation:

* Browser fingerprinting has been removed.
* Operating system checks have been removed.
* Version validation has been removed.
* The exploit executes directly rather than performing compatibility verification.

As a result, this implementation should only be used in controlled environments with known compatible versions.

---

## Educational Value

Although I did not author the original exploit, adapting it into a standalone implementation provided valuable exposure to concepts including:

* browser exploitation workflows
* historical Firefox vulnerabilities
* Use-After-Free vulnerabilities
* exploit adaptation outside the Metasploit framework
* building standalone proof-of-concept environments

This repository complements my application security and bug bounty work by documenting part of my OSCP preparation process.

---

## References

* [Exploit-DB entry for CVE-2016-9079](https://www.exploit-db.com/exploits/41151)

---

## License

This repository is distributed for educational purposes only.

Credit for the original exploitation technique belongs to the original researchers and authors of the public exploit. This repository only adapts the publicly available implementation into a standalone format for educational use.
