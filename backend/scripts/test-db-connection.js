// Carregar variáveis de ambiente
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados...\n');
  
  // Mostrar a DATABASE_URL (ocultando a senha por segurança)
  const dbUrl = process.env.DATABASE_URL || 'NÃO CONFIGURADA';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('📋 DATABASE_URL configurada:');
  console.log(`   ${maskedUrl}\n`);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada no arquivo .env');
    console.error('   Adicione a linha: DATABASE_URL="mysql://usuario:senha@host:porta/nome_banco"');
    process.exit(1);
  }
  
  // Extrair informações da URL
  try {
    const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));
    const host = url.hostname;
    const port = url.port || 3306;
    const user = url.username;
    const password = url.password ? '***' : '(não especificada)';
    const database = url.pathname.replace('/', '');
    
    console.log('📊 Detalhes da conexão:');
    console.log(`   Host: ${host}`);
    console.log(`   Porta: ${port}`);
    console.log(`   Usuário: ${user}`);
    console.log(`   Senha: ${password}`);
    console.log(`   Banco: ${database}\n`);
  } catch (e) {
    console.log('⚠️  Não foi possível parsear a DATABASE_URL');
  }
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    console.log('🔌 Tentando conectar...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Testar uma query simples
    console.log('🧪 Testando query...');
    const result = await prisma.$queryRaw`SELECT DATABASE() as current_db, USER() as current_user`;
    console.log(`   Banco atual: ${result[0].current_db}`);
    console.log(`   Usuário atual: ${result[0].current_user}\n`);
    
    console.log('✅ Teste de conexão concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao conectar:\n');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('Authentication failed') || 
        error.message.includes('not valid') ||
        error.message.includes('Access denied')) {
      console.error('💡 SOLUÇÃO: Credenciais incorretas\n');
      console.error('   Opções para corrigir:');
      console.error('   1. Teste a conexão manualmente:');
      console.error('      mysql -u root -p');
      console.error('      (ou com o usuário e senha corretos)\n');
      console.error('   2. Atualize o arquivo .env com as credenciais corretas:');
      console.error('      nano .env');
      console.error('      (ou vi .env)\n');
      console.error('   3. Formato da DATABASE_URL:');
      console.error('      DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_banco"\n');
    } else if (error.message.includes('Can\'t reach') || 
               error.message.includes('P1001') ||
               error.message.includes('ECONNREFUSED')) {
      console.error('💡 SOLUÇÃO: Servidor MySQL não está acessível\n');
      console.error('   Verifique se:');
      console.error('   1. O MySQL está rodando: systemctl status mysql');
      console.error('   2. O host/porta estão corretos no .env');
      console.error('   3. O firewall permite conexões na porta do MySQL\n');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

