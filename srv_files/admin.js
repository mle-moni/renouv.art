const fs = require('fs');

module.exports = {
    hideContent: hideContent,
    deleteContent: deleteContent,
    getFile: getFile,
    flushFile: flushFile,
    showHidden: showHidden,
    getHidden: getHidden
};

function hideContent(query, socket, dbo) {
    if (socket.hasOwnProperty("psd")) {
        if (socket.psd === "admin.lucas" || socket.psd === "admin.mayeul") {
            if (query.hasOwnProperty("auteur") && query.hasOwnProperty("titre")) {
                dbo.collection("tags").find({
                    auteur: query.auteur
                }).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].titre === query.titre) {
                                const obj = result[i];
                                const objID = obj["_id"];
                                const myquery = { "_id": objID };
                                const newvalues = { $set: {visible: false } };
                                dbo.collection("tags").updateOne(myquery, newvalues, function(err, res) {
                                    if (err) throw err;
                                    socket.emit("log1", query.auteur+" - "+query.titre+ " a été censuré.");
                                    const objToStore = {
                                        date: new Date(),
                                        action: query.auteur+" - "+query.titre+ " a été censuré",
                                        auteur: socket.psd
                                    };
                                    dbo.collection("administration").insertOne(objToStore, function(err, res) {
                                        if (err) throw err;
                                    });
                                });
                            }
                        }
                    }
                });
            }
        } else {
            //on arrete tout ICI
            socket.emit("log1", "acces denied");
        }
    }
}

function deleteContent(query, socket, dbo) {
    if (socket.hasOwnProperty("psd")) {
        if (socket.psd === "admin.mayeul") {
            if (query.hasOwnProperty("auteur") && query.hasOwnProperty("titre")) {
                dbo.collection("tags").find({
                    auteur: query.auteur
                }).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].titre === query.titre) {
                                const obj = result[i];
                                const objID = obj["_id"];
                                const myquery = { "_id": objID };
                                dbo.collection("tags").deleteOne(myquery, function(err, res) {
                                    if (err) throw err;
                                    socket.emit("log1", query.auteur +" - "+query.titre+ " a été supprimé des données de recherche.");
                                });
                            }
                        }
                    }
                });
                dbo.collection("data").find({
                    auteur: query.auteur
                }).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].titre === query.titre) {
                                if (result[i].type === "musique") {
                                    fs.unlink('./generatedFiles/'+result[i].auteur+"_"+result[i].titre+".mp3", (err) => {
                                        if (err) throw err;
                                    });
                                } else if (result[i].type === "photo") {
                                    fs.unlink('./genImg/'+result[i].auteur+"_"+result[i].titre+".jpg", (err) => {
                                        if (err) throw err;
                                    });
                                    fs.unlink('./genImg/mini'+result[i].auteur+"_"+result[i].titre+".jpg", (err) => {
                                        if (err) throw err;
                                    });
                                } else if (result[i].type === "dessin") {
                                    fs.unlink('./genImg/'+result[i].auteur+"_"+result[i].titre+".png", (err) => {
                                        if (err) throw err;
                                    });
                                    fs.unlink('./genImg/mini'+result[i].auteur+"_"+result[i].titre+".png", (err) => {
                                        if (err) throw err;
                                    });
                                }
                                const obj = result[i];
                                const objID = obj["_id"];
                                const myquery = { "_id": objID };
                                dbo.collection("data").deleteOne(myquery, function(err, res) {
                                    if (err) throw err;
                                    socket.emit("log1", query.auteur +" - "+query.titre+ " a été supprimé de la base de donnée.");
                                    const objToStore = {
                                        date: new Date(),
                                        action: query.auteur+" - "+query.titre+ " a été supprimé de la base de donnée",
                                        auteur: socket.psd
                                    };
                                    dbo.collection("administration").insertOne(objToStore, function(err, res) {
                                        if (err) throw err;
                                    });
                                });
                            }
                        }
                    }
                });
            }
        } else {
            //on arrete tout ICI
            socket.emit("log1", "acces denied");
        }
    }
}

function getFile(socket, dbo) {
    if (socket.psd === "admin.lucas" || socket.psd === "admin.mayeul") {
        dbo.collection("administration").find({}).toArray(function(err, result) {
            if (err) throw err;
            if (result !== null) {
                socket.emit("getAdminFile", result);
            }
        });
    } else {
        //on arrete tout ICI
        socket.emit("log1", "acces denied");
    }
}

function flushFile(socket, dbo) {
    if (socket.psd === "admin.mayeul") {
        dbo.collection("administration").deleteMany({}, function(err, obj) {
            if (err) throw err;
            const objToStore = {
                date: new Date(),
                action: "Le fichier admin à été vidé de ses "+obj.result.n+" actions",
                auteur: socket.psd
            };
            dbo.collection("administration").insertOne(objToStore, function(err, res) {
                if (err) throw err;
            });
        });
    } else {
        //on arrete tout ICI
        socket.emit("log1", "acces denied");
    }
}

function showHidden(socket, dbo) {
    if (socket.psd === "admin.lucas" || socket.psd === "admin.mayeul") {
        const myquery = { visible: false };
        const newvalues = {$set: {visible: true} };
        dbo.collection("tags").updateMany(myquery, newvalues, function(err, obj) {
            if (err) throw err;
            const objToStore = {
                date: new Date(),
                action: obj.result.nModified+" objets ont été rendu visible à nouveau",
                auteur: socket.psd
            };
            dbo.collection("administration").insertOne(objToStore, function(err, res) {
                if (err) throw err;
            });
        });
    }
}

function getHidden(socket, dbo) {
    if (socket.psd === "admin.lucas" || socket.psd === "admin.mayeul") {
        dbo.collection("tags").find({
            visible: false
        }).toArray(function(err, result) {
            if (err) throw err;
            if (result !== null) {
                socket.emit("res", result, true);
            } else {
                // rien n'a été trouvé
                socket.emit("res", [], false);
            }
        });
    }
}