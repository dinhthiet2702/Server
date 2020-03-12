const  express = require('express');
const app  = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('photofoods'));
app.use(bodyParser.json());
const jwt = require('jsonwebtoken');
const secret = 'letseat';
const { Pool } = require('pg');
const fs = require('fs');
var pool = null;
function connectPool(){
    pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'LetsEat',
        password: '0909',
        port: 5432,
    });
}
// var data = require('./Module/Person');

app.post('/login', function (req,res) {
    const {username, password} = req.body;
    const query = `select * from "User" where "username"='${username}' and "password"=MD5('${password}')`
    connectPool();
    pool.query(query, function(err, result){
        if (result.rowCount == 0){
               res.json({result: false, message:'Đăng nhập thất bại', data: [], token:''});
           }
           else{
               const token = jwt.sign(result.rows[0],secret,{expiresIn : 30000000000});
               res.json({result: true, message:'Đăng nhập thành công', data: result.rows, token:token});
           }
   });
   
   pool.end();
});
app.post('/more', function(req,res){
    const {id,gender} = req.body;
    const query = `update "User" set "gender" = '${gender}' where "id"='${id}'`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result:true});
    });
    pool.end();
});
app.post('/checkUser', function(req,res){
    const {id} = req.body;
    const query = `select * from "User" where "id"='${id}'`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result:true, message:'OK',data:result.rows});
    });
    pool.end();
});
app.post('/check', function(req, res){
    const token = req.body.token;
    jwt.verify(token,secret, function(err,decoded){
        if (err){
            res.json({result:false, message: 'Đăng nhập quá hạn', data:[]});
        }
        else{
            req.decoded = decoded;
            res.json({result:true, message: 'Đăng nhập thành công', data:decoded});
        }
    });
});
app.post('/register', function(req,res){
    connectPool();
    const {firtname, lastname, birtday, email, phonenumber, username, password, isCheck} = req.body;
    pool.query(`select * from "User" where "username" = '${username}'`,
    function(err, result){
        if (result.rowCount == 1) {
            res.json({result : false, message : 'Tài khoản tồn tại'});
        } else if(isCheck == 'false'){
            let query = `insert into "User" ("firtname","lastname","birtday","email","phonenumber","username", "password")
            values ('${firtname}','${lastname}','${birtday}','${email}','${phonenumber}','${username}', MD5('${password}'))`
            connectPool();
            pool.query(query, function(err, result){
                res.json({result : true, message : 'Đăng kí thành công'});
            });
            pool.end();
        } else {
            res.json({result : true, message : 'Tài khoản có thể sử dụng'});
        }
    });
    pool.end();
});
app.get('/delivery', function(req,res){
    const query = `select * from "menufood"`;
    connectPool();
    pool.query(query, function(err, result){
            if (result.rowCount == 0) {
                res.json({result : false, message : 'Chua co mon an', data:[]});
            } else {
                res.json({result : true, message : 'OK',data: result.rows});
            }
    });
    pool.end();
});
app.post('/delivery/menufood', function(req,res){
    const {menufood_id} = req.body
    const query = `select * from "foods" where "menufood_id"='${menufood_id}'`;
    connectPool();
    pool.query(query, function(err, result){
            if (result.rowCount == 0) {
                res.json({result : false, message : 'Chua co mon an', data:[]});
            } else {
                res.json({result : true, message : 'OK',data: result.rows});
            }
    });
    pool.end();
});
app.post('/delivery/menufood/orderfoods', function(req,res){
    const {namefood, imgfood, price, amount, user_id} = req.body;
    const query = `insert into "orderfoods" ("namefood","imgfood","price","amount","user_id")
        values ('${namefood}','${imgfood}','${price}','${amount}','${user_id}')`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Them thanh cong'});
    });
    pool.end();
});
app.post('/deletefoodsorder', function(req,res){
    const {user_id} = req.body;
    const query = `delete from "orderfoods" where "user_id"='${user_id}'`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Đặt hàng thành công'});
    });
    pool.end();
});
app.post('/order/foods', function(req,res){
    const {user_id} = req.body;
    const query = `select * from "orderfoods" where "user_id"='${user_id}'`;
    connectPool();
    pool.query(query, function(err, result){
            if (result.rowCount == 0) {
                res.json({result : false, message : 'Chua co mon an', data:result.rows});
            } else {
                res.json({result : true, message : 'OK',data: result.rows});
            }
    });
    pool.end();
});
app.post('/order/foods/changeamount', function(req,res){
    const {id,amount} = req.body;
    const query = `update "orderfoods" set "amount" = '${amount}' where "id"='${id}'`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result:true});
    });
    pool.end();
});
app.post('/order/foods/delete', function(req,res){
    const {id} = req.body;
    const query = `delete from "orderfoods" where "id"='${id}'`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result:true});
    });
    pool.end();
});
// multer upload photo
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'photofoods/');
    },
    filename: function(req, file, cb){
        cb(null, file.originalname);
    }
});function fileFilter(req, file, cb){
    if (!file.mimetype.includes("image/png") && !file.mimetype.includes("image/jpeg")) {
      return cb(null, false);
    }
    cb(null, true);
  };
  var upload = multer({ storage: storage, fileFilter:fileFilter });
  app.post('/insertfood', function(req,res,next){
    const {namefood,imgfood,price,amount,menufood_id,namekindfood} = req.body;
    const query = `insert into "foods" ("namefood","imgfood","price","amount","menufood_id","namekindfood")
        values ('${namefood}','${imgfood}','${price}','0','${menufood_id}','${namekindfood}')`
    connectPool();
    pool.query(query, function(err, result){
        let query = `select * from "menufood" where "img"='${imgfood}'`
        connectPool();
        pool.query(query, function(err, result){
            res.json({result : true, message : 'Thêm món ăn thành công', data:result.rows});
        });
        pool.end();
    });
    pool.end();
});
app.post('/photo', upload.single('photo'), function (req, res, next) {
    const photo = req.file;
    if (!req.file || req.file == null){
        res.json({result: false, message: 'Không phải là 1 hình ảnh hoặc chưa có hình ảnh', data: photo});
    }
    else{
        res.json({result: true, message: 'Tai len thanh cong', data: photo});
    }
});
app.post('/insertmenufood', function(req,res,next){
    const {name,img,user_id} = req.body;
    const query = `insert into "menufood" ("name","img","user_id")
        values ('${name}','${img}','${user_id}')`
    connectPool();
    pool.query(query, function(err, result){
        let query = `select * from "menufood" where "img"='${img}'`
        connectPool();
        pool.query(query, function(err, result){
            res.json({result : true, message : 'Thêm menu thành công', data:result.rows});
        });
        pool.end();
    });
    pool.end();
});
app.post('/addhistoryorderfoods', function(req,res){
    const {namefood, imgfood, price, amount, user_id, dateorder} = req.body;
    const query = `insert into "historyorderfoods" ("namefood","imgfood","price","amount","user_id","dateorder")
        values ('${namefood}','${imgfood}','${price}','${amount}','${user_id}','${dateorder}')`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Them thanh cong'});
    });
    pool.end();
});
app.post('/gethistory', function(req,res){
    const {user_id} = req.body;
    const query = `select * from "historyorderfoods" where "user_id"='${user_id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Tai thanh cong', data:result.rows});
    });
    pool.end();
});
app.post('/gethistory/datefoods', function(req,res){
    const {dateorder} = req.body;
    const query = `select * from "historyorderfoods" where "dateorder"='${dateorder}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Tai thanh cong', data:result.rows});
    });
    pool.end();
});
app.post('/getmenu/didupload', function(req,res){
    const {user_id} = req.body;
    const query = `select * from "menufood" where "user_id"='${user_id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Tai thanh cong', data:result.rows});
    });
    pool.end();
});
app.post('/getmenu/didupload/remove', function(req,res){
    const {id} = req.body;
    const query = `delete from "menufood" where "id"='${id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Xoá thành công'});
    });
    pool.end();
});
app.post('/getmenu/didupload/remove/removefoods', function(req,res){
    const {id} = req.body;
    const query = `delete from "foods" where "menufood_id"='${id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Xoá thành công'});
    });
    pool.end();
});

app.post('/getmenu/didupload/edit', function(req,res){
    const {id,name,img} = req.body;
    const query = `update "menufood" set "name"='${name}',"img"='${img}' where "id"='${id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Lưu thành công'});
    });
    pool.end();
});
app.post('/getmenu/didupload/foods/delete', function(req,res){
    const {id} = req.body;
    const query = `delete from "foods" where "id"='${id}'`
    connectPool();
    pool.query(query, function(err, result){
        res.json({result:true, message:'Xoá thành công'});
    });
    pool.end();
});
app.post('/getmenu/didupload/foods/edit', function(req,res){
    const {id,namefood,imgfood,price,namekindfood} = req.body;
    const query = `update "foods" set "namefood"='${namefood}',"imgfood"='${imgfood}',"price"='${price}',"namekindfood"='${namekindfood}' where "id"='${id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Lưu thành công'});
    });
    pool.end();
});
app.post('/editInfoUser', function(req,res){
    const {id,firtname,lastname,birtday,email,phonenumber,gender} = req.body;
    const query = `update "User" set "firtname"='${firtname}',"lastname"='${lastname}',"birtday"='${birtday}',"email"='${email}',"phonenumber"='${phonenumber}',"gender"='${gender}' where "id"='${id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Lưu thành công'});
    });
    pool.end();
});
app.post('/checkPassword', function(req,res){
    const {id,password} = req.body;
    var isCheck = null;
    const query = `select * from "User" where "id"='${id}' and "password"=MD5('${password}')`;
    connectPool();
    pool.query(query, function(err, result){
        if (result.rowCount != 0){
            res.json({result : true, message : 'thành công'});
        }
        else{
            res.json({result : false, message : 'Mật khẩu hiện tại không đúng'});
        }
        
    });
    pool.end();
});
app.post('/changepassword', function(req,res){
    const {id,password} = req.body;
    const query = `update "User" set "password"=MD5('${password}') where "id"='${id}'`;
    connectPool();
    pool.query(query, function(err, result){
        res.json({result : true, message : 'Đổi mật khẩu thành công'});
    });
    pool.end();
});

app.post('/removephoto', function(req, res){
    const {imgname,accpectEditImage}= req.body;
    const path = `./photofoods/${imgname}`
    if (accpectEditImage == 'true'){
        fs.unlink(path, (err) => {
            if (err) {
                res.json({result:true, message:'xoa thanh cong'});
                return
            }
            res.json({result:true, message:'xoa thanh cong'});
        });
    }
    else{
        res.json({result:false, message:'xoa thanh that bai'});
    }
});

app.listen(3000);
