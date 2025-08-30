const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gerenciamento de usuários
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos os usuários D_E_L_E_T_s
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/', authMiddleware('admin'), (req, res) => {
  pool.query("SELECT id, nome, email, tipo_usuario FROM usuarios WHERE D_E_L_E_T_ = 0", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Retorna um usuário pelo ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 */
router.get('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  pool.query("SELECT id, nome, email, tipo_usuario FROM usuarios WHERE id = ? AND D_E_L_E_T_ = 0 LIMIT 1", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.length ? rows[0] : null);
  });
});

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cadastra um novo usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               telefone:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [admin, normal]
 *     responses:
 *       200:
 *         description: Usuário criado
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  const { nome, email, senha, telefone, tipo } = req.body;

  try {
    // 1. Criptografa a senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // 2. Insere o usuário
    pool.query(
      "INSERT INTO usuarios (nome, email, senha, telefone, tipo_usuario, D_E_L_E_T_) VALUES (?, ?, ?, ?, ?, 0)",
      [nome, email, hashedPassword, telefone, tipo],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // 3. Cria token JWT
        const token = jwt.sign(
          { id: result.insertId, role: tipo }, 
          process.env.JWT_SECRET, 
          { expiresIn: '8h' }
        );

        // 4. Retorna dados do usuário e token
        pool.query(
          "SELECT id, nome, email, telefone, tipo_usuario FROM usuarios WHERE id = ?",
          [result.insertId],
          (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ usuario: rows[0], token });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Atualiza um usuário pelo ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [admin, normal]
 *     responses:
 *       200:
 *         description: Usuário atualizado
 */
router.put('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  const { nome, email, senha, tipo } = req.body;
  pool.query(
    "UPDATE usuarios SET nome = ?, email = ?, senha = ?, tipo_usuario = ? WHERE id = ? AND D_E_L_E_T_ = 0",
    [nome, email, senha, tipo, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query("SELECT id, nome, email, tipo_usuario FROM usuarios WHERE id = ? AND D_E_L_E_T_ = 0", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
      });
    }
  );
});

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Desativa um usuário pelo ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário desativado
 */
router.delete('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  pool.query("UPDATE usuarios SET D_E_L_E_T_ = 1 WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ excluido: result.affectedRows > 0 });
  });
});

module.exports = router;
