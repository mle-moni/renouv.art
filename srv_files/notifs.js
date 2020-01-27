const crypt = require("../../global/crypt");

module.exports = {
    get: get,
    empty: empty,
    add: add
};

function get(socket, dbo) {
    if (socket.hasOwnProperty("psd")) {
        dbo.collection("account").findOne({psd: crypt.encode(socket.psd)}, function(err, result) {
            if (err) throw err;
            if (result.hasOwnProperty("notifs")) {
                socket.emit("notif", result.notifs);
            }
        });
    }
}

function empty(socket, dbo) {
    if (socket.hasOwnProperty("psd")) {
        dbo.collection("account").updateOne({psd: crypt.encode(socket.psd)}, {
            $set: {
                "notifs.num" : 0
            }
        }, function(err, res) {
            // on vient de vider le comptage des notifications non lues
            socket.emit("emptyNotifs");
        });
    }
}

function add(pseudo, txt, href, socket, dbo) {
    if (socket.hasOwnProperty("psd")) {
        if (socket.psd === "Redz" || socket.psd === "Le gentil développeur" || socket.psd === "admin.mayeul") {
            const cryptedPseudo = crypt.encode(pseudo);
            dbo.collection("account").findOne({psd: cryptedPseudo}, function(err, result) {
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
                dbo.collection("account").updateOne({psd: cryptedPseudo}, {
                    $set: {
                        notifs: obj.notifs
                    }
                }, function(err, res) {
                    // on a mis a jour les notifs et les likes !
                });
            });
        }
    }
}