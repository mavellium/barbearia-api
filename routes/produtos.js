const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Gerenciamento de produtos
 */

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Lista todos os produtos ativos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/', (req, res) => {
  pool.query("SELECT * FROM produtos WHERE D_E_L_E_T_ = 0", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /produtos/{id}:
 *   get:
 *     summary: Retorna um produto pelo ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto encontrado
 */
router.get('/:id', (req, res) => {
  const id = req.params.id;
  pool.query("SELECT * FROM produtos WHERE id = ? AND D_E_L_E_T_ = 0 LIMIT 1", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.length ? rows[0] : null);
  });
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Cadastra um novo produto
 *     tags: [Produtos]
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
 *                 format: float
 *               estoque:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Produto criado
 */
router.post('/', authMiddleware('admin') , (req, res) => {
  const { nome, descricao, preco, estoque } = req.body;
  pool.query(
    "INSERT INTO produtos (nome, descricao, preco, estoque, D_E_L_E_T_) VALUES (?, ?, ?, ?, 0)",
    [nome, descricao, preco, estoque],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query("SELECT * FROM produtos WHERE id = ? AND D_E_L_E_T_ = 0", [result.insertId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
      });
    }
  );
});

/**
 * @swagger
 * /produtos/{id}:
 *   put:
 *     summary: Atualiza um produto pelo ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do produto
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
 *                 format: float
 *               estoque:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Produto atualizado
 */
router.put('/:id' , authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  const { nome, descricao, preco, estoque } = req.body;
  pool.query(
    "UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ? WHERE id = ? AND D_E_L_E_T_ = 0",
    [nome, descricao, preco, estoque, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query("SELECT * FROM produtos WHERE id = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
      });
    }
  );
});

/**
 * @swagger
 * /produtos/{id}:
 *   delete:
 *     summary: Desativa um produto pelo ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto desativado
 */
router.delete('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  pool.query("UPDATE produtos SET D_E_L_E_T_ = 1 WHERE id = ? AND D_E_L_E_T_ = 0", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ excluido: result.affectedRows > 0 });
  });
});

module.exports = router;
