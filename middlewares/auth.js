const jwt = require('jsonwebtoken');

function authMiddleware(role) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido no cabeçalho Authorization' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Formato do token inválido. Use "Bearer TOKEN"' });
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (role && decoded.role !== role) {
        return res.status(403).json({ 
          error: 'Permissão negada', 
          roleEsperada: role, 
          roleUsuario: decoded.role 
        });
      }

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado', expiradoEm: err.expiredAt });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
      } else {
        return res.status(401).json({ error: 'Erro ao validar o token', detalhe: err.message });
      }
    }
  };
}

module.exports = authMiddleware;
