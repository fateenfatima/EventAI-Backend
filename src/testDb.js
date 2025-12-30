const pool = require("./db");

(async () => {
  const res = await pool.query("SELECT now()");
  console.log("DB connected →", res.rows[0].now);
  process.exit(0);
})();
