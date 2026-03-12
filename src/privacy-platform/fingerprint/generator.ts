import * as crypto from 'crypto';

export interface FingerprintSpec {
  os: 'windows' | 'macos' | 'linux';
  osVersion?: string;
  browser: 'chrome' | 'firefox';
  browserVersion?: string;
  locale?: string;
  timezone?: string;
  screenCategory?: 'desktop' | 'laptop' | 'mobile';
}

export interface GeneratedFingerprint {
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  hardwareConcurrency: number;
  deviceMemory: number;
  maxTouchPoints: number;
  screenWidth: number;
  screenHeight: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
  webglVendor: string;
  webglRenderer: string;
  doNotTrack: string | null;
  cookieEnabled: boolean;
  pdfViewerEnabled: boolean;
  connectionType: string;
  downlink: number;
  rtt: number;
  timezone: string;
  timezoneOffset: number;
  fonts: string[];
  canvasNoiseSeed: number;
  audioNoiseSeed: number;
  coherenceScore: number;
  generatedAt: string;
}

export interface CoherenceCheckResult {
  coherent: boolean;
  score: number;
  issues: string[];
}

// --- Internal data tables ---

const OS_PLATFORMS: Record<string, string> = {
  windows: 'Win32',
  macos: 'MacIntel',
  linux: 'Linux x86_64',
};

const OS_VERSIONS: Record<string, string[]> = {
  windows: ['10.0', '10.0'],
  macos: ['10_15_7', '13_0', '14_0'],
  linux: ['x86_64'],
};

const CHROME_VERSIONS = ['120.0.6099.130', '121.0.6167.85', '122.0.6261.69', '123.0.6312.58', '124.0.6367.91'];
const FIREFOX_VERSIONS = ['121.0', '122.0', '123.0', '124.0', '125.0'];

const SCREEN_RESOLUTIONS: Record<string, Array<[number, number]>> = {
  desktop: [[1920, 1080], [2560, 1440], [3840, 2160]],
  laptop: [[1366, 768], [1440, 900], [1536, 864], [1920, 1080]],
  mobile: [[360, 640], [375, 667], [414, 896]],
};

const OS_FONTS: Record<string, string[]> = {
  windows: [
    'Arial', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier New',
    'Georgia', 'Impact', 'Lucida Console', 'Segoe UI', 'Tahoma',
    'Times New Roman', 'Trebuchet MS', 'Verdana',
  ],
  macos: [
    'Arial', 'Helvetica', 'Helvetica Neue', 'Lucida Grande', 'Menlo',
    'Monaco', 'Times', 'Courier', 'Georgia', 'Palatino',
    'Trebuchet MS', 'Verdana',
  ],
  linux: [
    'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono', 'Liberation Mono',
    'Liberation Sans', 'Liberation Serif', 'Noto Sans', 'Noto Serif',
    'Ubuntu', 'Ubuntu Mono', 'Courier New', 'Arial',
  ],
};

const GPU_PROFILES: Record<string, Array<{ vendor: string; renderer: string }>> = {
  windows: [
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060, OpenGL 4.5)' },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060, OpenGL 4.5)' },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.5)' },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 580, OpenGL 4.5)' },
  ],
  macos: [
    { vendor: 'Apple', renderer: 'Apple M1' },
    { vendor: 'Apple', renderer: 'Apple M2' },
    { vendor: 'Apple', renderer: 'Apple GPU' },
    { vendor: 'Apple', renderer: 'AMD Radeon Pro 5500M' },
  ],
  linux: [
    { vendor: 'Mesa', renderer: 'Mesa Intel(R) UHD Graphics (CML GT2)' },
    { vendor: 'Mesa', renderer: 'Mesa AMD RADV NAVI10' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1060/PCIe/SSE2' },
  ],
};

