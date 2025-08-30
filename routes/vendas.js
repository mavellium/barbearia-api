const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Vendas
 *   description: Gerenciamento de vendas e itens de venda
 */

/**
 * @swagger
 * /vendas:
 *   get:
 *     summary: Lista todas as vendas
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vendas
 */
router.get('/', authMiddleware('admin'),(req, res) => {
  pool.query(
    `SELECT id, cliente_id, data_venda, total
     FROM vendas
     WHERE D_E_L_E_T_ = 0`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/**
 * @swagger
 * /vendas/{id}:
 *   get:
 *     summary: Retorna uma venda pelo ID
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Venda encontrada
 */
router.get('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  pool.query(
    `SELECT id, cliente_id, data_venda, total
     FROM vendas
     WHERE id = ? AND D_E_L_E_T_ = 0`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.length ? rows[0] : {});
    }
  );
});

/**
 * @swagger
 * /vendas:
 *   post:
 *     summary: Cadastra uma nova venda
 *     tags: [Vendas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               total:
 *                 type: number
 *                 format: decimal
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produto_id:
 *                       type: integer
 *                     quantidade:
 *                       type: integer
 *                     preco_unitario:
 *                       type: number
 *                       format: decimal
 *     responses:
 *       200:
 *         description: Venda criada
 */
router.post('/' , authMiddleware('admin') , (req, res) => {
  const { cliente_id, total, itens } = req.body;

  pool.query(
    `INSERT INTO vendas (cliente_id, total) VALUES (?, ?)`,
    [cliente_id, total],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const vendaId = result.insertId;

      if (itens && itens.length) {
        const valores = itens.map(i => [vendaId, i.produto_id, i.quantidade, i.preco_unitario]);
        pool.query(
          `INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES ?`,
          [valores],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ venda_id: vendaId });
          }
        );
      } else {
        res.json({ venda_id: vendaId });
      }
    }
  );
});

/**
 * @swagger
 * /vendas/{id}:
 *   delete:
 *     summary: Exclui uma venda (soft delete)
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Venda excluída
 */
router.delete('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;

  // Marca a venda como deletada
  pool.query(`UPDATE vendas SET D_E_L_E_T_ = 1 WHERE id = ?`, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Marca os itens da venda como deletados
    pool.query(`UPDATE itens_venda SET D_E_L_E_T_ = 1 WHERE venda_id = ?`, [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ excluido: result.affectedRows > 0 });
    });
  });
});


/**
 * @swagger
 * /vendas/{id}/itens:
 *   get:
 *     summary: Lista os itens de uma venda
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Lista de itens
 */
router.get('/:id/itens', authMiddleware('admin'), (req, res) => {
  const vendaId = req.params.id;
  pool.query(
    `SELECT produto_id, quantidade, preco_unitario
     FROM itens_venda
     WHERE venda_id = ? AND D_E_L_E_T_ = 0`,
    [vendaId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
