const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,       // máximo de conexões
  host: 'localhost',         // seu host
  user: 'root',              // seu usuário
  password: '',    // sua senha
  database: 'barbearia'           // nome do banco
});

module.exports = pool;