const TIMEZONE_LOCALE_MAP: Record<string, { lang: string; langs: string[] }> = {
  'America/New_York': { lang: 'en-US', langs: ['en-US', 'en'] },
  'America/Chicago': { lang: 'en-US', langs: ['en-US', 'en'] },
  'America/Los_Angeles': { lang: 'en-US', langs: ['en-US', 'en'] },
  'America/Denver': { lang: 'en-US', langs: ['en-US', 'en'] },
  'Europe/London': { lang: 'en-GB', langs: ['en-GB', 'en'] },
  'Europe/Berlin': { lang: 'de-DE', langs: ['de-DE', 'de', 'en'] },
  'Europe/Paris': { lang: 'fr-FR', langs: ['fr-FR', 'fr', 'en'] },
  'Europe/Madrid': { lang: 'es-ES', langs: ['es-ES', 'es', 'en'] },
  'Europe/Rome': { lang: 'it-IT', langs: ['it-IT', 'it', 'en'] },
  'Asia/Tokyo': { lang: 'ja-JP', langs: ['ja-JP', 'ja', 'en'] },
  'Asia/Shanghai': { lang: 'zh-CN', langs: ['zh-CN', 'zh', 'en'] },
  'Asia/Seoul': { lang: 'ko-KR', langs: ['ko-KR', 'ko', 'en'] },
  'Australia/Sydney': { lang: 'en-AU', langs: ['en-AU', 'en'] },
  'America/Sao_Paulo': { lang: 'pt-BR', langs: ['pt-BR', 'pt', 'en'] },
};

const TIMEZONE_OFFSETS: Record<string, number> = {
  'America/New_York': 300,
  'America/Chicago': 360,
  'America/Denver': 420,
  'America/Los_Angeles': 480,
  'Europe/London': 0,
  'Europe/Berlin': -60,
  'Europe/Paris': -60,
  'Europe/Madrid': -60,
  'Europe/Rome': -60,
  'Asia/Tokyo': -540,
  'Asia/Shanghai': -480,
  'Asia/Seoul': -540,
  'Australia/Sydney': -660,
  'America/Sao_Paulo': 180,
};

const TIMEZONES = Object.keys(TIMEZONE_LOCALE_MAP);
const HW_CONCURRENCY = [2, 4, 4, 4, 6, 8, 8, 8, 12, 16];
const DEVICE_MEMORY = [2, 4, 4, 8, 8, 8, 16, 16];
const CONNECTION_TYPES = ['4g', '4g', '4g', 'wifi', 'wifi'];
const PIXEL_RATIOS = [1, 1, 1.25, 1.5, 2, 2, 3];

/**
 * Rule-based fingerprint generator with cross-parameter coherence validation.
 * Uses deterministic seeded randomness so the same spec produces the same fingerprint.
 */
