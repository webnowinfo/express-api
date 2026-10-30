// Tests never use a real database: Prisma clients are mocked, and these URLs point at a closed
// port so any query that slips past the mocks fails fast instead of writing to kcc_main/science_db.
// (dotenv does not override variables that are already set.)
process.env.DATABASE_URL = 'mysql://test:test@127.0.0.1:1/test_guard';
process.env.DATABASE_URL_SCIENCE = 'mysql://test:test@127.0.0.1:1/test_guard';
