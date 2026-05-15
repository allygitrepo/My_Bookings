const { sequelize } = require('../config/db');

async function checkIndexes() {
    try {
        const [results] = await sequelize.query("SHOW INDEX FROM users;");
        console.log("Current indexes on 'users' table:");
        results.forEach(idx => {
            console.log(`- ${idx.Key_name} (Column: ${idx.Column_name})`);
        });
        
        if (results.length > 50) {
            console.log("\n⚠️ WARNING: Too many indexes detected. Suggest dropping redundant 'email' or 'google_id' indexes.");
        }
    } catch (err) {
        console.error("Error fetching indexes:", err.message);
    } finally {
        process.exit();
    }
}

checkIndexes();
