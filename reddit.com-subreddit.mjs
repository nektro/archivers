// @author Meghan#2032 <https://nektro.net/>
//
//
import fetch from "node-fetch";
import promisify from "js-promisify";
//
import path from "path";
import fs from "fs";
//
const __dirname = path.resolve("");
const valid_extentions = ["png","jpg","jpeg","gif","mp4","webp","webm","gifv"];
//
async function main() {
    const args = process.argv;
    args.shift();
    args.shift();
    if (args.length === 0) return;
    //
    return fetch_subreddit(args[0])
    .then(() => console.log("done!"));
}
async function fetch_subreddit(sub, after) {
    if (after !== undefined) console.log(`Get: ${after}`)
    const folder = `reddit_sub_${sub}`;
    await promisify(fs.mkdir, [folder]).catch(noop);
    const a = await fetch(`https://old.reddit.com/r/${sub}/.json?show=all` + (after === undefined ? "" : `&after=${after}`)).then(x => x.json());
    const b = a.data;
    if (b.children.length === 0) return;
    //
    return Promise.all(b.children.map(x => fetch_post(folder, x.data)))
    .then(x => (b.after !== null) ? fetch_subreddit(sub, b.after) : noop())
}
async function noop() {
    return Promise.resolve();
}
async function fetch_post(folder, post_data) {
    if (post_data.is_self) {
        const local_file = `${post_data.id}.txt`;
        const file_path = path.join(__dirname, folder, local_file);
        return promisify(fs.access, [file_path, fs.constants.F_OK])
        .catch(x => Promise.resolve()
            .then(x => promisify(fs.writeFile, [file_path, post_data.selftext]))
            .then(x => console.log(`[download] ${local_file}`))
        );
    }
    else {
        const url = post_data.url;
        const remote_file = url.split("/").reverse()[0]
        const extension = remote_file.split(".").reverse()[0];
        if (!(valid_extentions.includes(extension))) return;
        const local_file = `${post_data.id}-${remote_file}`;
        const file_path = path.join(__dirname, folder, local_file);
        return promisify(fs.access, [file_path, fs.constants.F_OK])
        .catch(x => Promise.resolve()
            .then(x => fetch(url))
            .then(x => x.buffer())
            .then(x => promisify(fs.writeFile, [file_path, x]))
            .then(x => console.log(`Saved post: ${local_file}`))
        );
    }
}
//
//
main();
