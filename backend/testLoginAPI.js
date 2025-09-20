const axios = require('axios');

async function testLoginAPI() {
    try {
        const response = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'kaioalexandre2681@gmail.com',
            password: 'Kt.61424'
        });

        console.log('✅ Login API bem-sucedido!');
        console.log('Token:', response.data.token.substring(0, 50) + '...');
        console.log('Usuário:', response.data.user);
        
    } catch (error) {
        console.log('❌ Erro no login API:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Dados:', error.response.data);
        } else {
            console.log('Erro:', error.message);
        }
    }
}

testLoginAPI();