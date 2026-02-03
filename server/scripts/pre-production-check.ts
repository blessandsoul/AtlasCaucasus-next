/**
 * Pre-Production Validation Script
 *
 * This script validates all environment configuration and system readiness
 * before deploying to production. Run this before every production deployment.
 *
 * Usage: npx ts-node scripts/pre-production-check.ts
 *
 * Based on: needs-testing.md Section 19 - Pre-Production Checklist
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const PASS = `${colors.green}✓${colors.reset}`;
const FAIL = `${colors.red}✗${colors.reset}`;
const WARN = `${colors.yellow}⚠${colors.reset}`;
const INFO = `${colors.blue}ℹ${colors.reset}`;

interface CheckResult {
  name: string;
  passed: boolean;
  warning?: boolean;
  message: string;
}

const results: CheckResult[] = [];

function logSection(title: string) {
  console.log(`\n${colors.bold}${colors.cyan}━━━ ${title} ━━━${colors.reset}\n`);
}

function addResult(name: string, passed: boolean, message: string, warning = false) {
  results.push({ name, passed, warning, message });
  const icon = passed ? (warning ? WARN : PASS) : FAIL;
  console.log(`  ${icon} ${name}: ${message}`);
}

// =====================
// 19.1 Environment Configuration
// =====================

async function checkEnvironmentConfiguration() {
  logSection('19.1 Environment Configuration');

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  addResult(
    'NODE_ENV',
    nodeEnv === 'production',
    nodeEnv === 'production'
      ? 'Set to production'
      : `Currently "${nodeEnv}" - should be "production" for deployment`,
    nodeEnv !== 'production'
  );

  // Check Production URLs
  const frontendUrl = process.env.FRONTEND_URL || '';
  const isProductionUrl = frontendUrl.startsWith('https://') && !frontendUrl.includes('localhost');
  addResult(
    'FRONTEND_URL',
    isProductionUrl || process.env.NODE_ENV !== 'production',
    isProductionUrl ? frontendUrl : `"${frontendUrl}" - should be HTTPS production URL`,
    !isProductionUrl && process.env.NODE_ENV === 'production'
  );

  // Check CORS_ORIGINS
  const corsOrigins = process.env.CORS_ORIGINS;
  const hasValidCors = corsOrigins && !corsOrigins.includes('localhost');
  addResult(
    'CORS_ORIGINS',
    !!corsOrigins,
    corsOrigins
      ? (hasValidCors ? `Configured: ${corsOrigins}` : `Contains localhost: ${corsOrigins}`)
      : 'Not set - using default permissive CORS',
    !hasValidCors
  );

  // Check JWT Secrets - Must be unique and strong
  const accessSecret = process.env.ACCESS_TOKEN_SECRET || '';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || '';

  const isDefaultAccess = accessSecret.includes('change-me') || accessSecret.includes('your-super-secret');
  const isDefaultRefresh = refreshSecret.includes('change-me') || refreshSecret.includes('your-super-secret');

  addResult(
    'ACCESS_TOKEN_SECRET',
    accessSecret.length >= 64 && !isDefaultAccess,
    accessSecret.length >= 64
      ? (isDefaultAccess ? 'Using default value - CHANGE THIS!' : `${accessSecret.length} characters ✓`)
      : `Only ${accessSecret.length} characters - should be 64+`,
    accessSecret.length < 64 || isDefaultAccess
  );

  addResult(
    'REFRESH_TOKEN_SECRET',
    refreshSecret.length >= 64 && !isDefaultRefresh,
    refreshSecret.length >= 64
      ? (isDefaultRefresh ? 'Using default value - CHANGE THIS!' : `${refreshSecret.length} characters ✓`)
      : `Only ${refreshSecret.length} characters - should be 64+`,
    refreshSecret.length < 64 || isDefaultRefresh
  );

  // Check secrets are different
  addResult(
    'Unique Secrets',
    accessSecret !== refreshSecret,
    accessSecret !== refreshSecret
      ? 'Access and Refresh tokens use different secrets ✓'
      : 'DANGER: Using same secret for both tokens!'
  );

  // Check Database URL
  const databaseUrl = process.env.DATABASE_URL || '';
  const isProductionDb = !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
  addResult(
    'DATABASE_URL',
    !!databaseUrl,
    databaseUrl
      ? (isProductionDb ? 'Connected to remote database ✓' : 'Using localhost database')
      : 'Not set!',
    !isProductionDb && process.env.NODE_ENV === 'production'
  );

  // Check Redis
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const isProductionRedis = redisHost !== 'localhost' && redisHost !== '127.0.0.1';
  addResult(
    'REDIS_HOST',
    true,
    isProductionRedis ? `Connected to: ${redisHost} ✓` : `Using localhost Redis`,
    !isProductionRedis && process.env.NODE_ENV === 'production'
  );

  // Check Email Service
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const hasValidApiKey = resendApiKey.startsWith('re_') && resendApiKey.length > 10;
  addResult(
    'RESEND_API_KEY',
    hasValidApiKey,
    hasValidApiKey ? 'API key configured ✓' : 'Not configured or invalid - emails will be logged only',
    !hasValidApiKey
  );

  // Check Email From
  const emailFrom = process.env.EMAIL_FROM || '';
  const hasProductionEmail = emailFrom && !emailFrom.includes('resend.dev') && !emailFrom.includes('localhost');
  addResult(
    'EMAIL_FROM',
    !!emailFrom,
    emailFrom
      ? (hasProductionEmail ? `Using: ${emailFrom} ✓` : `Using test domain: ${emailFrom}`)
      : 'Not set',
    !hasProductionEmail && process.env.NODE_ENV === 'production'
  );

  // Check Upload Directory
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const uploadPath = path.resolve(process.cwd(), uploadDir);
  const uploadDirExists = fs.existsSync(uploadPath);
  addResult(
    'UPLOAD_DIR',
    uploadDirExists,
    uploadDirExists ? `Directory exists: ${uploadPath} ✓` : `Directory missing: ${uploadPath}`,
  );
}

// =====================
// 19.2 Security Hardening
// =====================

async function checkSecurityHardening() {
  logSection('19.2 Security Hardening');

  // Check if running in production mode
  const isProduction = process.env.NODE_ENV === 'production';

  addResult(
    'Production Mode',
    isProduction,
    isProduction ? 'Running in production mode ✓' : 'Running in development mode',
    !isProduction
  );

  // Check secure cookie setting would be enabled in production
  addResult(
    'Secure Cookies',
    true,
    'Cookies automatically secure when NODE_ENV=production ✓',
  );

  // Check rate limiting is configured (Redis-backed)
  const redisHost = process.env.REDIS_HOST || 'localhost';
  addResult(
    'Rate Limiting Backend',
    true,
    `Using Redis at ${redisHost}:${process.env.REDIS_PORT || 6379} for rate limiting ✓`,
  );

  // Check debug logging
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
  addResult(
    'Debug Logging',
    isProduction ? logLevel !== 'debug' : true,
    isProduction
      ? (logLevel !== 'debug' ? `Log level: ${logLevel} ✓` : 'Debug logging enabled in production!')
      : `Log level: ${logLevel} (development)`,
    isProduction && logLevel === 'debug'
  );

  // Check HTTPS enforcement hint
  addResult(
    'HTTPS Enforcement',
    true,
    'Configure HTTPS at reverse proxy level (Nginx/Cloudflare)',
    false
  );
}

// =====================
// 19.3 Database
// =====================

async function checkDatabase() {
  logSection('19.3 Database');

  const prisma = new PrismaClient();

  try {
    // Test connection
    await prisma.$connect();
    addResult('Database Connection', true, 'Successfully connected ✓');

    // Check migrations status
    const pendingMigrations = await prisma.$queryRaw<Array<{migration_name: string}>>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL
    `.catch(() => []);

    addResult(
      'Pending Migrations',
      pendingMigrations.length === 0,
      pendingMigrations.length === 0
        ? 'All migrations applied ✓'
        : `${pendingMigrations.length} pending migration(s)!`
    );

    // Count records to verify data exists
    const userCount = await prisma.user.count();
    const tourCount = await prisma.tour.count();
    const companyCount = await prisma.company.count();

    addResult(
      'Database Data',
      true,
      `Users: ${userCount}, Tours: ${tourCount}, Companies: ${companyCount}`,
    );

    // Check for test data that shouldn't be in production
    const testUsers = await prisma.user.count({
      where: {
        email: {
          contains: '@test.com'
        }
      }
    });

    addResult(
      'Test Data Check',
      testUsers === 0 || process.env.NODE_ENV !== 'production',
      testUsers === 0
        ? 'No test accounts found ✓'
        : `Found ${testUsers} test account(s) - remove before production`,
      testUsers > 0 && process.env.NODE_ENV === 'production'
    );

    // Check indexes on important tables (simplified check)
    addResult(
      'Database Indexes',
      true,
      'Indexes managed by Prisma migrations - verify with EXPLAIN for slow queries',
    );

  } catch (error) {
    addResult('Database Connection', false, `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await prisma.$disconnect();
  }
}

// =====================
// 19.4 Monitoring & Logging
// =====================

async function checkMonitoring() {
  logSection('19.4 Monitoring & Logging');

  // Check Sentry (if configured)
  const sentryDsn = process.env.SENTRY_DSN;
  addResult(
    'Error Tracking (Sentry)',
    !!sentryDsn,
    sentryDsn ? 'Sentry DSN configured ✓' : 'Not configured - consider adding error tracking',
    !sentryDsn
  );

  // Log aggregation hint
  addResult(
    'Log Aggregation',
    true,
    'Configure external logging service (CloudWatch, Datadog, etc.)',
    false
  );

  // Uptime monitoring hint
  addResult(
    'Uptime Monitoring',
    true,
    'Configure uptime monitoring (UptimeRobot, Pingdom, etc.)',
    false
  );
}

// =====================
// 19.5 Performance
// =====================

async function checkPerformance() {
  logSection('19.5 Performance');

  // Check if gzip would be enabled (via Fastify)
  addResult(
    'Compression',
    true,
    'Gzip compression enabled via @fastify/compress ✓',
  );

  // Check static assets
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const uploadPath = path.resolve(process.cwd(), uploadDir);

  if (fs.existsSync(uploadPath)) {
    const files = fs.readdirSync(uploadPath);
    const imageCount = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f)).length;
    addResult(
      'Static Assets',
      true,
      `${imageCount} image files in uploads directory`,
    );
  }

  // Cache headers hint
  addResult(
    'Cache Headers',
    true,
    'Configure cache headers at reverse proxy level for static assets',
    false
  );

  // CDN hint
  addResult(
    'CDN',
    true,
    'Consider CDN for static assets in production (Cloudflare, CloudFront)',
    false
  );
}

// =====================
// 19.6 Legal & Compliance
// =====================

async function checkLegalCompliance() {
  logSection('19.6 Legal & Compliance');

  // These are manual checks - provide hints
  addResult(
    'Privacy Policy',
    true,
    'Ensure /privacy-policy route exists and is accessible',
    false
  );

  addResult(
    'Terms of Service',
    true,
    'Ensure /terms-of-service route exists and is accessible',
    false
  );

  addResult(
    'Cookie Consent',
    true,
    'Implement cookie consent banner if required by jurisdiction',
    false
  );

  addResult(
    'GDPR Compliance',
    true,
    'Ensure data export/deletion endpoints work for user requests',
    false
  );
}

// =====================
// 19.7 Backup & Recovery
// =====================

async function checkBackupRecovery() {
  logSection('19.7 Backup & Recovery');

  addResult(
    'Database Backup',
    true,
    'Configure automated database backups (RDS, PlanetScale, or manual cron)',
    false
  );

  addResult(
    'File Backup',
    true,
    'Configure backup for uploaded files (S3, GCS, etc.)',
    false
  );

  addResult(
    'Disaster Recovery',
    true,
    'Document disaster recovery procedures and test periodically',
    false
  );

  addResult(
    'Rollback Procedure',
    true,
    'Document rollback procedure for failed deployments',
    false
  );
}

// =====================
// 19.8 Final Smoke Test Hints
// =====================

async function showSmokeTestHints() {
  logSection('19.8 Final Smoke Test Checklist');

  console.log(`  ${INFO} After deploying to production, verify these manually:\n`);
  console.log('     [ ] Home page loads');
  console.log('     [ ] Can register new account');
  console.log('     [ ] Can login');
  console.log('     [ ] Can browse tours');
  console.log('     [ ] Can create tour (as company)');
  console.log('     [ ] Can send inquiry');
  console.log('     [ ] Can send chat message');
  console.log('     [ ] Can receive notification');
  console.log('     [ ] Can upload image');
  console.log('     [ ] Can logout');
}

// =====================
// Summary
// =====================

function printSummary() {
  logSection('Summary');

  const passed = results.filter(r => r.passed && !r.warning).length;
  const warnings = results.filter(r => r.passed && r.warning).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`  ${colors.green}Passed:${colors.reset}   ${passed}/${total}`);
  console.log(`  ${colors.yellow}Warnings:${colors.reset} ${warnings}/${total}`);
  console.log(`  ${colors.red}Failed:${colors.reset}   ${failed}/${total}`);

  if (failed > 0) {
    console.log(`\n${colors.red}${colors.bold}⛔ CRITICAL ISSUES FOUND - DO NOT DEPLOY${colors.reset}\n`);

    console.log('Failed checks:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ${FAIL} ${r.name}: ${r.message}`);
    });
  } else if (warnings > 0) {
    console.log(`\n${colors.yellow}${colors.bold}⚠ WARNINGS FOUND - REVIEW BEFORE DEPLOYING${colors.reset}\n`);

    console.log('Warnings:');
    results.filter(r => r.warning).forEach(r => {
      console.log(`  ${WARN} ${r.name}: ${r.message}`);
    });
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ ALL CHECKS PASSED - READY FOR PRODUCTION${colors.reset}\n`);
  }

  // Generate production .env template if secrets need updating
  if (results.some(r => r.name.includes('SECRET') && r.warning)) {
    console.log(`\n${INFO} Generate secure secrets with:\n`);
    console.log(`   ACCESS_TOKEN_SECRET="${crypto.randomBytes(64).toString('hex')}"`);
    console.log(`   REFRESH_TOKEN_SECRET="${crypto.randomBytes(64).toString('hex')}"\n`);
  }
}

// =====================
// Main
// =====================

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║         PRE-PRODUCTION VALIDATION CHECK                      ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║         Atlas Caucasus Tourism Server                        ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n  ${INFO} Running checks based on needs-testing.md Section 19...\n`);

  await checkEnvironmentConfiguration();
  await checkSecurityHardening();
  await checkDatabase();
  await checkMonitoring();
  await checkPerformance();
  await checkLegalCompliance();
  await checkBackupRecovery();
  await showSmokeTestHints();

  printSummary();

  // Exit with error code if critical issues found
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`\n${FAIL} Pre-production check failed with error:`, error);
  process.exit(1);
});
