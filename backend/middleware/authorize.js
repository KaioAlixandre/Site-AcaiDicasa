const authorize = (role) => {
    return (req, res, next) => {
        console.log(`🛡️ [Authorize] Verificando autorização para role: ${role}`);
        console.log(`🛡️ [Authorize] Usuário atual:`, {
            id: req.user?.id,
            username: req.user?.username,
            role: req.user?.role
        });
        
        // req.user foi definido pelo middleware 'authenticateToken'
        if (!req.user || req.user.role !== role) {
            console.log(`❌ [Authorize] Acesso negado. Role necessário: ${role}, Role atual: ${req.user?.role || 'undefined'}`);
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para realizar esta ação.' });
        }
        
        console.log(`✅ [Authorize] Autorização concedida`);
        next();
    };
};

module.exports = authorize;
