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
  var string = fs.readFileSync('./index.html','utf8')
  response.statusCode = 200
  var amount = fs.readFileSync('./db','utf8')   //金额100
  string = string.replace('&&&amount&&&',amount)
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
    
    let body = []      //请求体
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      // at this point, `body` has the entire request body stored in it as a string
      console.log(body)
      response.statusCode = 200
      response.end()
    })
}else if(path === '/style.css'){
  var string = fs.readFileSync('./style.css','utf8')
  response.statusCode = 200
  response.setHeader('Content-Type','text/css')
  response.write(string)
  response.end()
}else if(path === '/main.js'){
  var string = fs.readFileSync('./main.js','utf8')
  response.statusCode = 200
  response.setHeader('Content-Type','application/javascript')
  response.write(string)
  response.end()
}else if(path==='/pay'){
  var amount = fs.readFileSync('./db','utf8')  //100
  var newAmount = amount - 1
  fs.writeFileSync('./db',newAmount)
  response.setHeader('Content-Type','application/javascript')
  response.statusCode = 200
  response.write(`${query.callback}(undefined,'success')`)
  response.end()

}else{
  response.stateCode = 404
  response.setHeader('Content-Type','text/html;charset=utf-8')
  response.write('找不到对应的路径,需要修改index.js')
  response.end()
}



  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)


