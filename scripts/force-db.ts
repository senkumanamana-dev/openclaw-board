import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('Connected successfully.');

    // Drop all tables to start clean
    console.log('Cleaning database...');
    await client.query(`
      DROP TABLE IF EXISTS "StatusHistory" CASCADE;
      DROP TABLE IF EXISTS "Activity" CASCADE;
      DROP TABLE IF EXISTS "Attachment" CASCADE;
      DROP TABLE IF EXISTS "Subtask" CASCADE;
      DROP TABLE IF EXISTS "Comment" CASCADE;
      DROP TABLE IF EXISTS "Task" CASCADE;
      DROP TABLE IF EXISTS "_TaskDependencies" CASCADE;
      DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;
      DROP TYPE IF EXISTS "TaskStatus" CASCADE;
      DROP TYPE IF EXISTS "Priority" CASCADE;
      DROP TYPE IF EXISTS "TaskOrigin" CASCADE;
    `);
    
    console.log('Database cleaned. Prisma migrate will now recreate everything correctly.');
  } catch (err) {
    console.error('Error cleaning database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
