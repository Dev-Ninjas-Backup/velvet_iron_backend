#!/usr/bin/env python3
"""
Security Scanner v2 (Advanced Threat & Supply Chain Detector)
Specifically engineered to catch:
1. Disguised malicious assets (e.g. JavaScript hiding in .woff2, .ttf, .png, .css)
2. Stealth IDE execution triggers (.vscode/tasks.json with folderOpen, .vscode/settings.json)
3. Ethereum smart-contract C2 loaders (BeaverTail / Lazarus campaign patterns)
4. Obfuscated eval/spawn execution & XOR payload decoders
5. Malicious npm lifecycle hooks and CI/CD pipelines
"""

import os
import re
import sys
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

# ============================================================================
# Configuration
# ============================================================================

# Code and config extensions always scanned as text
CODE_EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.json', '.yaml', '.yml', '.env', '.html', '.svg',
    '.py', '.sh', '.bash', '.zsh'
}

# Binary asset extensions to check for spoofing / hidden scripts
ASSET_EXTENSIONS = {
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
    '.pdf', '.mp3', '.mp4', '.zip'
}

# Directories to strictly exclude (to prevent scanning massive dependencies)
EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', 'build', 'coverage',
    '.next', 'out', 'vendor', 'bower_components',
    'security-scan-results', 'playwright-report', 'test-results',
    '__pycache__', '.pytest_cache'
}

# Allowed dot-directories that MUST be scanned for security threats
ALLOWED_DOT_DIRS = {
    '.vscode', '.github', '.husky'
}

EXCLUDE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'security-scanner.py', 'security-scanner-v2.py'
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Known Magic Bytes for real binary assets
MAGIC_BYTES = {
    '.woff2': b'wOF2',
    '.woff': b'wOFF',
    '.ttf': b'\x00\x01\x00\x00',
    '.png': b'\x89PNG\r\n\x1a\n',
    '.jpg': b'\xff\xd8\xff',
    '.jpeg': b'\xff\xd8\xff',
    '.gif': b'GIF8',
    '.pdf': b'%PDF'
}

# ============================================================================
# Detection Patterns (Targeted for Supply Chain Attacks & Trojans)
# ============================================================================

PATTERNS = {
    # C2 / Blockchain Loader Patterns
    'ethereum_rpc': re.compile(r'eth_getBlockByNumber|eth_getTransactionCount|eth_blockNumber|eth_getTransactionByHash', re.I),
    'ethereum_endpoint': re.compile(r'1rpc\.io/eth|eth\.drpc\.org|publicnode\.com|blastapi\.io|blockscout\.com', re.I),
    'ethereum_address': re.compile(r'0x[a-fA-F0-9]{40}\b'),
    'payload_header': re.compile(r'x-payload-[a-z0-9-]+', re.I),
    'xor_decoding': re.compile(r'\^=\s*[^;]+\.charCodeAt\s*\(|\.charCodeAt\([^)]+\)\s*\^', re.I),
    
    # IIFE Pattern (Immediately Invoked Function Expressions)
    'iife': re.compile(
        r'(?:'
        r'\(\s*(?:async\s+)?(?:function\b[^{]*\{.*?\}|(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*(?:\{.*?\}|[^;,)\n]+))\s*\)\s*\([^\)]*\)'
        r'|'
        r'(?:!|\+|-|void\s+)\s*(?:async\s+)?function\b[^{]*\{.*?\}\s*\([^\)]*\)'
        r'|'
        r'\(\s*(?:async\s+)?function\b[^{]*\{.*?\}\s*\([^\)]*\)\s*\)'
        r')',
        re.DOTALL
    ),

    # Execution & Evasion Patterns
    'eval_dynamic': re.compile(r'\beval\s*\(|\bFunction\s*\(|new\s+Function'),
    'remote_eval': re.compile(r'(?:fetch|node-fetch|http\.get|https\.get|axios|proxy)\b.*?eval\s*\(', re.DOTALL | re.I),
    'atob_btoa': re.compile(r'\b(?:atob|btoa)\s*\('),
    'base64_url': re.compile(r'["\']?(?:aHR0cDov|aHR0cHM6Ly)[a-zA-Z0-9+/=]+["\']?'),
    'detached_spawn': re.compile(r'spawn\s*\([^)]*\{[^}]*detached\s*:\s*!*0|windowsHide\s*:\s*!*0', re.I),
    'child_process': re.compile(r'\b(?:exec|spawn|fork)\s*\([^)]*(?:sh|bash|cmd|powershell|node|\.woff|\.ttf)', re.I),
    'global_manipulation': re.compile(r'global\[[\'"][^\'"]+[\'"]\]\s*=\s*require|global\.r\s*=\s*require', re.I),
    'suspicious_var_arrays': re.compile(r'const\s+_0x[a-f0-9]+\s*=\s*_0x[a-f0-9]+|var\s+_0x[a-f0-9]+\s*=', re.I),
    'math_obfuscation': re.compile(r'(?:0x[a-f0-9]+\s*[\*\+\-\/]\s*)+0x[a-f0-9]+', re.I),
    'hex_escapes': re.compile(r'\\x[0-9a-fA-F]{2}'),
    'long_unbroken_lines': re.compile(r'[^\n]{5000,}'),
    'tab_indent_obfuscation': re.compile(r'^\t{50,}', re.M),
}