export class FingerprintGenerator {
  /** Generate a complete coherent fingerprint from a spec */
  generate(spec: FingerprintSpec): GeneratedFingerprint {
    const rng = new SeededRandom(this.specToSeed(spec));

    const os = spec.os;
    const browser = spec.browser;
    const screenCat = spec.screenCategory ?? 'laptop';
    const tz = spec.timezone ?? rng.pick(TIMEZONES);
    const localeInfo = TIMEZONE_LOCALE_MAP[tz] ?? { lang: 'en-US', langs: ['en-US', 'en'] };
    const lang = spec.locale ?? localeInfo.lang;
    const langs = spec.locale ? [spec.locale, spec.locale.split('-')[0]] : localeInfo.langs;

    const resolutions = SCREEN_RESOLUTIONS[screenCat] ?? SCREEN_RESOLUTIONS.laptop;
    const [sw, sh] = rng.pick(resolutions);
    const taskbarHeight = screenCat === 'mobile' ? 0 : rng.pick([30, 40, 48, 56]);

    const gpu = rng.pick(GPU_PROFILES[os] ?? GPU_PROFILES.windows);
    const isMobile = screenCat === 'mobile';

    const browserVersion = spec.browserVersion ?? (
      browser === 'chrome' ? rng.pick(CHROME_VERSIONS) : rng.pick(FIREFOX_VERSIONS)
    );
    const osVersion = spec.osVersion ?? rng.pick(OS_VERSIONS[os] ?? ['10.0']);

    const fp: GeneratedFingerprint = {
      userAgent: this.buildUserAgent(os, osVersion, browser, browserVersion),
      platform: OS_PLATFORMS[os] ?? 'Win32',
      language: lang,
      languages: langs,
      hardwareConcurrency: rng.pick(HW_CONCURRENCY),
      deviceMemory: rng.pick(DEVICE_MEMORY),
      maxTouchPoints: isMobile ? rng.pick([1, 5, 10]) : 0,
      screenWidth: sw,
      screenHeight: sh,
      availWidth: sw,
      availHeight: sh - taskbarHeight,
      colorDepth: 24,
      pixelRatio: isMobile ? rng.pick([2, 3]) : rng.pick(PIXEL_RATIOS),
      webglVendor: gpu.vendor,
      webglRenderer: gpu.renderer,
      doNotTrack: rng.pick([null, null, null, '1']),
      cookieEnabled: true,
      pdfViewerEnabled: browser === 'chrome',
      connectionType: rng.pick(CONNECTION_TYPES),
      downlink: rng.pick([1.5, 2.5, 5, 10, 20, 50]),
      rtt: rng.pick([50, 100, 150, 200, 250]),
      timezone: tz,
      timezoneOffset: TIMEZONE_OFFSETS[tz] ?? 0,
      fonts: [...(OS_FONTS[os] ?? OS_FONTS.windows)],
      canvasNoiseSeed: rng.nextInt(1000000),
      audioNoiseSeed: rng.nextInt(1000000),
      coherenceScore: 0,
      generatedAt: new Date().toISOString(),
    };

    const check = this.validateCoherence(fp);
    fp.coherenceScore = check.score;

    return fp;
  }

