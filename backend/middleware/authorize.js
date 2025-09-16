const authorize = (role) => {
    return (req, res, next) => {
        // req.user foi definido pelo middleware 'authenticateToken'
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para realizar esta ação.' });
        }
        next();
    };
};

module.exports = authorize;