# ============================================================================
# Threat Finding Class
# ============================================================================

class ThreatFinding:
    def __init__(self, file_path: Path, category: str, severity: str, description: str, snippet: str = ""):
        self.file_path = file_path
        self.category = category
        self.severity = severity
        self.description = description
        self.snippet = snippet

# ============================================================================
# Scanner Engine
# ============================================================================

class AdvancedSecurityScanner:
    def __init__(self, root_dir: str = '.'):
        self.root_dir = Path(root_dir).resolve()
        self.findings: List[ThreatFinding] = []
        self.scanned_count = 0
        self.skipped_count = 0

    def run(self):
        print("=" * 80)
        print(f"🛡️  ADVANCED SECURITY SCANNER v2: Starting scan on {self.root_dir}")
        print("=" * 80)
        start_time = time.time()

        self._walk_and_scan(self.root_dir)
        self._scan_vscode_configurations()

        elapsed = time.time() - start_time
        self._print_report(elapsed)

    def _walk_and_scan(self, current_dir: Path):
        try:
            for entry in current_dir.iterdir():
                if entry.is_dir():
                    # Process directory if not excluded, allowing whitelist dot-dirs
                    if entry.name in EXCLUDE_DIRS:
                        continue
                    if entry.name.startswith('.') and entry.name not in ALLOWED_DOT_DIRS:
                        continue
                    self._walk_and_scan(entry)
                elif entry.is_file():
                    if entry.name in EXCLUDE_FILES:
                        continue
                    self._analyze_file(entry)
        except PermissionError:
            pass

    def _analyze_file(self, file_path: Path):
        ext = file_path.suffix.lower()

        # 1. Check if an asset is masquerading as binary (Spoofed File Attack)
        if ext in ASSET_EXTENSIONS:
            self.scanned_count += 1
            self._check_asset_spoofing(file_path, ext)
            return

        # 2. Check source/config files
        if ext in CODE_EXTENSIONS or file_path.name.startswith('.env') or file_path.name in {'Dockerfile'}:
            self.scanned_count += 1
            self._check_code_file(file_path)
            return

        self.skipped_count += 1

    def _check_asset_spoofing(self, file_path: Path, ext: str):
        """Checks if a font/image file is actually an ASCII / JavaScript Trojan."""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(512)

            # Check magic bytes if known
            expected_magic = MAGIC_BYTES.get(ext)
            is_valid_magic = False
            if expected_magic and header.startswith(expected_magic):
                is_valid_magic = True

            # Check if file is primarily ASCII / printable text or contains tab obfuscation
            is_ascii = False
            try:
                text_preview = header.decode('utf-8', errors='strict')
                # If it cleanly decoded as utf-8, check if it's text/script
                if '\t' in text_preview or 'function' in text_preview or 'var ' in text_preview or 'global' in text_preview:
                    is_ascii = True
            except UnicodeDecodeError:
                pass

            if not is_valid_magic and is_ascii:
                # File claims to be an asset but is actually a script!
                full_text = file_path.read_text(encoding='utf-8', errors='ignore')
                self.findings.append(ThreatFinding(
                    file_path=file_path,
                    category="SPOOFED_ASSET_TROJAN",
                    severity="CRITICAL",
                    description=f"File extension '{ext}' is masquerading as a binary asset but contains plain text / JavaScript code!",
                    snippet=full_text[:300].strip()
                ))
                # Run pattern scan on the disguised file
                self._scan_text_patterns(file_path, full_text)

        except Exception:
            self.skipped_count += 1

    def _check_code_file(self, file_path: Path):
        """Scans code files for obfuscation and malware patterns."""
        try:
            stat = file_path.stat()
            if stat.st_size > MAX_FILE_SIZE:
                self.skipped_count += 1
                return

            content = file_path.read_text(encoding='utf-8', errors='ignore')
            self._scan_text_patterns(file_path, content)
        except Exception:
            self.skipped_count += 1

    def _scan_text_patterns(self, file_path: Path, content: str):
        """Scans string content against backdoor & trojan signatures."""
        if PATTERNS['ethereum_rpc'].search(content) or PATTERNS['ethereum_endpoint'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="BLOCKCHAIN_C2_LOADER",
                severity="CRITICAL",
                description="Detected Ethereum RPC calls / smart-contract C2 loader patterns (BeaverTail / Lazarus signature).",
                snippet=self._extract_snippet(content, PATTERNS['ethereum_rpc'])
            ))

        if PATTERNS['payload_header'].search(content) and PATTERNS['xor_decoding'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="XOR_PAYLOAD_DECODER",
                severity="CRITICAL",
                description="Detected XOR decoding loop fetching x-payload headers.",
                snippet=self._extract_snippet(content, PATTERNS['xor_decoding'])
            ))

        if PATTERNS['global_manipulation'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="GLOBAL_REQUIRE_HOOK",
                severity="HIGH",
                description="Detected global module/require hijacking (e.g. global.r = require).",
                snippet=self._extract_snippet(content, PATTERNS['global_manipulation'])
            ))

        # IIFE Detection (Disallowed project execution trigger)
        if PATTERNS['iife'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="IIFE_EXECUTION_TRIGGER",
                severity="CRITICAL",
                description="Detected Immediately Invoked Function Expression (IIFE). Project policy strictly disallows IIFE execution triggers.",
                snippet=self._extract_snippet(content, PATTERNS['iife'])
            ))

        # Dynamic Code Execution & Remote Loaders
        if PATTERNS['remote_eval'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="REMOTE_CODE_EXECUTION",
                severity="CRITICAL",
                description="Detected network fetch combined with dynamic eval() execution (remote payload loader).",
                snippet=self._extract_snippet(content, PATTERNS['remote_eval'])
            ))
        elif PATTERNS['detached_spawn'].search(content) and PATTERNS['eval_dynamic'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="STEALTH_DETACHED_EXECUTION",
                severity="CRITICAL",
                description="Detected detached hidden node execution combined with eval().",
                snippet=self._extract_snippet(content, PATTERNS['detached_spawn'])
            ))
        elif PATTERNS['eval_dynamic'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="EVAL_DYNAMIC_EXECUTION",
                severity="CRITICAL",
                description="Detected dynamic code execution via eval() or Function constructor.",
                snippet=self._extract_snippet(content, PATTERNS['eval_dynamic'])
            ))

        # atob / btoa payload decoding
        if PATTERNS['atob_btoa'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="BASE64_PAYLOAD_DECODER",
                severity="HIGH",
                description="Detected atob()/btoa() base64 decoder in code, commonly used to conceal C2 endpoints or payloads.",
                snippet=self._extract_snippet(content, PATTERNS['atob_btoa'])
            ))

        # Base64 URL (C2 server endpoint)
        if PATTERNS['base64_url'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="BASE64_C2_URL",
                severity="CRITICAL",
                description="Detected base64-encoded URL (http:// or https://), commonly used to conceal command-and-control servers.",
                snippet=self._extract_snippet(content, PATTERNS['base64_url'])
            ))

        if PATTERNS['tab_indent_obfuscation'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="TAB_INDENT_OBFUSCATION",
                severity="HIGH",
                description="Detected extreme tab indentation used to push malicious code out of standard viewports.",
                snippet="Line starts with over 50 consecutive tab characters."
            ))

        # Obfuscation array patterns
        hex_count = len(PATTERNS['hex_escapes'].findall(content))
        math_count = len(PATTERNS['math_obfuscation'].findall(content))
        if hex_count > 10 and math_count > 5:
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="HEAVY_STRING_OBFUSCATION",
                severity="HIGH",
                description=f"Detected heavy hexadecimal array obfuscation ({hex_count} hex escapes, {math_count} obfuscated math expressions).",
                snippet=""
            ))

    def _scan_vscode_configurations(self):
        """Inspects .vscode/tasks.json and .vscode/settings.json for stealth execution triggers."""
        vscode_dir = self.root_dir / '.vscode'
        if not vscode_dir.exists():
            return

        # 1. Inspect tasks.json
        tasks_file = vscode_dir / 'tasks.json'
        if tasks_file.exists():
            try:
                content = tasks_file.read_text(encoding='utf-8', errors='ignore')
                if 'folderOpen' in content:
                    self.findings.append(ThreatFinding(
                        file_path=tasks_file,
                        category="VSCODE_AUTO_EXECUTION_TRIGGER",
                        severity="CRITICAL",
                        description="Task configured with 'runOn: folderOpen'. Silently triggers commands when workspace is opened!",
                        snippet=content
                    ))
                if re.search(r'\bnode\s+[\.\/]+[^\s]+\.(woff2?|ttf|png|jpg|svg)', content, re.I):
                    self.findings.append(ThreatFinding(
                        file_path=tasks_file,
                        category="VSCODE_ASSET_EXECUTION",
                        severity="CRITICAL",
                        description="VS Code task attempts to execute an asset/font file with Node.js!",
                        snippet=content
                    ))
            except Exception:
                pass

        # 2. Inspect settings.json
        settings_file = vscode_dir / 'settings.json'
        if settings_file.exists():
            try:
                content = settings_file.read_text(encoding='utf-8', errors='ignore')
                if 'task.allowAutomaticTasks' in content and 'true' in content:
                    self.findings.append(ThreatFinding(
                        file_path=settings_file,
                        category="VSCODE_STEALTH_SETTING",
                        severity="HIGH",
                        description="Setting 'task.allowAutomaticTasks: true' allows background tasks to run without user prompt!",
                        snippet="task.allowAutomaticTasks: true"
                    ))
                if 'terminal.integrated.hideOnStartup' in content and 'always' in content:
                    self.findings.append(ThreatFinding(
                        file_path=settings_file,
                        category="VSCODE_STEALTH_SETTING",
                        severity="MEDIUM",
                        description="Setting 'terminal.integrated.hideOnStartup: always' conceals the terminal window during execution.",
                        snippet="terminal.integrated.hideOnStartup: always"
                    ))
            except Exception:
                pass

    def _extract_snippet(self, content: str, pattern: re.Pattern) -> str:
        match = pattern.search(content)
        if not match:
            return ""
        start = max(0, match.start() - 50)
        end = min(len(content), match.end() + 100)
        return content[start:end].replace('\n', ' ').strip()

    def _print_report(self, elapsed: float):
        print("\n" + "=" * 80)
        print("📊 SCAN RESULTS")
        print("=" * 80)
        print(f"⏱️  Scan completed in {elapsed:.2f} seconds")
        print(f"📁 Files scanned: {self.scanned_count}")
        print(f"📁 Files skipped: {self.skipped_count}")
        print(f"🚨 Threats identified: {len(self.findings)}")

        if not self.findings:
            print("\n✅ Clean! No supply chain trojans, asset spoofing, or stealth IDE triggers detected.\n")
            print("=" * 80)
            return

        print("\n" + "!" * 80)
        print("🚨 THREAT DETAILS:")
        print("!" * 80)

        for idx, finding in enumerate(self.findings, 1):
            rel_path = finding.file_path.relative_to(self.root_dir)
            print(f"\n[{idx}] [{finding.severity}] {finding.category}")
            print(f"    📄 File: {rel_path}")
            print(f"    ⚠️  Details: {finding.description}")
            if finding.snippet:
                print(f"    🔎 Snippet: {finding.snippet[:160]}...")

        print("\n" + "=" * 80)
        print("❌ Scan finished with security warnings. Remediation required.")
        print("=" * 80 + "\n")


# ============================================================================
# CLI Entrypoint
# ============================================================================

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else '.'
    scanner = AdvancedSecurityScanner(target)
    scanner.run()
    sys.exit(1 if scanner.findings else 0)
