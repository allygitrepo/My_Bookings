const { sequelize } = require('../config/db');

async function cleanupIndexes() {
    try {
        console.log("Starting index cleanup for 'users' table...");
        
        // 1. Get all indexes
        const [results] = await sequelize.query("SHOW INDEX FROM users;");
        
        // 2. Identify redundant unique indexes for email and google_id
        // Sequelize often creates names like 'email', 'email_2', 'users_email_unique', etc.
        const emailIndexes = results.filter(idx => idx.Column_name === 'email' && idx.Key_name !== 'PRIMARY');
        const googleIdIndexes = results.filter(idx => idx.Column_name === 'google_id' && idx.Key_name !== 'PRIMARY');

        console.log(`Found ${emailIndexes.length} indexes for 'email'`);
        console.log(`Found ${googleIdIndexes.length} indexes for 'google_id'`);

        // 3. Drop all except the first one for each
        for (let i = 1; i < emailIndexes.length; i++) {
            const indexName = emailIndexes[i].Key_name;
            console.log(`Dropping redundant index: ${indexName}`);
            await sequelize.query(`ALTER TABLE users DROP INDEX ${indexName};`);
        }

        for (let i = 1; i < googleIdIndexes.length; i++) {
            const indexName = googleIdIndexes[i].Key_name;
            console.log(`Dropping redundant index: ${indexName}`);
            await sequelize.query(`ALTER TABLE users DROP INDEX ${indexName};`);
        }

        console.log("✅ Cleanup completed.");
    } catch (err) {
        console.error("❌ Cleanup failed:", err.message);
        console.log("Tip: If the error says 'Too many keys', try dropping them manually in your DB tool.");
    } finally {
        process.exit();
    }
}

cleanupIndexes();
