const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login de usuário
 *     tags: [Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retorna token JWT
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/', (req, res) => {
  const { email, senha } = req.body;

  pool.query(
    "SELECT id, nome, email, senha, tipo_usuario FROM usuarios WHERE email = ? AND D_E_L_E_T_ = 0 LIMIT 1",
    [email],
    async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

      const user = rows[0];

      // Verifica a senha
      const senhaValida = await bcrypt.compare(senha, user.senha);
      if (!senhaValida) return res.status(401).json({ error: 'Senha inválida' });

      // Gera token JWT
      const token = jwt.sign(
        { id: user.id, role: user.tipo_usuario },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        usuario: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo_usuario
        }
      });
    }
  );
});

module.exports = router;
