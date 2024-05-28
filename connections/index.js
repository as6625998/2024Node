//資料庫設定
const mongoose = require('mongoose');
const DB = process.env.DATABASE.replace(
  '<password>', process.env.DATABASE_PASSWORD
)
mongoose.connect(DB)
  .then(() => {
    console.log('資料庫連線成功')
  })
  .catch((error) => {
    console.log('資料庫連線失敗',error.message);
  });

module.exports