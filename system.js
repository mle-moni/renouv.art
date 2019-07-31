const jsUser = document.getElementById("js-user");
jsUser.innerHTML = "";
const cv1 = document.createElement("canvas");
const cv2 = document.createElement("canvas");
cv1.id = "canvas1";
cv2.id = "canvas2";
cv1.className = cv2.className = "cvAni";
cv1.width = cv2.width = cv1.height = cv2.height = 400;
jsUser.appendChild(cv1);
jsUser.appendChild(cv2);
cv1.style.left = cv2.style.left = (innerWidth/2) - (cv1.width/2) + "px";
cv1.style.top = cv2.style.top = (innerHeight/2) - (cv1.height/2) + "px";

const cvctx1 = cv1.getContext("2d");
const cvctx2 = cv2.getContext("2d");
const center = {
	x: cv1.width/2,
	y: cv1.height/2
};

class Ball {
	constructor(angle, w) {
		this.angle = angle;
		this.w = w;
	}
};

const ani = new Ball(0, 10);

let others = [];

for (let i = 1; i < 20; i ++) {
	others.push(new Ball(0.1*i, 10-i/2));
}

let speed = 0.2;

let growing = true;

let color = {
	r: entierAleatoire(0,255),
	g: entierAleatoire(0,255),
	b: entierAleatoire(0,255)
};

let aleas = ["r","g","b"];
let waitAni = setInterval(()=>{
	cvctx1.clearRect(0,0,cv1.width,cv1.height);
	
	ani.angle += speed;

	for (let i = 0; i < others.length; i ++) {
		cvctx1.fillStyle = `RGB(${(color.r+i)%255},${(color.g+i)%255},${(color.b+i)%255})`;
		cvctx1.beginPath();
		cvctx1.arc(center.x+(Math.cos(ani.angle-others[i].angle)*50), center.y+(Math.sin(ani.angle-others[i].angle)*50), others[i].w, 0, 2*Math.PI);
		cvctx1.fill();
	}

	cvctx1.fillStyle = `RGB(${color.r},${color.g},${color.b})`;
	cvctx1.beginPath();
	cvctx1.arc(center.x+(Math.cos(ani.angle)*50), center.y+(Math.sin(ani.angle)*50), ani.w, 0, 2*Math.PI);
	cvctx1.fill();

	for (let i = 0 ; i < 20; i++) {
		cvctx1.fillStyle = `RGB(${color.r},${color.g},${color.b})`;
		cvctx1.beginPath();
		cvctx1.arc(center.x+(Math.cos(ani.angle)*50) + entierAleatoire(-10,10), center.y+(Math.sin(ani.angle)*50) + entierAleatoire(-10,10), entierAleatoire(1,3), 0, 2*Math.PI);
		cvctx1.fill();
		if (entierAleatoire(0,100) === 42) {
			let allPos = [];
			let bound = entierAleatoire(2, 4);
			for (let a = 0; a < bound; a++) {
				allPos.push({
					x: entierAleatoire(-50, 50),
					y: entierAleatoire(-50, 50)
				});
			}
			let acPos = {
				x: center.x+(Math.cos(ani.angle)*50),
				y: center.y+(Math.sin(ani.angle)*50)
			};
			cvctx1.strokeStyle = "black";
			cvctx1.beginPath();
			for (let a = 0; a < allPos.length; a++) {
				if (a === 0) {
					cvctx1.moveTo(acPos.x, acPos.y);
				} else {
					cvctx1.moveTo(allPos[a-1].x + acPos.x, allPos[a-1].y + acPos.y);
				}
				cvctx1.lineTo(allPos[a].x + acPos.x, allPos[a].y + acPos.y);			
			}
			cvctx1.stroke();
		}
	}

	if (growing && speed < 0.35) {
		speed += 0.005;
		if (speed >= 0.35) {
			growing = false;
		}
	} else if (growing === false && speed > 0.1) {
		speed -= 0.005;
		if (speed <= 0.1) {
			growing = true;
		}
	}
	color[aleas[entierAleatoire(0, aleas.length-1)]] += 1;
}, 50);

let system = "";
// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
	// Great success! All the File APIs are supported.
} else {
	document.getElementsByTagName("html").innerHTML = "Votre navigateur n'est pas compatible avec cette application web. <br> Nous vous conseillons d'utiliser un autre navigateur : google chrome ou firefox par exemple, ou bien de mettre à jour votre navigateur actuel.";
}

