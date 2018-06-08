var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 **********/ 
if(path === '/'){
  let string = fs.readFileSync('./class.html','utf-8')
  /*let users = fs.readFileSync('./db/users','utf-8')
  try{
    users = JSON.parse(users)  //[]
  }catch(exception){
    users = []
  }
  console.log('request.headers.cookie')
  console.log(request.headers.cookie)*/
  let cookies = request.headers.cookie.split(',')  //['xsj@qq.com','boe.qq.com','562441461@qq.com']
  console.log('cookies')
  console.log(cookies)
  let hash = {}
  for(let i = 0;i < cookies.length;i ++){
    let parts = cookies[i].split('=')
    let key = parts[0]
    let value = parts[1]
    hash[key] = value
  }
  //console.log('hash')
  //console.log(hash)
  let email = hash.sign_in_email
  let users = fs.readFileSync('./db/users','utf-8')
  users = JSON.parse(users)
  
  let foundUser
  for(let i=0;i<users.length;i++){
    if(users[i].email === email){
      foundUser = users[i]
      break
    }
  }
  if(foundUser){
    string=string.replace('__password__',foundUser.password)
  }else{
    string=string.replace('__password__','未知')
  }
  response.statusCode = 200
  response.setHeader('Content-Type','text/html;charset=utf-8')
  response.write(string)
  response.end()
}else if(path === '/sign_up' && method === 'GET'){
  let string = fs.readFileSync('./sign_up.html','utf-8')
  response.statusCode = 200
  response.setHeader('Content-Type','text/html;charset=utf-8')
  response.write(string)
  response.end()
  //我新增了一个"登录注册页面"的路由

}else if(path === '/sign_up' && method === 'POST'){
  readBody(request).then((body)=>{
    let strings = body.split('&')  //['email=1','password=2','password_comfirm=3']
    let hash = {}
    strings.forEach((string)=>{
      //string == 'email=1'
      let parts = string.split('=')    //['email','1']
      let key = parts[0]
      let value = parts[1]
      /*hash[key] = value  //hash['email']='1'  email里的@符号变成了%40故失效*/
      hash[key] = decodeURIComponent(value)
    })
    /*let email = hash['email']
    let password = hash['password']
    let password_comfirm = hash['password_comfirm']*/
    let {email,password,password_comfirm} = hash
    if(email.indexOf('@') === -1){
      response.statusCode = 400
      response.setHeader('Content-Type','application/json;charset=utf-8')
      response.write(`
      {
        "errors":{
          "email":"invalid"
        },
        "hint":{
          "account":""
        }
      }`)
    }else if(hash['password_confirm']!==hash['password']){

      response.statusCode = 400
      response.write("password not match")
    }else {
      var users = fs.readFileSync('./db/users','utf-8')
      users = JSON.parse(users)   //[]
      
      let inUse = false
      for(let i = 0;i < users.length;i ++){
        let user = users[i]
        if(user.email === email){
          inUse = true
          break
        }
      }
      if(inUse){
        response.statusCode = 400
        response.write(`
        { 
          "errors":{
            "email":""
          },
          "hint":{
            "account":"exist"
          }
        }`)
      }else{
        users.push({email: email, password: password})
        //console.log(users)
        var usersString = JSON.stringify(users)
        //console.log(usersString)
        fs.writeFileSync('./db/users',usersString)
        response.statusCode = 200
      }
    }
    response.end()
  })
}else if(path === '/sign_in' && method === 'GET'){           //新增登录请求页面的路由
  let string = fs.readFileSync('./sign_in.html','utf-8')
  response.stateCode = 200
  response.setHeader('Content-Type','text/html;charset=utf-8')
  response.write(string)
  response.end()
}else if(path==='/sign_in' && method==='POST'){      //登录页面提交表单
  readBody(request).then((body)=>{
    let strings = body.split('&')  //['email=1','password=2','password_comfirm=3']
    let hash = {}
    strings.forEach((string)=>{
      //string == 'email=1'
      let parts = string.split('=')    //['email','1']
      let key = parts[0]
      let value = parts[1]
      /*hash[key] = value  //hash['email']='1'  email里的@符号变成了%40故失效*/
      hash[key] = decodeURIComponent(value)
    })
    let {email,password} = hash
    /*console.log('email')
    console.log(email)
    console.log('password')
    console.log(password)*/

    var users = fs.readFileSync('./db/users','utf-8')
    try{
      users = JSON.parse(users)    //[]
    }catch(exception){
      users = []
    }
    
    let found
    for(let i = 0;i < users.length;i ++){
      if(users[i].email === email && users[i].password === password){
        found = true
        break
      }
    }
    if(found){
      response.setHeader('Set-Cookie',`sign_in_email=${email}`)
      response.statusCode = 200
    }else{
      response.statusCode = 401   //Unauthorized
    }

    response.end()
  })
}else{
  response.stateCode = 404
  response.setHeader('Content-Type','text/html;charset=utf-8')
  response.write('找不到对应的路径,需要修改index.js')
  response.end()
}



  /******** 代码结束，下面不要看 ************/
})

function readBody(request){
  return new Promise((resolve,reject)=>{
    let body = []      //请求体
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      // at this point, `body` has the entire request body stored in it as a string
      //console.log(body)
      resolve(body)
    })
  })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)


