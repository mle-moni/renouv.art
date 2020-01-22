module.exports = {
    reset: reset,
    get: get,
    add: add
};

function reset(socket, dbo) {
    if (socket.hasOwnProperty("psd")) {
        if (socket.psd === "admin.mayeul") {
            dbo.collection("data").updateMany({}, {$set: {likes: 0, loveFrom: ""}}, function(err, res) {
                if (err) throw err;
            });
        } else {
            //on arrete tout ICI
            socket.emit("log1", "acces denied");
        }
    }
}

function get(psd, title, socket, dbo) {
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
}

function add(psd, title, socket, dbo) {
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
}