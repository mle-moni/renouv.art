module.exports = {
    save: save,
    giveMap: giveMap,
    getSave: getSave
};

function save(obj, socket, dbo) {
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
}

function giveMap(x, y, socket, dbo) {
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
}

function getSave(socket, dbo) {
    dbo.collection("labyMap1").find({}).toArray(function(err, result) {
        if (err) throw err;
        socket.emit("getSave", result);
    });
}