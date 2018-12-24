// @author Meghan#2032 <https://nektro.net/>
//
//
const path = require("path");
const fs = require("fs");
const https = require("https");
//
https.globalAgent.maxSockets = 25;
//
function main()
{
    try {
        fs.mkdirSync(path.join(__dirname, "files"));
    }
    catch {}
    savePost(1);
}
function savePost(i)
{
    const url = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-"+i+".jpg";
    const file_name = url.split("/").reverse()[0];
    const loc = `${__dirname}/files/${file_name}`;
    // console.log(`GET ${i}: ${url} ${file_name}`);

    if (!(fs.existsSync(loc))) {
        https.get(url, (res) => {
            if (res.statusCode !== 404) {
                res.pipe(fs.createWriteStream(loc));
                console.log(`Saved ${i}: ${url}`);
                if (i < 730000) savePost(i + 1);
            }
            else {
                const url = "https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-"+i+".png";
                https.get(url, (res) => {
                    res.pipe(fs.createWriteStream(loc));
                    console.log(`Saved ${i}: ${url}`);
                    if (i < 730000) savePost(i + 1);
                }).on("error", function() {
                    console.log(`Error ${i}: ${url}`);
                    if (i < 730000) savePost(i + 1);
                });
            }
        })
        .on("error", function() {
            console.log(`Error ${i}: ${url}`);
            if (i < 730000) savePost(i + 1);
        });
    }
    else {
        console.log(`Skipping ${url}`);
        if (i < 730000) savePost(i + 1);
    }
}
//
//
main();