// detect mobiles
if (navigator.userAgent.match(/(android|iphone|ipad|blackberry|symbian|symbianos|symbos|netfront|model-orange|javaplatform|iemobile|windows phone|samsung|htc|opera mobile|opera mobi|opera mini|presto|huawei|blazer|bolt|doris|fennec|gobrowser|iris|maemo browser|mib|cldc|minimo|semc-browser|skyfire|teashark|teleca|uzard|uzardweb|meego|nokia|bb10|playbook)/gi)) {
		if ( ((screen.width  >= 480) && (screen.height >= 800)) || ((screen.width  >= 800) && (screen.height >= 480)) || navigator.userAgent.match(/ipad/gi) ) {
		// tablette
		system = "tablette";
		} else {
				//mobile
				system = "mobile";
		}
} else {
	// pc
	system = "pc";
}
const PAGE = document.getElementById("main");
document.body.style.top = document.getElementsByTagName("h1")[0].offsetHeight + "px";
PAGE.style.top = document.getElementsByTagName("h1")[0].offsetHeight + "px";

if (system === "pc" || system === "tablette") {

} else {
	// document.getElementsByTagName("header")[0].style.position = "static";
	document.getElementById("post").style.fontSize = "20px";
	document.getElementById("logo").style.visibility = "hidden";
}

const socket = io.connect(location.origin);
// const socket = io.connect("https://renouv.art");

