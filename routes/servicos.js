const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/auth');
/**
 * @swagger
 * tags:
 *   name: Servicos
 *   description: Gerenciamento de serviços
 */

/**
 * @swagger
 * /servicos:
 *   get:
 *     summary: Lista todos os serviços
 *     tags: [Servicos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de serviços
 */
router.get('/', (req, res) => {
  pool.query(
    "SELECT id, nome, descricao, preco, duracao_minutos FROM servicos WHERE D_E_L_E_T_ = 0",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/**
 * @swagger
 * /servicos/{id}:
 *   get:
 *     summary: Retorna um serviço pelo ID
 *     tags: [Servicos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Serviço encontrado
 */
router.get('/:id', (req, res) => {
  const id = req.params.id;
  pool.query(
    "SELECT id, nome, descricao, preco, duracao_minutos FROM servicos WHERE id = ? AND D_E_L_E_T_ = 0 LIMIT 1",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.length ? rows[0] : {});
    }
  );
});

/**
 * @swagger
 * /servicos:
 *   post:
 *     summary: Cadastra um novo serviço
 *     tags: [Servicos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *               duracao_minutos:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Serviço criado
 */
router.post('/' , authMiddleware('admin'), (req, res) => {
  const { nome, descricao, preco, duracao_minutos } = req.body;
  pool.query(
    "INSERT INTO servicos (nome, descricao, preco, duracao_minutos) VALUES (?, ?, ?, ?)",
    [nome, descricao, preco, duracao_minutos],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query(
        "SELECT id, nome, descricao, preco, duracao_minutos FROM servicos WHERE id = ?",
        [result.insertId],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(rows[0]);
        }
      );
    }
  );
});

/**
 * @swagger
 * /servicos/{id}:
 *   put:
 *     summary: Atualiza um serviço pelo ID
 *     tags: [Servicos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *               duracao_minutos:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Serviço atualizado
 */
router.put('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  const { nome, descricao, preco, duracao_minutos } = req.body;
  pool.query(
    "UPDATE servicos SET nome = ?, descricao = ?, preco = ?, duracao_minutos = ? WHERE id = ? AND D_E_L_E_T_ = 0",
    [nome, descricao, preco, duracao_minutos, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query(
        "SELECT id, nome, descricao, preco, duracao_minutos FROM servicos WHERE id = ?",
        [id],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(rows[0]);
        }
      );
    }
  );
});

/**
 * @swagger
 * /servicos/{id}:
 *   delete:
 *     summary: Exclui um serviço pelo ID (soft delete)
 *     tags: [Servicos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Serviço excluído
 */
router.delete('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  pool.query("UPDATE servicos SET D_E_L_E_T_ = 1 WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ excluido: result.affectedRows > 0 });
  });
});

module.exports = router;
