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
    return fetch_subreddit(args[0]);
}
async function fetch_subreddit(sub) {
    const folder = `reddit_sub_${sub}`;
    await promisify(fs.mkdir, [folder]).catch(noop);
    const a = await fetch(`https://old.reddit.com/r/${sub}/.json`).then(x => x.json());
    const b = a.data;
    if (b.children.length === 0) return;
    //
    return Promise.all(b.children.map(x => fetch_post(folder, x.data)))
    .then(x => (b.after !== null) ? fetch_subreddit_after(sub, folder, b.after) : noop())
    .then(x => console.log("done!"));
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
            .then(x => console.log(`Saved post: ${local_file}`))
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
async function fetch_subreddit_after(sub, folder, after) {
    console.log(`Grabbing posts after: ${after}`)
    const a = await fetch(`https://old.reddit.com/r/${sub}/.json?after=${after}`).then(x => x.json());
    const b = a.data;
    if (b.children.length === 0) return;
    //
    await Promise.all(b.children.map(x => fetch_post(folder, x.data)));
    return (b.after !== null) ? fetch_subreddit_after(sub, folder, b.after) : noop();
}
//
//
main();