document.getElementById("top").getElementsByTagName("input")[0].addEventListener("keydown", e=>{
	if (e.keyCode === 13) {
		let rawquery = document.getElementById("top").getElementsByTagName("input")[0].value;
		if (/::b/.test(rawquery)) {
			location.replace("/");
		} else if (/::admin.flush/.test(rawquery)) {
			socket.emit("flushAdminFile");
		} else if (/::admin/.test(rawquery)) {
			socket.emit("getAdminFile");
		} else if (/::hidden.show/.test(rawquery)) {
			socket.emit("showHidden");
		} else if (/::hidden/.test(rawquery)) {
			socket.emit("getHidden");
		} else if (/::deco/.test(rawquery)) {
			socket.emit("decomoi");
			let direc = sessionStorage.getItem("goTo");
			sessionStorage.clear();
			localStorage.clear();
			sessionStorage.setItem("goTo", direc);
		} else {
			let query = "/search/!query="+rawquery;
			query = query.replace(/\#/g, "%99");
			if (/^\/search/.test(window.location.pathname)) {
				socket.emit("req", rawquery);
			} else {
				window.location.replace(query);
			}
		}
	}
});

let supprimer = false;
if (localStorage.getItem('psd')) {
	sessionStorage.setItem('psd', localStorage.getItem('psd'))
}
if (localStorage.getItem('passwd')) {
	sessionStorage.setItem('passwd', localStorage.getItem('passwd'))
}
const connectObj = {
	psd: sessionStorage.getItem('psd'),
	passwd: sessionStorage.getItem('passwd')
};
if (connectObj.psd !== null && connectObj.passwd !== null) {
	if (/post/.test(location.pathname) === false) {
		socket.emit("connectemoistp", connectObj);
	}
}

socket.on("getAdminFile", res=>{
	if (document.getElementById("admin") === null) {
		const div = document.createElement("div");
		div.id = "admin";
		div.style.position = "fixed";
		div.style.overflowY = "scroll";
		div.style.maxHeight = "100%";
		div.style.top = document.getElementsByTagName("h1")[0].offsetHeight + "px";
		div.style.left = (window.innerWidth/2) - 250 + "px";
		div.style.width = "500px";
		div.style.backgroundColor = "black";
		div.title = "Double click sur le message pour le cacher";
		div.ondblclick = ()=> {
			document.getElementById("admin").style.visibility = "hidden";
		}
		PAGE.appendChild(div);
	} else {
		document.getElementById("admin").innerHTML = "";
		document.getElementById("admin").style.visibility = "visible";
	}
	for (let i = 0; i < res.length; i++) {
		const p = document.createElement("p");
		let dt = new Date(res[i].date);
		p.innerHTML = "["+dt.getFullYear()+"/"+(dt.getMonth()+1)+"/"+ dt.getDate()+" "+dt.getHours()+":"+dt.getMinutes()+":"+dt.getSeconds()+"]" + " : "+ res[i].action + " par "+res[i].auteur;
		p.style.color = "#20C20E";
		p.style.fontFamily = "sans-serif";
		document.getElementById("admin").appendChild(p);
	}
	document.getElementById("admin").appendChild(document.createElement("br"));
	document.getElementById("admin").appendChild(document.createElement("br"));
	document.getElementById("admin").appendChild(document.createElement("br"));
});

socket.on("log1", e=>{
	console.log(e);
	socket.emit("getPicks", "ecrit");
});

let b64contenu = "";
let b64mini = "";

function entierAleatoire(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadEnd() {
	document.getElementById("main").style.visibility = "visible";
	document.getElementById("post").style.visibility = "visible";
	document.getElementsByTagName("header")[0].style.visibility = "visible";
	jsUser.style.display = "none";
}

function wait(bol) {
	if (bol) {
		jsUser.style.display = "block";
	} else {
		jsUser.style.display = "none";	
	}
}

function speChar(str) {
	return str.replace(/\'/gi, "*spechar1").replace(/\"/gi, "*spechar2").replace(/\(/gi, "*spechar3").replace(/\)/gi, "*spechar4").replace(/\#/gi, "*spechar5").replace(/\!/gi, "*spechar6").replace(/\?/gi, "*spechar7");
}

function brb() {
	sessionStorage.setItem("goTo", location.pathname);
	location.replace("/login");
}

socket.on("getLikes", (numLikes)=>{
	document.getElementById("likes").innerHTML = "";
	document.getElementById("likes").appendChild(document.createTextNode(numLikes));
});

const actualFocus = {
	psd: "",
	title: ""
};

function addLike() {
	socket.emit("addLike", actualFocus.psd, actualFocus.title);
}
socket.on("sendGetLikes", ()=>{
	socket.emit("getLikes", actualFocus.psd, actualFocus.title);
});

socket.on("logAndComeBack", ()=>{
	brb();
});

if (document.getElementById("keur") !== null) {
	document.getElementById("keur").title = "J'aime ce contenu";
	document.getElementById("keur").addEventListener("click", ()=>{
		addLike();
	});
}

let notifNum = 0;
const notifBubble = document.createElement("div");
notifBubble.onclick = ()=>{
	if (notifBoard.style.display !== "block") {
		socket.emit("juico?");
		socket.emit("getNotifs");
		notifBoard.style.left = (window.innerWidth/2) - (window.innerWidth/4) + "px";
		notifBoard.style.width = (window.innerWidth/2) + "px";
		notifBoard.style.display = "block";
		socket.emit("emptyNotifs");
	} else {
		notifBoard.style.display = "none";
	}
};
notifBubble.id = "notif";
notifBubble.innerHTML = "<p style='margin: auto;'></p>";
notifBubble.className = "notifState1";
notifBubble.title = "Voir les notifs";
document.getElementById("main").appendChild(notifBubble);

const notifBoard = document.createElement("div");
notifBoard.innerHTML = "<p class='singleNotif' >Dupond Jean à aimé votre musique Révolte.</p><p class='singleNotif' >Bernard Roger à aimé votre photo Fleur 3.</p>";
notifBoard.id = "notifBoard";
notifBoard.style.position = "fixed";
notifBoard.style.overflowY = "scroll";
notifBoard.style.maxHeight = "100%";
notifBoard.style.top = document.getElementsByTagName("h1")[0].offsetHeight + "px";
notifBoard.style.left = (window.innerWidth/2) - (window.innerWidth/4) + "px";
notifBoard.style.width = (window.innerWidth/2) + "px";
notifBoard.style.backgroundColor = "rgb(90, 81, 77)";
notifBoard.style.color = "#fe9f6d";
notifBoard.title = "Clique sur une notification pour accèder au contenu en rapport.";
notifBoard.style.display  = "none";
notifBoard.ondblclick = ()=> {
	notifBoard.style.display  = "none";
}
PAGE.appendChild(notifBoard);

socket.on("notifDispo", ()=>{
	socket.emit("getNotifs");
});

socket.on("notif", (notifs)=>{
	notifBoard.innerHTML = "";
	for (let i = 0; i < notifs.arr.length; i++) {
		let link = document.createElement("p");
		link.className = "singleNotif";
		link.appendChild(document.createTextNode(notifs.arr[i].txt));
		link.href = window.location.origin + "/" + notifs.arr[i].href;
		link.onclick = (e)=>{
			location.replace(e.path[0].href);
		}
		notifBoard.appendChild(link);
	}
	notifNum = notifs.num;
	if (notifNum !== 0) {
		document.getElementById("notif").innerHTML = "<p style='margin: auto;'>"+notifNum+"</p>";
		document.getElementById("notif").className = "notifState2";
		setTimeout(()=>{
			document.getElementById("notif").className = "notifState1";
		}, 2500);
	}
});

socket.on("emptyNotifs", ()=>{
	setTimeout(()=>{	
		document.getElementById("notif").innerHTML = "<p style='margin: auto;'>0</p>";
	}, 800);
});

socket.emit("getNotifs");
setInterval(()=>{
	socket.emit("getNotifs");
}, 10000);
