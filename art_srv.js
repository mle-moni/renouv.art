const http = require('http');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://art_admin:bonjour_BONJOUR_NANMAISREPONDFDP@localhost:27017/?authSource=art";
const handler = require('./srv_files/handler').handler;
const connection = require("./srv_files/connection");
const admin = require("./srv_files/admin");
const upload = require("./srv_files/upload");
const chat = require("./srv_files/chat");
const laby = require("./srv_files/laby");
const likes = require("./srv_files/likes");
const notifs = require("./srv_files/notifs");

const Analyse = {
    connnected: 0,
    total: 0
};

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
            connection.createAccount(obj, socket, dbo);            
        });

        socket.on("decomoi", ()=>{
            delete(socket.psd);
            delete(socket.passwd);
        });
        socket.on("connectemoistp", (obj, coSettings)=>{
            connection.connect(obj, coSettings, socket, dbo);
        });

        socket.on("testPsd", (psd, num)=>{
            connection.testPsd(psd, num, socket, dbo);
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
            admin.hideContent(query, socket, dbo);
        });

        socket.on("deleteContent", query=>{
            admin.deleteContent(query, socket, dbo);
        });

        socket.on("givePsd", ()=> {
            socket.emit("log1", socket.psd);
        });

        socket.on("getAdminFile", ()=>{
            admin.getFile(socket, dbo);
        });

        socket.on("flushAdminFile", ()=>{
            admin.flushFile(socket, dbo);
        });

        socket.on("getHidden", ()=>{
            admin.getHidden(socket, dbo);
        });

        socket.on("showHidden", ()=>{
            admin.showHidden(socket, dbo);
        });

        socket.on("disconnect", ()=>{
            upload.destroy(socket);
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
            upload.sliceUpload(data, socket, dbo)
        });

        socket.on('slice upload mini', (data) => {
            upload.sliceUploadMini(data, socket, dbo);
        });

        socket.on('slice upload main', (data) => {
            upload.sliceUploadMain(data, socket, dbo);
        });

        socket.on("connections", (str)=>{
            if (str === "giveco") {
                socket.emit("log1", Analyse);
            }
        });

        socket.on("getChat", ()=>{
            chat.getAll(socket, dbo);
        });

        socket.on("chatTxt", (txt)=>{
            chat.newMsg(txt, socket, dbo);
        });

        socket.on("deleteChat", str=>{
            chat.deleteMsg(str, socket, dbo);
        });

        socket.on("resetLikes", ()=>{
            likes.reset(socket, dbo);
        });

        socket.on("getLikes", (psd, title)=>{
            likes.get(psd, title, socket, dbo);
        });

        socket.on("addLike", (psd, title)=>{
            likes.add(psd, title, socket, dbo);
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
            laby.save(obj, socket, dbo);
        });

        socket.on("giveLabyMap", (x, y)=>{
            laby.giveMap(x, y, socket, dbo);
        });

        socket.on("getSave", ()=>{
            laby.getSave(socket, dbo);
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
            notifs.get(socket, dbo);
        });
        
        socket.on("emptyNotifs", ()=>{
            notifs.empty(socket, dbo);
        });
        
        socket.on("newNotif", (pseudo, txt, href)=>{
            notifs.add(pseudo, txt, href, socket, dbo);
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
