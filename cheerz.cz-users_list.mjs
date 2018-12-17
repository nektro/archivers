// @author Meghan#2032 <https://nektro.net/>
//
//
import fetch from "node-fetch";
//
import path from "path";
import fs from "fs";
import https from "https";
//
const __dirname = path.resolve('');
//
function main()
{
    const args = process.argv;
    args.shift();
    args.shift();

    try {
        fs.mkdirSync(path.join(__dirname, "users"));
    }
    catch {}
    for (const a of args)
    {
        const loc = path.resolve(__dirname, a);
        fs.readFile(loc, (err, data) => {
            if (err !== null) {
                console.error(`Error opening file ${a}`);
                console.log(err);
                return;
            }
            const list = data.toString("utf8").split("\n");
            for (const u of list) {
                const user_id = u.split("/")[4];
                fetchProfile(user_id);
            }
        });
    }
}
async function fetchProfile(id)
{
    const url = `https://cheerz.cz/ajax/get-item-feeds?poster_ids[]=${id}`;
    console.log(url);
    const fet = await fetch(url);
    const res = await fet.json();
    const items = res.Result.items;

    if (items.length === 0) {
        console.error(`Unable to download profile @${id} as it does not exist!`);
        return;
    }

    console.log(`Downloading all posts from @${id}`);
    try {
        fs.mkdirSync(path.join(__dirname, "users", `${id} - ${items[0].poster.name}`));
    }
    catch {} // folder exists

    for (const i of items) {
        savePost(i.poster, i.item);
    }
    saveNextList(id, items[items.length-1].item);
}
async function savePost(poster, image)
{
    const { poster_id, name } = poster;
    const { item_id, image_url } = image;
    const loc = `${__dirname}/users/${poster_id} - ${name}/${item_id}.jpg`;
    if (!(fs.existsSync(loc))) {
        https.get(image_url, (response) => {
            response.pipe(fs.createWriteStream(loc));
            console.log(`saved post @${poster_id}/${item_id} from ${image_url}`);
        });
    }
    else {
        console.log(`skipping post @${poster_id}/${item_id} from ${image_url}`);
    }
}
async function saveNextList(poster_id, prev_item)
{
    const { item_id, posted_time } = prev_item;
    const url = `https://cheerz.cz/ajax/get-item-feeds?item_id=${item_id}&posted_time=${posted_time}&timeline=prev&poster_ids%5B%5D=${poster_id}`;
    const fet = await fetch(url);
    const res = await fet.json();
    const items = res.Result.items;
    for (const i of items) {
        savePost(i.poster, i.item);
    }
    if (items.length > 0) {
        saveNextList(poster_id, items[items.length-1].item);
    }
}
//
//
main();
