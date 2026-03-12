import * as crypto from 'crypto';

export type EngineType = 'camoufox' | 'patchright' | 'nodriver';
export type SessionStatus = 'creating' | 'running' | 'paused' | 'stopped' | 'error';

export interface EngineConfig {
  type: EngineType;
  profileId: string;
  fingerprintConfig?: Record<string, unknown>;
  proxyConfig?: ProxyConfig;
  headless?: boolean;
  userDataDir?: string;
}

export interface ProxyConfig {
  type: 'socks5' | 'http' | 'residential';
  host: string;
  port: number;
  credentialRef?: string;
}

export interface BrowserSession {
  id: string;
  engineType: EngineType;
  profileId: string;
  workspaceId?: string;
  status: SessionStatus;
  pid?: number;
  startedAt: string;
  lastActivityAt: string;
  metadata: Record<string, unknown>;
}

export interface SessionLaunchResult {
  success: boolean;
  session?: BrowserSession;
  error?: string;
}

/**
 * Manages browser engine instances. Phase 1 provides session tracking
 * without actual browser launching (Camoufox/Patchright integration planned for Phase 2).
 */
export class EngineManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private maxSessions: number;

  constructor(options?: { maxSessions?: number }) {
    this.maxSessions = options?.maxSessions ?? 50;
  }

  /**
   * Launch a new browser session with the given engine configuration.
   * Phase 1: creates session record only (no actual browser process).
   */
  async launchSession(config: EngineConfig, workspaceId?: string): Promise<SessionLaunchResult> {
    const activeSessions = [...this.sessions.values()].filter(s => s.status === 'running');
    if (activeSessions.length >= this.maxSessions) {
      return { success: false, error: `Maximum sessions (${this.maxSessions}) reached` };
    }

    const id = crypto.randomUUID();
    const session: BrowserSession = {
      id,
      engineType: config.type,
      profileId: config.profileId,
      workspaceId,
      status: 'running',
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      metadata: {
        headless: config.headless ?? false,
        hasProxy: !!config.proxyConfig,
        hasFingerprint: !!config.fingerprintConfig,
        engineNote: 'Phase 1: session tracking only',
      },
    };

    this.sessions.set(id, session);
    return { success: true, session };
  }

  /** Stop a browser session */
  async stopSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = 'stopped';
    session.lastActivityAt = new Date().toISOString();
    return true;
  }

  /** Pause a browser session */
  async pauseSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'running') return false;
    session.status = 'paused';
    session.lastActivityAt = new Date().toISOString();
    return true;
  }

  /** Resume a paused browser session */
  async resumeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'paused') return false;
    session.status = 'running';
    session.lastActivityAt = new Date().toISOString();
    return true;
  }

  /** Get a session by ID */
  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** List sessions with optional filters */
  listSessions(filter?: { workspaceId?: string; status?: SessionStatus; engineType?: EngineType }): BrowserSession[] {
    let sessions = [...this.sessions.values()];
    if (filter?.workspaceId) {
      sessions = sessions.filter(s => s.workspaceId === filter.workspaceId);
    }
    if (filter?.status) {
      sessions = sessions.filter(s => s.status === filter.status);
    }
    if (filter?.engineType) {
      sessions = sessions.filter(s => s.engineType === filter.engineType);
    }
    return sessions;
  }

  /** Clean up stopped/error sessions older than maxAgeMs */
  cleanupSessions(maxAgeMs: number = 3600000): number {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;
    for (const [id, session] of this.sessions) {
      if (
        (session.status === 'stopped' || session.status === 'error') &&
        new Date(session.lastActivityAt).getTime() < cutoff
      ) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  /** Get supported engine types and availability */
  getEngineStatus(): Record<EngineType, { available: boolean; note: string }> {
    return {
      camoufox: { available: false, note: 'Planned: Firefox-based, C++ fingerprint injection' },
      patchright: { available: false, note: 'Planned: CDP leak-free Playwright fork' },
      nodriver: { available: false, note: 'Planned: Zero CDP footprint automation' },
    };
  }

  /** Get count of active sessions */
  getActiveSessionCount(): number {
    return [...this.sessions.values()].filter(s => s.status === 'running').length;
  }
}
