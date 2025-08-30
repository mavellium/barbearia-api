const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/auth');
/**
 * @swagger
 * tags:
 *   name: Agendamentos
 *   description: Gerenciamento de agendamentos
 */

/**
 * @swagger
 * /agendamentos:
 *   get:
 *     summary: Lista todos os agendamentos
 *     tags: [Agendamentos]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 */
router.get('/' ,authMiddleware(), (req, res) => {
  pool.query(
    `SELECT a.id, a.cliente_id, a.barbeiro_id, a.servico_id, a.data_hora, a.status, a.criado_em
     FROM agendamentos a
     WHERE a.D_E_L_E_T_ = 0`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/**
 * @swagger
 * /agendamentos/{id}:
 *   get:
 *     summary: Retorna um agendamento pelo ID
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento encontrado
 */
router.get('/:id', authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  pool.query(
    `SELECT id, cliente_id, barbeiro_id, servico_id, data_hora, status, criado_em
     FROM agendamentos
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
 * /agendamentos:
 *   post:
 *     summary: Cadastra um novo agendamento
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               barbeiro_id:
 *                 type: integer
 *               servico_id:
 *                 type: integer
 *               data_hora:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmado, concluido, cancelado]
 *     responses:
 *       200:
 *         description: Agendamento criado
 */
router.post('/' , authMiddleware('admin'), (req, res) => {
  const { cliente_id, barbeiro_id, servico_id, data_hora, status } = req.body;
  pool.query(
    `INSERT INTO agendamentos (cliente_id, barbeiro_id, servico_id, data_hora, status)
     VALUES (?, ?, ?, ?, ?)`,
    [cliente_id, barbeiro_id, servico_id, data_hora, status || 'pendente'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query(
        `SELECT id, cliente_id, barbeiro_id, servico_id, data_hora, status, criado_em
         FROM agendamentos WHERE id = ?`,
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
 * /agendamentos/{id}:
 *   put:
 *     summary: Atualiza um agendamento pelo ID
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do agendamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               barbeiro_id:
 *                 type: integer
 *               servico_id:
 *                 type: integer
 *               data_hora:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmado, concluido, cancelado]
 *     responses:
 *       200:
 *         description: Agendamento atualizado
 */
router.put('/:id' , authMiddleware('admin'), (req, res) => {
  const id = req.params.id;
  const { cliente_id, barbeiro_id, servico_id, data_hora, status } = req.body;
  pool.query(
    `UPDATE agendamentos
     SET cliente_id = ?, barbeiro_id = ?, servico_id = ?, data_hora = ?, status = ?
     WHERE id = ? AND D_E_L_E_T_ = 0`,
    [cliente_id, barbeiro_id, servico_id, data_hora, status, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query(
        `SELECT id, cliente_id, barbeiro_id, servico_id, data_hora, status, criado_em
         FROM agendamentos WHERE id = ?`,
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
 * /agendamentos/{id}:
 *   delete:
 *     summary: Exclui um agendamento pelo ID (soft delete)
 *     tags: [Agendamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento excluído
 */
router.delete('/:id', authMiddleware('admin'),(req, res) => {
  const id = req.params.id;
  pool.query(
    "UPDATE agendamentos SET D_E_L_E_T_ = 1 WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ excluido: result.affectedRows > 0 });
    }
  );
});

module.exports = router;
