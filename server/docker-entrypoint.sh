#!/bin/sh
set -e

# Docker entrypoint script
# Fixes volume permissions before starting the application.
# When Coolify (or other orchestrators) mount volumes, they are
# typically owned by root. This script fixes ownership so the
# non-root 'fastify' user can write to them.

if [ "$(id -u)" = '0' ]; then
  # Running as root — fix ownership of mounted volumes
  chown -R fastify:nodejs /app/uploads /app/logs 2>/dev/null || true

  # Drop to fastify user and exec the CMD
  exec su-exec fastify "$@"
fi

# Already running as non-root user — just exec CMD
exec "$@"
