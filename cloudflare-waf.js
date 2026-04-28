/**
 * OpenClaw WAF - Web Application Firewall
 * Cloudflare Worker for protecting OpenClaw API endpoints
 */

interface Env {
  OPENCLAW_API_URL: string;
  WAF_BLOCKLIST: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') ||
                     request.headers.get('X-Forwarded-For') ||
                     request.headers.get('X-Real-IP') ||
                     'unknown';

    // Skip WAF for non-API routes
    if (!url.pathname.startsWith('/api/')) {
      return fetch(request);
    }

    // 1. Check if IP is blocked
    const blocklistKey = `blocked:${clientIP}`;
    const isBlocked = await env.WAF_BLOCKLIST.get(blocklistKey);
    if (isBlocked) {
      return new Response(JSON.stringify({
        error: 'Access denied',
        message: 'Your IP address has been blocked due to suspicious activity.',
        cyberpunk: {
          errorGlow: true,
          matrixError: 'ACCESS_DENIED',
          systemStatus: 'PROTECTED'
        }
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Advanced rate limiting with KV storage
    const rateLimitKey = `ratelimit:${clientIP}:${Math.floor(Date.now() / 60000)}`; // Per minute
    const currentCount = parseInt(await env.RATE_LIMIT_KV.get(rateLimitKey) || '0');
    const maxRequests = url.pathname.includes('/api/chat') ? 30 : 60; // Stricter for chat

    if (currentCount >= maxRequests) {
      // Auto-block suspicious IPs
      await env.WAF_BLOCKLIST.put(blocklistKey, 'rate-limit-violation', { expirationTtl: 3600 }); // 1 hour

      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Your IP has been temporarily blocked.',
        cyberpunk: {
          warningGlow: true,
          matrixWarning: 'AUTO_BLOCK_ACTIVATED',
          systemStatus: 'DEFENSE_MODE'
        }
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.RATE_LIMIT_KV.put(rateLimitKey, (currentCount + 1).toString(), { expirationTtl: 60 });

    // 3. Request sanitization and attack detection
    const suspicious = await detectAttacks(request);
    if (suspicious) {
      // Log suspicious activity
      await env.WAF_BLOCKLIST.put(`suspicious:${clientIP}`, JSON.stringify({
        timestamp: Date.now(),
        url: url.pathname,
        userAgent: request.headers.get('User-Agent'),
        reason: suspicious.reason
      }), { expirationTtl: 86400 }); // 24 hours

      return new Response(JSON.stringify({
        error: 'Suspicious activity detected',
        message: 'Request blocked by security system.',
        cyberpunk: {
          errorGlow: true,
          matrixError: 'SECURITY_VIOLATION',
          systemStatus: 'ALERT'
        }
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Request size limits
    const contentLength = parseInt(request.headers.get('Content-Length') || '0');
    if (contentLength > 1024 * 1024) { // 1MB limit
      return new Response(JSON.stringify({
        error: 'Request too large',
        message: 'Request payload exceeds size limit.',
        cyberpunk: {
          warningGlow: true,
          matrixWarning: 'PAYLOAD_TOO_LARGE',
          systemStatus: 'PROTECTED'
        }
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Add security headers to response
    try {
      const response = await fetch(`${env.OPENCLAW_API_URL}${url.pathname}${url.search}`, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      // Clone response to add security headers
      const newResponse = new Response(response.body, response);

      // Add security headers
      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
      newResponse.headers.set('X-Frame-Options', 'DENY');
      newResponse.headers.set('X-XSS-Protection', '1; mode=block');
      newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      newResponse.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
      newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Add OpenClaw branding header
      newResponse.headers.set('X-Powered-By', 'OpenClaw-AI');
      newResponse.headers.set('X-Defense-System', 'ACTIVE');

      return newResponse;

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Service unavailable',
        message: 'OpenClaw security system is protecting the service.',
        cyberpunk: {
          errorGlow: true,
          matrixError: 'SERVICE_PROTECTED',
          systemStatus: 'DEFENSE_ACTIVE'
        }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Detect common web attacks and suspicious patterns
 */
async function detectAttacks(request: Request): Promise<{detected: boolean, reason?: string} | null> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  const body = await request.text();

  // SQL Injection patterns
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(;)|(\\\\)|(\\")|(\\')|(\\n)|(\\r)|(\\t))/i,
    /('|(\\x27)|(\\x2D\\x2D)|(;)|(\\\\)|(\\")|(\\')|(\\n)|(\\r)|(\\t)|(%27)|(%22)|(%3B))/i
  ];

  // XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi
  ];

  // Path traversal
  const traversalPatterns = [
    /\.\.\//g,
    /\.\\/g,
    /%2e%2e%2f/g,
    /%2e%2e\/g
  ];

  // Command injection
  const commandPatterns = [
    /;.*rm\s+/i,
    /;.*del\s+/i,
    /;.*format\s+/i,
    /\|.*cmd/i,
    /\|.*powershell/i
  ];

  // Suspicious user agents
  const suspiciousUAs = [
    /sqlmap/i,
    /nmap/i,
    /masscan/i,
    /dirbuster/i,
    /gobuster/i,
    /nikto/i,
    /acunetix/i,
    /openvas/i,
    /nessus/i,
    /qualys/i
  ];

  // Check all patterns
  const allPatterns = [
    ...sqlPatterns.map(p => ({ pattern: p, type: 'SQL Injection' })),
    ...xssPatterns.map(p => ({ pattern: p, type: 'XSS Attack' })),
    ...traversalPatterns.map(p => ({ pattern: p, type: 'Path Traversal' })),
    ...commandPatterns.map(p => ({ pattern: p, type: 'Command Injection' })),
    ...suspiciousUAs.map(p => ({ pattern: p, type: 'Suspicious Scanner' }))
  ];

  const checkText = `${url.pathname}${url.search}${body}${userAgent}`;

  for (const { pattern, type } of allPatterns) {
    if (pattern.test(checkText)) {
      return { detected: true, reason: type };
    }
  }

  return null;
}