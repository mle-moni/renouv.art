const http = require('http');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const Hashes = require('jshashes');
const handler = require('./srv_files/handler.js').handler;

const Analyse = {
    connnected: 0,
    total: 0
};
    //new Hashes.SHA256().b64("salut") // how to SHA256 ;)

let files = {};

const livePlayers = {};

const playersID = [];
let players = {};
const skins = ["default", "x_wing", "plane", "drone"];
let leaderboard = {};


MongoClient.connect(url, {
    useNewUrlParser: true,
}, function(err, db) {
    if (err) throw err;
    let dbo = db.db("art");

    function entierAleatoire(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const server = http.createServer(handler);
    const io = require('socket.io')(server);

    server.listen(8125, "localhost");

    io.on('connection', function (socket) {

        Analyse.connnected++;
        Analyse.total++;
        
        socket.on("createAcc", (obj)=>{
            if (obj.hasOwnProperty("psd") && obj.hasOwnProperty("passwd")) {
                let userName = obj.psd;
                let passwd = new Hashes.SHA256().b64(obj.passwd);
                if (userName.length > 30) {
                    socket.emit("fail", "create");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Votre nom de compte ne peut dépasser 30 charactères."
                    }]);
                } else if (userName === "") {
                    socket.emit("fail", "create");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Veuillez renseigner le champ 'Nom du compte'"
                    }]);
                } else if (/\//.test(userName) ) {
                    socket.emit("fail", "create");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Erreur, le caractère / est interdit !"
                    }]);
                } else if (/\\/.test(userName)) {
                    socket.emit("fail", "create");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Erreur, le caractère \\ est interdit !"
                    }]);
                } else if (/srv/.test(userName)) {
                    socket.emit("fail", "create");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Erreur, votre titre ne peut pas contenir : srv !"
                    }]);
                } else if (/mayeul/i.test(userName)) {
                    socket.emit("fail", "create");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Erreur, le mot 'Mayeul' est réservé !"
                    }]);
                } else {

                    dbo.collection("connection").findOne({
                        psd: userName
                    }, function(err, result) {
                        if (err) throw err;
                        if (result === null) {
                            const myobj = {
                                psd: userName,
                                passwd: passwd
                            };
                            const accObj = {
                                psd: userName,
                                stuff: "",
                                totalLikes: 0,
                                moneyLikes: 0
                            };
                            dbo.collection("connection").insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                socket.emit("log", [{
                                    id: "result",
                                    msg: "Votre compte à bien été créé ! \n Votre nom d'utilisateur est " + userName + "."
                                }], true);
                            });
                            dbo.collection("account").insertOne(accObj, function(err, res) {
                                if (err) throw err;
                            });
                        } else {
                            socket.emit("fail", "create");
                            socket.emit("log", [{
                            id: "result",
                            msg: "Ce nom d'utilisateur est déjà pris :c"
                        }] );
                    }
                    });
                }
            }
        });

        socket.on("decomoi", ()=>{
            delete(socket.psd);
            delete(socket.passwd);
        });
        socket.on("connectemoistp", (obj, coSettings)=>{
            if (socket.hasOwnProperty("psd")) {
                socket.emit("fail", "connect");
                        socket.emit("log", [{
                            id: "result",
                            msg: "Vous êtes déjà connecté au nom de "+
                            socket.psd+
                            ", <u style='' onclick='socket.emit(\"decomoi\"); let direc = sessionStorage.getItem(\"goTo\"); sessionStorage.clear(); localStorage.clear(); sessionStorage.setItem(\"goTo\", direc); document.getElementById(\"result\").innerHTML = \"\";'>Se déconnecter</u>"
                        }]);
            } else {
                if (obj.hasOwnProperty("psd") && obj.hasOwnProperty("passwd")) {
                    let userName = obj.psd;
                    let passwd = new Hashes.SHA256().b64(obj.passwd);
                    dbo.collection("connection").findOne({
                        psd: userName
                    }, function(err, result) {
                        if (err) throw err;
                        if (result === null) {
                            socket.emit("fail", "connect");
                            socket.emit("log", [{
                                id: "result",
                                msg: "Ce nom de compte n'existe pas..."
                            }]);
                        } else {
                            if (passwd === result.passwd) {
                                socket.psd = userName;
                                socket.passwd = passwd;
                                socket.emit("log", [{
                                    id: "result",
                                    msg: "Vous êtes bien connecté !"
                                }]);
                                socket.emit("succes", obj);
                            } else {
                                socket.emit("fail", "connect");
                                socket.emit("log", [{
                                    id: "result",
                                    msg: "Mot de passe éronné."
                                }]);
                                if (coSettings === "hard") {
                                    socket.emit("logAndComeBack");
                                }
                            }
                        }
                    });
                } else {
                    console.log("violation du protocole")
                }
            }
        });

        socket.on("testPsd", (psd, num)=>{
            if (typeof(psd) === "string" && typeof(num) === "number") {
                dbo.collection("connection").findOne({
                    psd: psd
                }, function(err, result) {
                    if (err) throw err;
                    if (result === null) {
                        socket.emit("testPsd", true, num);
                    } else {
                        socket.emit("testPsd", false, num);
                    }
                });
            }
        });

        socket.on("testFile", (obj)=>{
            if (socket.hasOwnProperty("psd")) {
                if (obj.hasOwnProperty("type") && obj.hasOwnProperty("contenu") && obj.hasOwnProperty("description") && obj.hasOwnProperty("titre")) {
                    const date = new Date();
                    const objToStore = {
                        auteur: socket.psd,
                        titre: obj.titre,
                        contenu: obj.contenu,
                        description: obj.description,
                        type: obj.type,
                        date: date,
                    }
                    let tagsStr = "";
                    tagsStr += objToStore.titre;
                    tagsStr += objToStore.auteur;
                    tagsStr += objToStore.type;
                    tagsStr += obj.tags;
                    const tagObj = {
                        tags: tagsStr,
                        auteur: socket.psd,
                        titre: obj.titre,
                        description: obj.description,
                        type: obj.type,
                        date: date,
                        visible: true
                    };
                    
                    dbo.collection("tags").find({
                        titre: tagObj.titre
                    }).toArray(function(err, result) {
                        if (err) throw err;
                        let libre = true;
                        let err1 = "";
                        if (result !== null) {
                            for (let i = 0; i < result.length; i++) {
                                if (result[i].auteur === socket.psd) {
                                    libre = false;
                                }
                                
                            }
                        }
                        if (/\//.test(tagObj.titre) ) {
                            libre = false;
                            err1 = "Erreur, le caractère / est interdit !";
                        } else if (/\\/.test(tagObj.titre)) {
                            libre = false;
                            err1 = "Erreur, le caractère \\ est interdit !";
                        } else if (/srv/.test(tagObj.titre)) {
                            libre = false;
                            err1 = "Erreur, votre titre ne peut pas contenir : srv !";
                        } else if (/\./.test(tagObj.titre)) {
                            libre = false;
                            err1 = "Erreur, votre titre ne peut pas contenir de points !";
                        }
                        if (libre) {
                            if (objToStore.type === "musique") {
                                if (objToStore.contenu < 10000000) {
                                    if (obj.hasOwnProperty("color")) {
                                        if (!socket.hasOwnProperty("fileName")) {
                                            objToStore.color = obj.color;
                                            tagObj.color = obj.color;
                                            socket.fileName = objToStore.auteur+"_"+objToStore.titre;
                                            socket.objToStore = objToStore;
                                            socket.tagObj = tagObj;
                                            socket.emit("start mp3");
                                        }                         
                                    }
                                } else {
                                    socket.emit("fileError", "Echec de l'envoi : fichier trop volumineux");
                                }
                            } else if (objToStore.type === "photo" || objToStore.type === "dessin") {
                                if (/\;base64/.test(objToStore.contenu) && /image/.test(objToStore.contenu)) {
                                    if (!socket.hasOwnProperty("fileName")) {
                                        socket.fileName = objToStore.auteur+"_"+objToStore.titre;
                                        socket.objToStore = objToStore;
                                        socket.tagObj = tagObj;
                                        socket.emit("start mini");
                                    }
                                }
                            } else {
                                dbo.collection("tags").insertOne(tagObj, function(err, res) {
                                    if (err) throw err;
                                    dbo.collection("data").insertOne(objToStore, function(err, res) {
                                        if (err) throw err;
                                        socket.emit("fileSucces", true);
                                    });
                                });
                            }
                            
                        } else {
                            if (err1 === "") {
                                socket.emit("fileError", "Vous avez déjà publié une oeuvre de ce nom."); // duo auteur / titre déjà utilisé
                            } else {
                                socket.emit("fileError", err1);
                            }
                        }
                    });
                            
                }
            } else {
                socket.emit("fileError", `Vous n'êtes pas connecté... Pour vous connecter cliquez <u onclick="window.location.reload()">ici</u>`);
            }
        });

        socket.on("getPicks", (str)=>{
            if (/ecrit|musique/.test(str)) {

                dbo.collection("tags").find({
                    type: str
                }).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        result = result.reverse();
                        socket.emit("get"+str, result);
                    }
                });
            }
        });

        socket.on("getImg", (str, startNum)=>{
            if (/dessin|photo/.test(str)) {
                if (startNum < 0) {
                    startNum = 0;
                }
                dbo.collection("tags").find({
                    type: str
                }).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        result = result.reverse();
                        const sendIt = [];
                        for (let i = 0; i < 10; i++) {
                            if ((startNum+i) < result.length) {
                                sendIt.push(result[startNum+i]);
                            } else break;
                        }
                        socket.emit("get"+str, sendIt);
                    }
                });
            }
        });

        socket.on("getContent", query=>{
            if (query.hasOwnProperty("auteur") && query.hasOwnProperty("titre")) {
                dbo.collection("data").find({
                    auteur: query.auteur
                }).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].titre === query.titre) {
                                socket.emit("getContent", result[i]);
                            }
                        }
                    }
                });
            }
        });

        socket.on("req", req=>{
            let keyWords = req.split(" ");
            let rgx = "(";
            for (let i = 0; i < keyWords.length; i++) {
                rgx += keyWords[i]+"|";
            }
            rgx = rgx.substring(0, rgx.length-1)
            rgx += ")";

            let trgx = new RegExp(rgx, "i");

            dbo.collection("tags").find({
                tags: trgx
            }).toArray(function(err, result) {
                if (err) throw err;
                if (result !== null) {
                    socket.emit("res", result.reverse(), false);
                } else {
                    // rien n'a été trouvé
                    socket.emit("res", [], false);
                }
            });

        });

        socket.on("hideContent", query=>{
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
        });

        socket.on("deleteContent", query=>{
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
        });

        socket.on("givePsd", ()=> {
            socket.emit("log1", socket.psd);
        });

        socket.on("getAdminFile", ()=>{
            if (socket.psd === "admin.lucas" || socket.psd === "admin.mayeul") {
                dbo.collection("administration").find({}).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        socket.emit("getAdminFile", result);
                    }
                });
            }
        });

        socket.on("flushAdminFile", ()=>{
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
            }
        });

        socket.on("getHidden", ()=>{
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
        });

        socket.on("showHidden", ()=>{
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
        });

        socket.on("disconnect", ()=>{
            if (socket.hasOwnProperty("fileName")) {
                if (files.hasOwnProperty(socket.fileName) ) {
                    delete(files[socket.fileName]);
                }
            }
            if (players.hasOwnProperty(socket.id)) {
                delete(players[socket.id]);
                socket.broadcast.emit("deletePlayer", socket.id);
            }
            if (socket.hasOwnProperty("psd")) {
                if (leaderboard.hasOwnProperty(socket.psd)) {
                    delete(leaderboard[socket.psd]);
                }
            }
            Analyse.connnected--;
            
            if (livePlayers.hasOwnProperty(socket.psd)) {
                delete(livePlayers[socket.psd]);
                socket.broadcast.emit("deletePlayer", socket.psd);
            }
        });

        socket.on('slice upload', (data) => {
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
        });

        socket.on('slice upload mini', (data) => {
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
        });

        socket.on('slice upload main', (data) => {
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
        });

        socket.on("connections", (str)=>{
            if (str === "giveco") {
                socket.emit("log1", Analyse);
            }
        });

        socket.on("getChat", ()=>{
            dbo.collection("chat").find({}).toArray(function(err, result) {
                if (err) throw err;
                socket.emit("getChat", result);
            });

        });

        socket.on("chatTxt", (txt)=>{
            let valid = true;
            if (txt === "" || /^ *$/.test(txt) || txt.length > 1000) {
                valid = false;
            }
            if (valid) {
                if (socket.hasOwnProperty("psd")) {
                    let myobj = { psd: socket.psd, txt: txt };
                    dbo.collection("chat").insertOne(myobj, function(err, res) {
                        if (err) throw err;
                        socket.emit("msgTxt", myobj);
                        socket.broadcast.emit("msgTxt", myobj);
                        // on enregistre la notification dans tous les comptes des utilisateurs
                        dbo.collection("account").find({}).toArray(function(err, result) {
                            let notifObj = {
                                txt: socket.psd + " à écrit dans le chat général.",
                                href: "chat"
                            };
                            for (let i = 0; i < result.length; i++) {
                                if (result[i].psd !== socket.psd) {
                                    let obj = result[i];
                                    if (obj.notifs === undefined) {
                                        obj.notifs = {
                                            arr: [notifObj],
                                            num: 1
                                        };
                                    } else {
                                        obj.notifs.num ++;
                                        obj.notifs.arr.unshift(notifObj);
                                        if (obj.notifs.arr.length > 20) {
                                            obj.notifs.arr.pop();
                                        }
                                    }
                                    const objID = obj["_id"];
                                    const myquery = { "_id": objID };
                                    const newvalues = obj;
                                    dbo.collection("account").replaceOne(myquery, newvalues, function(err, res) {
                                        if (err) throw err;
                                        socket.broadcast.emit("notifDispo");
                                    });
                                }
                            }
                        });
                    });

                } else {
                    socket.emit("chatErr", "Vous devez être connecté : <a style='color: blue; cursor: pointer;' onclick=\"brb()\">Se connecter</a>");
                }
            } else {
                socket.emit("chatErr", "Le message que vous avez envoyé a été considéré comme vide ou spam.");
            }
        });

        socket.on("deleteChat", str=>{
            if (socket.psd === "admin.mayeul") {
                dbo.collection("chat").deleteMany({txt: new RegExp(str)}, function(err, obj) {
                    if (err) throw err;
                    socket.emit("refreshChat");
                    socket.broadcast.emit("refreshChat");
                    setTimeout(()=>{
                        socket.emit("msgTxt", {psd: "ADMIN", txt: obj.result.n+" messages supprimés."});
                        socket.broadcast.emit("msgTxt", {psd: "ADMIN", txt: obj.result.n+" messages supprimés."});
                    }, 500);
                });
            }
        });

        socket.on("resetLikes", ()=>{
            if (socket.hasOwnProperty("psd")) {
                if (socket.psd === "admin.mayeul") {
                    dbo.collection("data").updateMany({}, {$set: {likes: 0, loveFrom: ""}}, function(err, res) {
                        if (err) throw err;
                    });
                }
            }
        });

        socket.on("getLikes", (psd, title)=>{
            dbo.collection("data").find({
                auteur: psd
            }).toArray(function(err, result) {
                if (err) throw err;
                if (result !== null) {
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].titre === title) {
                            if (isNaN(result[i].likes)) {
                                socket.emit("getLikes", 0);
                            } else {
                                socket.emit("getLikes", result[i].likes);
                            }
                        }
                    }
                }
            });
        });

        socket.on("addLike", (psd, title)=>{
            let notifInfo = "";
            if (socket.hasOwnProperty("psd")) {
                dbo.collection("data").find({
                    auteur: psd
                }).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].titre === title) {
                                notifInfo = result[i].type;
                                let likesNow = result[i].likes;
                                let lovedBy = result[i].loveFrom;
                                let contentId = result[i]["_id"];
                                if (isNaN(likesNow)) {
                                    likesNow = 0;
                                    lovedBy = "";
                                }
                                let testPsd = new RegExp("__"+socket.psd+"__");
                                if (testPsd.test(lovedBy) === false) {
                                    dbo.collection("data").updateOne({_id: contentId}, {
                                        $set: {
                                            likes: likesNow+1,
                                            loveFrom: lovedBy+"__"+socket.psd+"__"
                                        }
                                    }, function(err, res) {
                                        if (err) throw err;
                                        socket.emit("getLikes", likesNow+1);
                                        socket.broadcast.emit("sendGetLikes");
                                        dbo.collection("account").findOne({psd: psd}, function(err, result) {
                                            if (err) throw err;
                                            const obj = result;
                                            let hrefTxt = notifInfo;
                                            if (notifInfo === "ecrit") {
                                                hrefTxt = "ecriture";
                                            }
                                            hrefTxt += "!oeuvre="+encodeURI(psd)+"&&&"+encodeURI(title);
                                            let notifObj = {
                                                txt: socket.psd + " à aimé votre " + notifInfo + " nommé(e) " + title + ".",
                                                href: hrefTxt
                                            };
                                            if (obj.notifs === undefined) {
                                                obj.notifs = {
                                                    arr: [notifObj],
                                                    num: 1
                                                };
                                            } else {
                                                obj.notifs.num ++;
                                                obj.notifs.arr.unshift(notifObj);
                                                if (obj.notifs.arr.length > 20) {
                                                    obj.notifs.arr.pop();
                                                }
                                            }
                                            dbo.collection("account").updateOne({psd: psd}, {
                                                $set: {
                                                    totalLikes: result.totalLikes+1,
                                                    moneyLikes: result.moneyLikes+1,
                                                    notifs: obj.notifs
                                                }
                                            }, function(err, res) {
                                                // on a mis a jour les notifs et les likes !
                                            });
                                        });
                                    });
                                }
                            }
                        }
                    }
                });
            } else {
                socket.emit("logAndComeBack");
            }
        });
        
        socket.on("concours", idC=>{
            if (socket.hasOwnProperty("psd")) {
                // on verifie si l'id envoyée fait bien partie des choix possibles
                if (idC === "choix1" || idC  === "choix2") {
                    dbo.collection("concours").find({}).toArray(function(err, result) {
                        if (err) throw err;
                        if (result.length === 0) {
                            let newArr = [0 , 0 ];
                            if (idC === "choix1") {
                                newArr[0]++;
                            } else if (idC === "choix2") {
                                newArr[1]++;
                            }

                            const myobj = { votes: "__"+socket.psd+"__", arr: newArr };
                            dbo.collection("concours").insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                socket.emit("concours");
                                socket.broadcast.emit("concours");
                            });
                        } else {    
                            let concours = result[0];
                            let rgx = new RegExp("__"+socket.psd+"__");
                            if (rgx.test(concours.votes) === false) {
                                let newArr = [concours.arr[0] , concours.arr[1] ];
                                if (idC === "choix1") {
                                    newArr[0]++;
                                } else if (idC === "choix2") {
                                    newArr[1]++;
                                }
                                let myquery = {};
                                let newvalues = {$set: {arr: newArr, votes: concours.votes+"__"+socket.psd+"__" } };
                                dbo.collection("concours").updateMany(myquery, newvalues, function(err, res) {
                                    if (err) throw err;
                                    socket.emit("concours");
                                    socket.broadcast.emit("concours");
                                });
                            }
                        }
                    });
                }
            } else {
                socket.emit("logAndComeBack");
            }
        });

        socket.on("getConcours", ()=>{
            dbo.collection("concours").find({}).toArray(function(err, result) {
                if (err) throw err;
                if (result.length === 0) {
                    socket.emit("resConcours", [0,0]);
                } else {
                    socket.emit("resConcours", result[0].arr);
                }
            });
        });

        socket.on("saveLaby", (obj)=>{
            const newmap = []; 
            for (let i = 0; i < obj.length; i++) {
                for (let j = 0; j < obj[i].length; j++) {
                    newmap.push({x: j, y: i, map: obj[i][j]});
                }
            }
            dbo.collection("labyMap1").deleteMany({}, function(err, obj) {
                if (err) throw err;
                console.log(obj.result.n + " document(s) deleted");
                dbo.collection("labyMap1").insertMany(newmap, function(err, res) {
                    if (err) throw err;
                    console.log("Number of documents inserted: " + res.insertedCount);
                });
            });
        });

        socket.on("giveLabyMap", (x,y)=>{
            if (typeof(x) === "number" && typeof(y) === "number") {
                dbo.collection("labyMap1").find({x:x}).toArray(function(err, result) {
                    if (err) throw err;
                    let num = 0;
                    for (num; num < result.length; num++) {
                        if (result[num].y === y) {
                            break;
                        }
                    }
                    socket.emit("loadLaby", result[num]);
                });
            }
        });

        socket.on("getSave", ()=>{
            dbo.collection("labyMap1").find({}).toArray(function(err, result) {
                if (err) throw err;
                socket.emit("getSave", result);
            });
        });

        socket.on("getComments", query=>{
            if (query.hasOwnProperty("auteur") && query.hasOwnProperty("titre")) {
                dbo.collection("comments:"+query.auteur+"__"+query.titre).find({}).toArray(function(err, result) {
                    if (err) throw err;
                    if (result !== null) {
                        socket.emit("getComments", result);
                    }
                });
            }
        });

        socket.on("newCom", (obj, txt) => {
            let notifInfo = "";
            if (socket.hasOwnProperty("psd")) {
                if (obj.hasOwnProperty("auteur") && obj.hasOwnProperty("titre") && typeof(txt) === "string") {
                    const myobj = { auteur: socket.psd, txt: txt, date: new Date() };
                    dbo.collection("comments:"+obj.auteur+"__"+obj.titre).insertOne(myobj, function(err, res) {
                        if (err) throw err;
                        socket.emit("refreshCom", obj.titre);
                        socket.broadcast.emit("refreshCom", obj.titre);
                        dbo.collection("data").find({
                            auteur: obj.auteur
                        }).toArray(function(err, result) {
                            if (err) throw err;
                            for (let i = 0; i < result.length; i++) {
                                if (result[i].titre === obj.titre) {
                                    notifInfo = result[i].type;
                                    break;
                                }
                            }

                            dbo.collection("account").findOne({psd: obj.auteur},  function(err, result) {
                                const acc = result;
                                let hrefTxt = notifInfo;
                                if (notifInfo === "ecrit") {
                                    hrefTxt = "ecriture";
                                }
                                hrefTxt += "!oeuvre="+encodeURI(obj.auteur)+"&&&"+encodeURI(obj.titre);
                                let notifObj = {
                                    txt: socket.psd + " à commenté votre " + notifInfo + " nommé(e) " + obj.titre + ".",
                                    href: hrefTxt
                                };
                                if (acc.notifs === undefined) {
                                    acc.notifs = {
                                        arr: [notifObj],
                                        num: 1
                                    };
                                } else {
                                    acc.notifs.num ++;
                                    acc.notifs.arr.unshift(notifObj);
                                    if (acc.notifs.arr.length > 20) {
                                        acc.notifs.arr.pop();
                                    }
                                }
                                dbo.collection("account").replaceOne( {psd: acc.psd}, acc, function(err, res) {
                                    if (err) throw err;
                                    // hehe, et voilà le travail ! On a mis a jour les notifs de commentaires
                                });
                            });
                        });
                    });
                }
            } else {
                socket.emit("logAndComeBack");
            }
        });

        socket.on("genGame", ()=>{
            if (socket.hasOwnProperty("psd")) {
                socket.emit("getId", socket.id, socket.psd);
            } else {
                socket.emit("logAndComeBack");
            }
        });

        socket.on("gameGenerated", (obj, psd) => {
            if (socket.id === psd) {
                players[socket.id] = obj;
            }
        });

        socket.on("update", (obj, psd) => {
            if (socket.id === psd) {
                if (typeof(socket.updates) === "number") {
                    socket.updates++;
                    socket.updates %= 10;
                } else {
                    socket.updates = 0;
                }
                if (players.hasOwnProperty(socket.id) && socket.hasOwnProperty("psd")) {
                    players[socket.id] = obj;
                    leaderboard[socket.psd] = obj.score;
                    socket.emit("update", players, socket.id); //pas tres secu de donner l'ID de tous les joueurs, mais bon...
                    if (socket.updates === 0) {
                        socket.emit("leaderboard", leaderboard);
                    }
                }
            }
        });

        socket.on("fire", (obj, psd) => {
            if (socket.id === psd) {
                if (players.hasOwnProperty(socket.id)) {
                    socket.broadcast.emit("shot", obj);
                }
            }
        });

        socket.on("meteor", (obj, psd) => {
            if (socket.id === psd) {
                if (players.hasOwnProperty(socket.id)) {
                    socket.broadcast.emit("meteor", obj);
                    socket.emit("meteor", obj);
                }
            }
        });

        socket.on("deadFrom", (obj, psd) => {
            if (socket.id === psd) {
                if (players.hasOwnProperty(socket.id)) {
                    socket.broadcast.emit("deadFrom", obj);
                }
            }
        });

        socket.on("destroyMe", ()=>{
            if (players.hasOwnProperty(socket.id)) {
                delete(players[socket.id]);
                socket.broadcast.emit("deletePlayer", socket.id);
            }
        });

        socket.on("showSkins", ()=>{
            socket.emit("showSkins", skins);
        });

        socket.on("useSkin", skin=>{
            socket.emit("useSkin", skin, socket.id);
        });

        // pour la startup nulle
        socket.on("changelapage", num=>{
            socket.emit("changelapage", num);
            socket.broadcast.emit("changelapage", num);
        });

        socket.on("juico?", ()=>{
            if (socket.hasOwnProperty("psd") === false) {
                socket.emit("logAndComeBack");
            }
        });

        socket.on("getNotifs", ()=>{
            if (socket.hasOwnProperty("psd")) {
                dbo.collection("account").findOne({psd: socket.psd}, function(err, result) {
                    if (err) throw err;
                    if (result.hasOwnProperty("notifs")) {
                        socket.emit("notif", result.notifs);
                    }
                });
            }
        });

        socket.on("emptyNotifs", ()=>{
            if (socket.hasOwnProperty("psd")) {
                dbo.collection("account").updateOne({psd: socket.psd}, {
                    $set: {
                        "notifs.num" : 0
                    }
                }, function(err, res) {
                    // on vient de vider le comptage des notifications non lues
                    socket.emit("emptyNotifs");
                });
            }
        });

        socket.on("gameChat", (txt)=>{
            let valid = true;
            if (txt === "" || /^ *$/.test(txt) || txt.length > 1000) {
                valid = false;
            }
            if (valid) {
                if (socket.hasOwnProperty("psd")) {
                    let myobj = { psd: socket.psd, txt: txt };
                    socket.broadcast.emit("gameChat", myobj);
                    socket.emit("gameChat", myobj);
                } else {
                    socket.emit("chatErr", "Vous devez être connecté : <a style='color: blue; cursor: pointer;' onclick=\"brb()\">Se connecter</a>");
                }
            } else {
                socket.emit("chatErr", "Le message que vous avez envoyé a été considéré comme vide ou spam.");
            }
        });

        socket.on("scoreTournois", e=>{
            if (socket.hasOwnProperty("psd") && e.hasOwnProperty("jumps") && e.hasOwnProperty("time") && e.hasOwnProperty("password")) {
                if (e.password === socket.id) {
                    const myobj = {
                        psd: socket.psd,
                        jumps: e.jumps,
                        time: e.time,
                        score: Math.round(e.jumps*e.time*100)
                    };
                    dbo.collection("tournois2").insertOne(myobj, function(err, res) {
                        if (err) throw err;
                        dbo.collection("tournois2").find().sort({score: 1}).toArray((err, res)=>{
                            if (err) throw err;
                            socket.broadcast.emit("ladderTournois", res);
                            socket.emit("ladderTournois", res);
                        });
                    });
                }
            }
        });

        socket.on("getTournois", (tournamentId=1)=>{
            dbo.collection("tournois"+tournamentId).find().sort({score: 1}).toArray((err, res)=>{
                if (err) throw err;
                socket.broadcast.emit("ladderTournois", res);
                socket.emit("ladderTournois", res);
            });
        });

        socket.on("newNotif", (pseudo, txt, href)=>{
            if (socket.hasOwnProperty("psd")) {
                if (socket.psd === "Redz" || socket.psd === "Le gentil développeur" || socket.psd === "admin.mayeul") {
                    dbo.collection("account").findOne({psd: pseudo}, function(err, result) {
                        if (err) throw err;
                        const obj = result;
                        let notifObj = {
                            txt: txt,
                            href: href
                        };
                        if (obj.notifs === undefined) {
                            obj.notifs = {
                                arr: [notifObj],
                                num: 1
                            };
                        } else {
                            obj.notifs.num ++;
                            obj.notifs.arr.unshift(notifObj);
                            if (obj.notifs.arr.length > 20) {
                                obj.notifs.arr.pop();
                            }
                        }
                        dbo.collection("account").updateOne({psd: pseudo}, {
                            $set: {
                                notifs: obj.notifs
                            }
                        }, function(err, res) {
                            // on a mis a jour les notifs et les likes !
                        });
                    });
                }
            }
        });


        socket.on("livePos", (obj, passwd)=>{
            if (socket.hasOwnProperty("psd") && obj.hasOwnProperty("x") && obj.hasOwnProperty("y") && passwd === socket.id) {
                livePlayers[socket.psd] = {
                    psd: socket.psd,
                    x: obj.x,
                    y: obj.y,
                    skin: obj.skin,
                    map: obj.map,
                    anim: obj.anim
                };
                socket.emit("livePos", livePlayers);
            }
        });

    });

    console.log('Server running at http://127.0.0.1:8125/');
});