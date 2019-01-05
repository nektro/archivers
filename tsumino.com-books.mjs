// @author Meghan#2032 <https://nektro.net/> <https://paypal.me/nektro>
//
//
import fetch from "node-fetch";
import promisify from "js-promisify";
import pdfkit from "pdfkit";
//
import path from "path";
import fs from "fs";
//
const __dirname = path.resolve("");
//
if (!('replaceAll' in String.prototype)) {
    String.prototype.replaceAll = function(search, replacement) {
        return this.replace(new RegExp(search, 'g'), replacement);
    };
}
//
//
async function main() {
    const args = process.argv;
    args.shift();
    args.shift();
    if (args.length === 0) return;
    //
    return Promise.resolve()
    .then(() => promisify(fs.mkdir, [path.resolve(__dirname, "tsumino")])).catch(noop)
    .then(() => promisify(fs.mkdir, [path.resolve(__dirname, "tsumino", "pdf")])).catch(noop)
    .finally(() => fetch_book(parseInt(args[0])));
}
async function noop() {
}
async function fetch_book(n) {
    const a = new URLSearchParams();
    a.append("q", n);
    const b = await fetch("http://www.tsumino.com/Read/Load", {
        method: "POST",
        body: a,
    });
    console.log(b.status);
    if (b.status !== 200) return;
    console.log(`Saving tsumino.com book ${n}`)
    const c = await b.json();
    const d = c.reader_page_urls;
    const pages_path = path.resolve(__dirname, "tsumino", n.toString());
    return promisify(fs.mkdir, [pages_path])
    .then(async() => {
        for (let i = 0; i < d.length; i++) {
            const v = d[i];
            await download_book_page(n,v,i,d.length.toString().length);
        }
        console.log("Converting to .pdf...");
        const doc = new pdfkit({ autoFirstPage:false });
        const pdf_path = path.resolve(__dirname, "tsumino", "pdf", `${n}.pdf`);
        doc.pipe(fs.createWriteStream(pdf_path));
        const fsl = fs.readdirSync(pages_path);
        for (let i = 0; i < fsl.length; i++) {
            const e = fsl[i];
            doc.addPage();
            doc.image(path.resolve(pages_path, e), 0, 0, { fit: [doc.page.width, doc.page.height] });
        }
        doc.save();
        doc.end();
        console.log(`Done!`);
    })
    .catch(() => {
        console.log(`Book ${n} was already saved!`);
        return;
    });
}
async function download_book_page(x, obj_id, n, mx) {
    const obj_id_safe = obj_id.replaceAll("=","").replaceAll("\\+","-").replaceAll("\/","_");
    const name = `${n.toString().padStart(mx,"0")} - ${obj_id_safe}.jpg`;
    const url = `http://www.tsumino.com/Image/Object?name=${encodeURIComponent(obj_id)}`;
    const file_path = path.resolve(__dirname, "tsumino", x.toString(), name)
    //
    // if (n > 0) await fetch(`http://www.tsumino.com/Read/Process/${x}/${n}`);
    return promisify(fs.access, [file_path, fs.constants.F_OK])
    .catch(w => Promise.resolve()
        .then(w => fetch(url))
        .then(w => w.buffer())
        .then(w => promisify(fs.writeFile, [file_path, w]))
        .then(w => console.log(`Saved post: ${x} / ${name}`))
    );
}
//
//
main();
