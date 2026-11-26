// Generate clearly labelled synthetic narration from the checked-in educational scripts.
// Run on Linux with Node.js, espeak and ffmpeg installed.
const fs=require("node:fs"),vm=require("node:vm"),cp=require("node:child_process"),path=require("node:path");
const root=path.resolve(__dirname,".."),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,"data/heritage.js"),"utf8"),ctx);
const out=path.join(root,"assets/audio");fs.mkdirSync(out,{recursive:true});
for(const [key,rec] of Object.entries(ctx.window.HERITAGE_RECORDS)){
 const wav=path.join(out,key+".wav"),mp3=path.join(out,key+".mp3");
 cp.execFileSync("espeak",["-v","en-gb","-s","150","-w",wav,rec.story+" "+rec.symbolism],{stdio:"inherit"});
 cp.execFileSync("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",wav,"-codec:a","libmp3lame","-b:a","64k",mp3],{stdio:"inherit"});
 fs.unlinkSync(wav);if(fs.statSync(mp3).size<1000)throw Error("Audio generation failed: "+key);
 console.log(key,fs.statSync(mp3).size,"bytes");
}
