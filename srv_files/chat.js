const crypt = require("../../global/crypt");

module.exports = {
    getAll: getAll,
    newMsg: newMsg,
    deleteMsg: deleteMsg
};

function getAll(socket, dbo) {
    dbo.collection("chat").find({}).toArray(function(err, result) {
        if (err) throw err;
        socket.emit("getChat", result);
    });
}

function newMsg(txt, socket, dbo) {
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
            });
        } else {
            socket.emit("chatErr", "Vous devez être connecté : <a style='color: blue; cursor: pointer;' onclick=\"brb()\">Se connecter</a>");
        }
    } else {
        socket.emit("chatErr", "Le message que vous avez envoyé a été considéré comme vide ou spam.");
    }
}

// delete the files that matches with the string pattern
function deleteMsg(str, socket, dbo) {
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
    } else {
        //on arrete tout ICI
        socket.emit("log1", "acces denied");
    }
}