  /** Validate cross-parameter coherence of a fingerprint */
  validateCoherence(fp: GeneratedFingerprint): CoherenceCheckResult {
    const issues: string[] = [];
    let score = 100;

    // 1. UA OS matches platform
    if (fp.userAgent.includes('Windows') && fp.platform !== 'Win32') {
      issues.push('UA claims Windows but platform is not Win32');
      score -= 15;
    }
    if (fp.userAgent.includes('Macintosh') && fp.platform !== 'MacIntel') {
      issues.push('UA claims macOS but platform is not MacIntel');
      score -= 15;
    }
    if (fp.userAgent.includes('Linux') && !fp.platform.includes('Linux')) {
      issues.push('UA claims Linux but platform does not match');
      score -= 15;
    }

    // 2. Screen resolution is standard
    const allRes = [...SCREEN_RESOLUTIONS.desktop, ...SCREEN_RESOLUTIONS.laptop, ...SCREEN_RESOLUTIONS.mobile];
    const resMatch = allRes.some(([w, h]) => w === fp.screenWidth && h === fp.screenHeight);
    if (!resMatch) {
      issues.push(`Non-standard screen resolution: ${fp.screenWidth}x${fp.screenHeight}`);
      score -= 10;
    }

    // 3. hardwareConcurrency is realistic
    if (![1, 2, 4, 6, 8, 10, 12, 16, 24, 32].includes(fp.hardwareConcurrency)) {
      issues.push(`Unusual hardwareConcurrency: ${fp.hardwareConcurrency}`);
      score -= 8;
    }

    // 4. deviceMemory is standard
    if (![1, 2, 4, 8, 16, 32].includes(fp.deviceMemory)) {
      issues.push(`Non-standard deviceMemory: ${fp.deviceMemory}`);
      score -= 8;
    }

    // 5. Fonts match OS
    const detectedOs = this.detectOsFromUa(fp.userAgent);
    if (detectedOs) {
      const expectedFonts = OS_FONTS[detectedOs] ?? [];
      const fontOverlap = fp.fonts.filter(f => expectedFonts.includes(f)).length;
      const overlapRatio = expectedFonts.length > 0 ? fontOverlap / expectedFonts.length : 0;
      if (overlapRatio < 0.5) {
        issues.push(`Font list has low overlap with ${detectedOs} fonts (${Math.round(overlapRatio * 100)}%)`);
        score -= 12;
      }
    }

    // 6. Timezone offset matches timezone string
    const expectedOffset = TIMEZONE_OFFSETS[fp.timezone];
    if (expectedOffset !== undefined && fp.timezoneOffset !== expectedOffset) {
      issues.push(`Timezone offset ${fp.timezoneOffset} doesn't match ${fp.timezone} (expected ${expectedOffset})`);
      score -= 10;
    }

    // 7. colorDepth is standard
    if (![24, 30, 32].includes(fp.colorDepth)) {
      issues.push(`Non-standard colorDepth: ${fp.colorDepth}`);
      score -= 5;
    }

    // 8. pixelRatio is standard
    if (![1, 1.25, 1.5, 2, 2.5, 3].includes(fp.pixelRatio)) {
      issues.push(`Non-standard pixelRatio: ${fp.pixelRatio}`);
      score -= 5;
    }

    // 9. webglVendor matches OS
    if (detectedOs === 'macos' && !fp.webglVendor.includes('Apple') && !fp.webglVendor.includes('AMD')) {
      issues.push('macOS should have Apple or AMD GPU vendor');
      score -= 8;
    }
    if (detectedOs === 'windows' && !fp.webglVendor.includes('Google') && !fp.webglVendor.includes('NVIDIA') && !fp.webglVendor.includes('AMD') && !fp.webglVendor.includes('Intel')) {
      issues.push('Windows should have ANGLE, NVIDIA, AMD, or Intel GPU vendor');
      score -= 8;
    }

    // 10. maxTouchPoints consistency
    const isMobileUa = fp.userAgent.includes('Mobile') || fp.userAgent.includes('Android');
    if (!isMobileUa && fp.maxTouchPoints > 0) {
      issues.push('Desktop UA but maxTouchPoints > 0');
      score -= 5;
    }

    // 11. availHeight < screenHeight
    if (fp.availHeight > fp.screenHeight) {
      issues.push('availHeight exceeds screenHeight');
      score -= 5;
    }

    // 12. availWidth <= screenWidth
    if (fp.availWidth > fp.screenWidth) {
      issues.push('availWidth exceeds screenWidth');
      score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      coherent: issues.length === 0,
      score,
      issues,
    };
  }

  private buildUserAgent(os: string, osVersion: string, browser: string, browserVersion: string): string {
    let osPart: string;
    switch (os) {
      case 'windows':
        osPart = `Windows NT ${osVersion}; Win64; x64`;
        break;
      case 'macos':
        osPart = `Macintosh; Intel Mac OS X ${osVersion}`;
        break;
      case 'linux':
        osPart = 'X11; Linux x86_64';
        break;
      default:
        osPart = `Windows NT 10.0; Win64; x64`;
    }

    if (browser === 'firefox') {
      return `Mozilla/5.0 (${osPart}; rv:${browserVersion}) Gecko/20100101 Firefox/${browserVersion}`;
    }

    const majorVersion = browserVersion.split('.')[0];
    return `Mozilla/5.0 (${osPart}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`;
  }

  private detectOsFromUa(ua: string): string | null {
    if (ua.includes('Windows')) return 'windows';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macos';
    if (ua.includes('Linux') || ua.includes('X11')) return 'linux';
    return null;
  }

  private specToSeed(spec: FingerprintSpec): number {
    const str = JSON.stringify({
      os: spec.os,
      osVersion: spec.osVersion,
      browser: spec.browser,
      browserVersion: spec.browserVersion,
      locale: spec.locale,
      timezone: spec.timezone,
      screenCategory: spec.screenCategory,
    });
    const hash = crypto.createHash('sha256').update(str).digest();
    return hash.readUInt32BE(0);
  }
}

/** Simple seeded PRNG for deterministic fingerprint generation */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff;
    return (this.state >>> 0) / 0xffffffff;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(arr.length)];
  }
}
