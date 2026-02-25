const { sequelize, testConnection, syncDatabase } = require('./src/models');

/**
 * Database Initialization Script
 * Run this to set up the database and create all tables
 */

async function initDatabase() {
  console.log('🔧 Starting database initialization...\n');

  try {
    // Step 1: Test connection
    console.log('📡 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful!\n');

    // Step 2: Sync database (creates tables if they don't exist)
    console.log('📦 Syncing database models...');
    console.log('⚠️  Warning: This will modify your database schema.\n');

    // Use alter: true to update existing tables without dropping data
    // Use force: true to drop and recreate all tables (WARNING: data loss!)
    const syncOptions = {
      alter: true,  // Update existing tables
      // force: true // Uncomment to drop and recreate (DELETES ALL DATA!)
    };

    await syncDatabase(syncOptions);
    console.log('✅ Database models synced successfully!\n');

    // Step 3: Verify tables created
    const tables = await sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📋 Created/Updated tables:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    console.log('\n🎉 Database initialization complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Update .env with your database credentials');
    console.log('   2. Run: npm install');
    console.log('   3. Run: npm start');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check if MySQL server is running');
    console.error('   2. Verify .env database credentials');
    console.error('   3. Ensure database exists: CREATE DATABASE academic_collaboration_db;');
    process.exit(1);
  } finally {
    // Close connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run initialization
initDatabase();
