const express = require("express");
const path = require("path");

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use((req, res, next) => {
    req.subdomain = req.headers.host.split(".")[0];

    next();
});

app.get("/test", (req, res) => {
    res.redirect("http://test.localhost:8080");
});

app.get("*", (req, res) => {
    let { url, subdomain } = req;

    if (url.includes("/src/")) {
        res.sendFile(path.join(__dirname + url));
    } else if (url == "/script.js") {
        res.sendFile(path.join(__dirname + "/client/script.js"));
    } else if (url == "/main.css") {
        res.sendFile(path.join(__dirname + "/client/main.css"));
    } else if (subdomain == "test")  {
        res.sendFile(path.join(__dirname + "/client/index.html"));
    } else {
        res.sendFile(path.join(__dirname + "/client/wip.html"));
    }
});

app.listen(8080, () => {
    console.log("Server listening to port 8080");
});