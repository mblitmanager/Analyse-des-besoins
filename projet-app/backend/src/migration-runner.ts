import AppDataSource from './data-source';

async function run() {
  try {
    await AppDataSource.initialize();

    const cmd = process.argv[2];

    if (cmd === 'revert') {
      console.log('Reverting last migration...');
      await AppDataSource.undoLastMigration();
      console.log('Revert finished.');
    } else if (cmd === 'status') {
      const migrations = AppDataSource.migrations || [];
      console.log(`Configured migrations count: ${migrations.length}`);
      // We can also list executed migrations from the database
      const executed = await AppDataSource.showMigrations();
      console.log('showMigrations returned:', executed);
    } else {
      console.log('Running pending migrations...');
      const res = await AppDataSource.runMigrations();
      console.log('Migrations result:', res);
      console.log('Migrations finished.');
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration runner error:', err);
    try {
      await AppDataSource.destroy();
    } catch (_) {}
    process.exit(1);
  }
}

run();
