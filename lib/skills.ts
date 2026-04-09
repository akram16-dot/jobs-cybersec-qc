// Détection automatique des compétences/tags cybersec depuis titre+description.
// Chaque entrée : [label canonique, [regex patterns normalisés]].
// On retourne une liste triée, sans doublons, plafonnée à 12 pour éviter le bruit.

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Chaque skill : label affiché + liste de patterns (mots ou groupes) qui le déclenchent.
// Les patterns sont testés sur le texte normalisé (sans accents, minuscules).
const SKILLS: { label: string; patterns: RegExp[] }[] = [
  // Certifications
  { label: "CISSP", patterns: [/\bcissp\b/] },
  { label: "CISM", patterns: [/\bcism\b/] },
  { label: "CISA", patterns: [/\bcisa\b/] },
  { label: "CEH", patterns: [/\bceh\b/] },
  { label: "OSCP", patterns: [/\boscp\b/] },
  { label: "OSCE", patterns: [/\bosce\b/] },
  { label: "GIAC", patterns: [/\bgiac\b|\bgsec\b|\bgcih\b|\bgpen\b/] },
  { label: "Security+", patterns: [/security\s*\+|comptia\s+security/] },
  { label: "ISO 27001", patterns: [/iso[ -]?27001|iso[ -]?27002/] },
  { label: "SOC 2", patterns: [/soc\s*2|soc\s*ii/] },
  { label: "NIST", patterns: [/\bnist\b/] },
  { label: "PCI DSS", patterns: [/pci[ -]?dss|pci[ -]?compliance/] },
  { label: "HIPAA", patterns: [/\bhipaa\b/] },
  { label: "RGPD", patterns: [/\brgpd\b|\bgdpr\b/] },

  // Domaines
  { label: "SOC", patterns: [/\bsoc\b|security operations center/] },
  { label: "SIEM", patterns: [/\bsiem\b/] },
  { label: "Pentest", patterns: [/pentest|penetration test|ethical hack/] },
  { label: "Red Team", patterns: [/red team/] },
  { label: "Blue Team", patterns: [/blue team/] },
  { label: "Threat Intel", patterns: [/threat intel|cti\b|threat hunting/] },
  { label: "Incident Response", patterns: [/incident response|\bdfir\b|forensic/] },
  { label: "IAM", patterns: [/\biam\b|identity (and|&) access/] },
  { label: "PAM", patterns: [/\bpam\b|privileged access/] },
  { label: "GRC", patterns: [/\bgrc\b|governance risk/] },
  { label: "AppSec", patterns: [/appsec|application security/] },
  { label: "DevSecOps", patterns: [/devsecops/] },
  { label: "Cloud Security", patterns: [/cloud security/] },
  { label: "Network Security", patterns: [/network security|securite reseau/] },
  { label: "Zero Trust", patterns: [/zero trust/] },
  { label: "Vulnerability Mgmt", patterns: [/vulnerability (management|mgmt)|gestion des vulnerabilites/] },
  { label: "Risk Management", patterns: [/risk management|gestion des risques/] },
  { label: "Compliance", patterns: [/compliance|conformite/] },
  { label: "Audit", patterns: [/\baudit\b/] },

  // Outils SIEM / SOC
  { label: "Splunk", patterns: [/\bsplunk\b/] },
  { label: "QRadar", patterns: [/\bqradar\b/] },
  { label: "Sentinel", patterns: [/microsoft sentinel|azure sentinel/] },
  { label: "Elastic", patterns: [/\belastic\b|\belk\b|elasticsearch/] },
  { label: "CrowdStrike", patterns: [/crowdstrike/] },
  { label: "SentinelOne", patterns: [/sentinelone|sentinel one/] },
  { label: "Defender", patterns: [/microsoft defender|mde\b/] },
  { label: "Carbon Black", patterns: [/carbon black/] },

  // Outils offensifs
  { label: "Burp Suite", patterns: [/burp suite|burpsuite|\bburp\b/] },
  { label: "Metasploit", patterns: [/metasploit/] },
  { label: "Nmap", patterns: [/\bnmap\b/] },
  { label: "Nessus", patterns: [/nessus/] },
  { label: "Qualys", patterns: [/qualys/] },
  { label: "Wireshark", patterns: [/wireshark/] },
  { label: "Kali", patterns: [/kali linux|\bkali\b/] },
  { label: "Cobalt Strike", patterns: [/cobalt strike/] },

  // Cloud / plateformes
  { label: "AWS", patterns: [/\baws\b|amazon web services/] },
  { label: "Azure", patterns: [/\bazure\b/] },
  { label: "GCP", patterns: [/\bgcp\b|google cloud/] },
  { label: "Kubernetes", patterns: [/kubernetes|\bk8s\b/] },
  { label: "Docker", patterns: [/\bdocker\b/] },
  { label: "Terraform", patterns: [/terraform/] },

  // Langages / scripts
  { label: "Python", patterns: [/\bpython\b/] },
  { label: "PowerShell", patterns: [/powershell/] },
  { label: "Bash", patterns: [/\bbash\b/] },
  { label: "SQL", patterns: [/\bsql\b/] },

  // Réseau / OS
  { label: "Linux", patterns: [/\blinux\b/] },
  { label: "Windows", patterns: [/\bwindows server\b|\bactive directory\b|\bad\b/] },
  { label: "Firewall", patterns: [/firewall|pare-feu/] },
  { label: "VPN", patterns: [/\bvpn\b/] },
  { label: "IDS/IPS", patterns: [/\bids\b|\bips\b|intrusion detection/] },
  { label: "EDR", patterns: [/\bedr\b/] },
  { label: "XDR", patterns: [/\bxdr\b/] },
  { label: "WAF", patterns: [/\bwaf\b/] },
];

const MAX_SKILLS = 12;

export function detectSkills(title: string, description = ""): string[] {
  const text = norm(`${title} ${description}`);
  const found: string[] = [];
  for (const { label, patterns } of SKILLS) {
    if (patterns.some((p) => p.test(text))) {
      if (!found.includes(label)) found.push(label);
      if (found.length >= MAX_SKILLS) break;
    }
  }
  return found;
}

// Liste complète des labels possibles, pour alimenter les filtres UI.
export const ALL_SKILLS: string[] = SKILLS.map((s) => s.label);
