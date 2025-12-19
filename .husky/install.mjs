// Skip Husky install in production and CI
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  process.exit(0)
}

try {
  const husky = (await import('husky')).default
  console.log(husky())
} catch (_error) {
  // Silently fail if husky is not available (e.g., during initial install)
  process.exit(0)
}
