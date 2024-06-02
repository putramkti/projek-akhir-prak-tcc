const mysql = require("mysql2");

const config = {
  host: "34.123.133.164",
  user: "root",
  password: "*hOC(mU`lutGh;^&",
  database: "tugas_akhir_tcc",
};

const connect = mysql.createConnection(config);

connect.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected");
});

module.exports = connect;