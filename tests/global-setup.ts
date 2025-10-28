async function globalSetup() {
  console.log('Setting up test environment...');

  // Set test environment variables
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  process.env.DATABASE_URL =
    'postgresql://test:test@localhost:5432/mafia_insight_test';

  console.log('Test environment setup complete!');
}

export default globalSetup;
