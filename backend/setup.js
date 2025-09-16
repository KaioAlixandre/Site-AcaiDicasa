const mysql = require('mysql2/promise');
const fs = require('fs/promises');

// Defina as credenciais do seu banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'root', // substitua pelo seu usuário MySQL
    password: '0000', // substitua pela sua senha MySQL
    multipleStatements: true // Permite executar múltiplos comandos no arquivo SQL
};

// Conecta ao MySQL e cria o banco de dados e as tabelas
async function setupDatabase() {
    try {
        // Conecta ao servidor MySQL (sem especificar o banco de dados)
        const connection = await mysql.createConnection(dbConfig);
        console.log("Conexão com o MySQL bem-sucedida.");

        // Lembre-se de criar o banco de dados 'acai_db' manualmente se ele não existir
        const dbName = 'acai_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Banco de dados '${dbName}' criado ou já existente.`);

        // Conecta ao banco de dados específico
        const dbConnection = await mysql.createConnection({...dbConfig, database: dbName});
        console.log(`Conectado ao banco de dados '${dbName}'.`);

        // Lê o arquivo schema.sql
        const sqlSchema = await fs.readFile('schema.sql', 'utf-8');

        // Executa os comandos SQL do schema
        await dbConnection.query(sqlSchema);
        console.log("Esquema do banco de dados executado com sucesso.");

        await dbConnection.end();
        console.log("Conexão fechada.");

    } catch (error) {
        console.error("Erro ao configurar o banco de dados:", error);
        process.exit(1);
    }
}

setupDatabase();
