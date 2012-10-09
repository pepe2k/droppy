//-----------------------------------------------------------------------------
// Droppy - File server in node.js
// https://github.com/silverwind/Droppy
//-----------------------------------------------------------------------------
// Configuration
var fileDir = './files/';
var port = 80;
//-----------------------------------------------------------------------------
// Here be dragons
var app = require('http').createServer(RequestHandler)
	, io = require('socket.io').listen(app)
	, mime = require('mime')
	, formidable = require('formidable')
	, fs = require('fs')
	, util = require('util')

fs.mkdir(fileDir);
app.listen(port);

function RequestHandler(req, res) {
	try {
		Log("Got request from " + req.socket.remoteAddress + ": " + req.url);
		if (req.method.toLowerCase() == 'post') {
			if (req.url == '/upload' ) {
				var form = new formidable.IncomingForm();
				form.uploadDir = fileDir;
				form.parse(req);
				form.on('fileBegin', function(name, file) {
					Log("Receiving " + file.name + " from " + req.socket.remoteAddress + ".");
					file.path = form.uploadDir + "/" + file.name;
					io.sockets.emit('newfile', file.name);
				});
				form.on('end', function(name, file) {
					RedirectToRoot(res,req);
				});
				form.on('progress', function(bytesReceived, bytesExpected) {
					percent = (bytesReceived / bytesExpected * 100) | 0;
					io.sockets.emit('progress', percent);
				});
				form.on('error', function(err) {
					errOutput = util.inspect(err);
					Log('Error: ' + errOutput)
					res.writeHead(200, {'content-type': 'text/plain'});
					res.end('error:\n\n'+ errOutput);
				})
			}
		} else {
			if (req.url.match(/css\.css$/g)) {
				res.end(fs.readFileSync('./res/css.css'));
			} else if (req.url.indexOf('deletefile') >= 0) {
				filenames = fs.readdirSync(fileDir);
				num = req.url.match(/\d+/g)
				for (i = 0; i < filenames.length; i++) {
					if (i == num) {
						Log("Deleting " + filenames[i]);
						fs.unlinkSync(fileDir + filenames[i]);
						break;
					}
				}
				RedirectToRoot(res,req);
			} else if (req.url.indexOf('files') >= 0 ) {
				var file = req.url;
				if (file != null) {
					var path = "." + unescape(file);
					var mimeType = mime.lookup(path);
					var size = fs.statSync(path).size;
					Log("Sending " + path + " to " + req.socket.remoteAddress + " (" + BytesToSI(size) + ").");
					res.writeHead(200, {
						'Content-Type' : mimeType,
						'Content-Length' : size
					});
					fs.createReadStream(path, {
					  'bufferSize': 4 * 1024
					}).pipe(res);
				}
			} else {
				HTML(res,req);
			}
		}
	 } catch(err) {
		DumpError(err);
		RedirectToRoot(res,req);
	}
}

Log("Droppy: Listening on port " + port + ".")
//-----------------------------------------------------------------------------
function RedirectToRoot(res,req) {
	try {
		res.statusCode = 301;
		res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.setHeader('Location', 'http://' + req.headers.host);
	} catch(err) {
		DumpError(err);
	}
	res.end();
}
//-----------------------------------------------------------------------------
function HTML(res,req) {

	function Write(data) {
		res.write(data + '\r\n')
	}


	res.writeHead(200, {'content-type': 'text/html'});
	Write('<!DOCTYPE html><html lang="en">');
	Write('<head>');
	Write('<title>Droppy</title><link rel="stylesheet" href="css.css">');
	Write('<meta http-equiv="content-type" content="text/html; charset=UTF-8"/>');
	Write('<link rel="icon" type="image/png" href="data:image/png;base64,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">');
	Write('<link href="http://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" type="text/css">')
	Write('<script src="/socket.io/socket.io.js" type="text/javascript"></script>');
	Write('<script type="text/javascript">');
	Write('var socket = io.connect("http://' + req.headers.host + '");');
	Write('socket.on("progress", function(percentage){');
	Write('document.getElementById("progressBar").style.width = percentage + "%";});')
	Write('socket.on("newfile", function(file){');
	Write('document.getElementById("progressBar").style.width = percentage + "%";});')
	Write('</script>');
	Write('</head>');
	Write('<body>');
	Write('<div id="container"><div id="buttons">');
	Write('<form action="/upload" enctype="multipart/form-data" method="post">');
	Write('<div class="file-upload"><span>Upload file(s)</span><input type="file" name="file" id="file" onchange="this.form.submit()" multiple="multiple" /></div>');
	Write('</form>');
	Write('<div class="file-upload"><span>Create Folder</span></div></div>')
	Write('<div id="content"><div id="progress"><div id="progressBar"></div></div>');

		filenames = fs.readdirSync(fileDir);
		for (i = 0; i < filenames.length; i++) {
			var size = BytesToSI(fs.statSync(fileDir + unescape(filenames[i])).size);
			var href = fileDir + unescape(filenames[i]) + '">' + filenames[i];
			Write('<div class="filerow">');
			Write('<span class="fileicon">&#x25B6;</span>');
			Write('<span class="filename"> <a class="expander" href="' + href + '</a></span>');
			Write('<span class="filesize">' + size + '</span>');
			Write('<span class="filedelete">' +'<a href="deletefile/' + i + '/">&#x2716;</a>' + '</span>');
			Write('<div class=right></div></div>');
		}
	Write('</div></div>');
	Write('<footer> Created on <a class="foot" href="http://nodejs.org/">node.js</a> by <a class="foot" href="https://github.com/silverwind/">silverwind</a></footer>');
	res.end('</body></html>');
}
//-----------------------------------------------------------------------------
function Log(msg) {
	console.log(GetTimestamp() + msg)
}
//-----------------------------------------------------------------------------
function GetTimestamp() {
	var currentDate = new Date()
	var day = currentDate.getDate()
	var month = currentDate.getMonth() + 1
	var year = currentDate.getFullYear()
	var hours = currentDate.getHours()
	var minutes = currentDate.getMinutes()
	return day + "/" + month + "/" + year + " "+ hours + ":" + minutes + " -> ";
}
//-----------------------------------------------------------------------------
function BytesToSI(bytes)
{
	var kib = 1024;
	var mib = kib * 1024;
	var gib = mib * 1024;
	var tib = gib * 1024;

	if ((bytes >= 0) && (bytes < kib)) {
		return bytes + ' B';
	} else if ((bytes >= kib) && (bytes < mib)) {
		return (bytes / kib).toFixed(2) + ' KiB';
	} else if ((bytes >= mib) && (bytes < gib)) {
		return (bytes / mib).toFixed(2) + ' MiB';
	} else if ((bytes >= gib) && (bytes < tib)) {
		return (bytes / gib).toFixed(2) + ' GiB';
	} else if (bytes >= tib) {
		return (bytes / tib).toFixed(2) + ' TiB';
	} else {
		return bytes + ' B';
	}
}
//-----------------------------------------------------------------------------
function DumpError(err) {
	if (typeof err === 'object') {
		if (err.message)
			Log(err.message);
		if (err.stack)
			Log(err.stack);
	}
}
