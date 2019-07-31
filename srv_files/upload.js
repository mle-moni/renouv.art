const fs = require('fs');

module.exports = {
    sliceUpload: sliceUpload,
    sliceUploadMini: sliceUploadMini,
    sliceUploadMain: sliceUploadMain,
    destroy: destroy
};

let files = {};

function sliceUpload(data, socket, dbo) {
    if (socket.hasOwnProperty("fileName") && data.hasOwnProperty("slice") && data.hasOwnProperty("cursor") &&
        data.hasOwnProperty("total")) {
        if (!files.hasOwnProperty(socket.fileName)) {
            files[socket.fileName] = [];
            files[socket.fileName].push(data.slice);
            socket.emit("request slice upload", data.cursor);
        } else {
            files[socket.fileName].push(data.slice);
            if (data.cursor < data.total) {
                socket.emit("request slice upload", data.cursor);
            } else {
                const b64fileURI = files[socket.fileName].join("");
                if (/audio\/mp3/.test(b64fileURI) && b64fileURI.length < 40000000) {
                    const b64file = b64fileURI.split(';base64,').pop();
                    if (b64fileURI.length === data.total) {
                        fs.writeFile("generatedFiles/"+socket.fileName+".mp3", b64file, {encoding: 'base64'}, function(err) {
                            socket.objToStore.contenu = "";
                            dbo.collection("tags").insertOne(socket.tagObj, function(err, res) {
                                if (err) throw err;
                                dbo.collection("data").insertOne(socket.objToStore, function(err, res) {
                                    if (err) throw err;
                                    socket.emit("fileSucces", true);
                                    delete(files[socket.fileName]);
                                    delete(socket.tagObj);
                                    delete(socket.objToStore);
                                    delete(socket.fileName);
                                });
                            });
                        });
                    } else {
                        socket.emit("fileError", "Echec de l'envoi");
                        delete(files[socket.fileName]);
                        delete(socket.tagObj);
                        delete(socket.objToStore);
                        delete(socket.fileName);
                    }
                } else {
                    socket.emit("fileError", "Echec de l'envoi : mauvais type de fichier");
                    delete(files[socket.fileName]);
                    delete(socket.tagObj);
                    delete(socket.objToStore);
                    delete(socket.fileName);
                }
            }
        }
    }
}

function sliceUploadMini(data, socket, dbo) {
    if (socket.hasOwnProperty("fileName") && data.hasOwnProperty("slice") && data.hasOwnProperty("cursor") &&
        data.hasOwnProperty("total")) {
        if (!files.hasOwnProperty(socket.fileName)) {
            files[socket.fileName] = [];
            files[socket.fileName].push(data.slice);
            socket.emit("request slice upload mini", data.cursor);
        } else {
            files[socket.fileName].push(data.slice);
            if (data.cursor < data.total) {
                socket.emit("request slice upload mini", data.cursor);
            } else {
                const b64fileURI = files[socket.fileName].join("");
                let imgType = "";
                if (/image\/png/.test(b64fileURI)) {
                    imgType = ".png";
                } else if (/image\/jp/.test(b64fileURI)) {
                    imgType = ".jpg";
                }
                if (imgType !== "" && b64fileURI.length < 40000000) {
                    const b64file = b64fileURI.split(';base64,').pop();
                    if (b64fileURI.length === data.total) {
                        fs.writeFile("genImg/mini"+socket.fileName+imgType, b64file, {encoding: 'base64'}, function(err) {
                            if (err) throw err;
                            delete(files[socket.fileName]);
                            socket.emit("start main");
                        });
                    } else {
                        socket.emit("fileError", "Echec de l'envoi");
                        delete(files[socket.fileName]);
                        delete(socket.tagObj);
                        delete(socket.objToStore);
                        delete(socket.fileName);
                    }
                } else {
                    socket.emit("fileError", "Echec de l'envoi : mauvais type de fichier");
                    delete(files[socket.fileName]);
                    delete(socket.tagObj);
                    delete(socket.objToStore);
                    delete(socket.fileName);
                }
            }
        }
    }
}

function destroy(socket) {
    if (socket.hasOwnProperty("fileName")) {
        if (files.hasOwnProperty(socket.fileName) ) {
            delete(files[socket.fileName]);
        }
    }
}

function sliceUploadMain(data, socket, dbo) {
    if (socket.hasOwnProperty("fileName") && data.hasOwnProperty("slice") && data.hasOwnProperty("cursor") &&
        data.hasOwnProperty("total")) {
        if (!files.hasOwnProperty(socket.fileName)) {
            files[socket.fileName] = [];
            files[socket.fileName].push(data.slice);
            socket.emit("request slice upload main", data.cursor);
        } else {
            files[socket.fileName].push(data.slice);
            if (data.cursor < data.total) {
                socket.emit("request slice upload main", data.cursor);
            } else {
                const b64fileURI = files[socket.fileName].join("");
                let imgType = "";
                if (/image\/png/.test(b64fileURI)) {
                    imgType = ".png";
                } else if (/image\/jp/.test(b64fileURI)) {
                    imgType = ".jpg";
                }
                if (imgType !== "" && b64fileURI.length < 40000000) {
                    const b64file = b64fileURI.split(';base64,').pop();
                    if (b64fileURI.length === data.total) {
                        fs.writeFile("genImg/"+socket.fileName+imgType, b64file, {encoding: 'base64'}, function(err) {
                            if (err) throw err;
                            socket.objToStore.contenu = "";
                            dbo.collection("tags").insertOne(socket.tagObj, function(err, res) {
                                if (err) throw err;
                                dbo.collection("data").insertOne(socket.objToStore, function(err, res) {
                                    if (err) throw err;
                                    socket.emit("fileSucces", true);
                                    delete(files[socket.fileName]);
                                    delete(socket.tagObj);
                                    delete(socket.objToStore);
                                    delete(socket.fileName);
                                });
                            });
                        });
                    } else {
                        socket.emit("fileError", "Echec de l'envoi");
                        delete(files[socket.fileName]);
                        delete(socket.tagObj);
                        delete(socket.objToStore);
                        delete(socket.fileName);
                    }
                } else {
                    socket.emit("fileError", "Echec de l'envoi : mauvais type de fichier");
                    delete(files[socket.fileName]);
                    delete(socket.tagObj);
                    delete(socket.objToStore);
                    delete(socket.fileName);
                }
            }
        }
    }
}