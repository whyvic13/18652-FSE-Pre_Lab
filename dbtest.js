var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('chatroom.db');
var check;
db.serialize(function() {

  //db.run("CREATE TABLE if not exists user_info (name TEXT,password TEXT)");
  //var stmt = db.prepare("INSERT INTO user_info VALUES (?,?)");
  //for (var i = 0; i < 10; i++) {
    //  stmt.run("Ipsum " + i, "password");
  //}
  //stmt.finalize();

  db.each("SELECT name,psw FROM user_info ORDER BY rowid", function(err, row) {
    if(row.name == "why") console.log("dui");
      console.log(row.rowid + ": " + row.name + row.psw);
  });
});

db.close();
