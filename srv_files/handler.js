const path = require('path');
const fs = require('fs');

module.exports = {
    handler: handler
};

const redirPaths = [{
    name: "error.css",
    dir: "./css/error.css"
}];

function handler(request, response) {

    let filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './index.html';
    }

    filePath = filePath.replace(/\*spechar1/gi, "\'").replace(/\*spechar2/gi, "\"").replace(/\*spechar3/gi, "\(").replace(/\*spechar4/gi, "\)").replace(/\*spechar5/gi, "\#").replace(/\*spechar6/gi, "\!").replace(/\*spechar7/gi, "\?");
    if ( ! (/genImg/.test(filePath)) && ! (/generatedFiles/.test(filePath))) {
        if (/!/.test(filePath)) {
            filePath = filePath.split("!")[0];
        }
        if (/\?/.test(filePath)) {
            filePath = filePath.split("?")[0];
        }
    }
    
    for (let i = 0; i < redirPaths.length; i++) {
        let rgx = new RegExp(redirPaths[i].name);
        if (rgx.test(filePath)) {
            filePath = redirPaths[i].dir;
            break;
        }
    }

    let extname = String(path.extname(filePath)).toLowerCase();
    if (extname === "") {
        extname = ".html";
        filePath += "/index.html";
    }

    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mp3',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };

    if (extname === ".mp3" && /generatedFiles/.test(filePath)) {
        const stream = fs.createReadStream(decodeURI(filePath));
        stream.on("error", (error)=>{
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(404, {
                        'Content-Type': 'text/html'
                    });
                    response.end(content, 'utf-8');
                });
            } else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                response.end();
            }
        })
        response.writeHead(200, {
            'Content-Type': "audio/mp3"
        });
        stream.pipe(response);
    } else if (/genImg/.test(filePath)) {
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        const stream = fs.createReadStream(decodeURI(filePath));
        stream.on("error", (error)=>{
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(404, {
                        'Content-Type': 'text/html'
                    });
                    response.end(content, 'utf-8');
                });
            } else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                response.end();
            }
        })
        response.writeHead(200, {
            'Content-Type': contentType
        });
        stream.pipe(response);
    } else {
        

        const contentType = mimeTypes[extname] || 'application/octet-stream';
        if (/srv/.test(filePath)) {
            fs.readFile('./403.html', function(error, content) {
                response.writeHead(403, {
                    'Content-Type': 'text/html'
                });
                response.end(content, 'utf-8');
            });
        } else {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    if (error.code == 'ENOENT') {
                        fs.readFile('./404.html', function(error, content) {
                            response.writeHead(404, {
                                'Content-Type': 'text/html'
                            });
                            response.end(content, 'utf-8');
                        });
                    } else {
                        response.writeHead(500);
                        response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                        response.end();
                    }
                } else {
                    response.writeHead(200, {
                        'Content-Type': contentType
                    });
                    response.end(content, 'utf-8');
                }
            });
        }
    }
}