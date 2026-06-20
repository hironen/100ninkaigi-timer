// PWA アイコン生成（外部依存なし・再生成可能）。
// 赤背景に白い時計（10時を指す針）= 10分タイマーを表すアイコン。
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1));}return ~c>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);const t=Buffer.from(type,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);return Buffer.concat([len,t,data,crc]);}
function encodePNG(w,h,rgba){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  const stride=w*4, raw=Buffer.alloc((stride+1)*h);
  for(let y=0;y<h;y++){raw[y*(stride+1)]=0;Buffer.from(rgba.buffer,rgba.byteOffset+y*stride,stride).copy(raw,y*(stride+1)+1);}
  const idat=zlib.deflateSync(raw,{level:9});
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',idat),chunk('IEND',Buffer.alloc(0))]);
}
function distSeg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;let t=l2?((px-ax)*dx+(py-ay)*dy)/l2:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
function renderIcon(size){
  const ss=4,S=size*ss,hi=new Uint8Array(S*S*4);
  const cx=S/2,cy=S/2,R=S*0.30,rHalf=S*0.052/2;
  const mLen=R*0.82,mHalf=S*0.018,mX=cx,mY=cy-mLen;
  const th=300*Math.PI/180,hLen=R*0.52,hHalf=S*0.024,hX=cx+Math.sin(th)*hLen,hY=cy-Math.cos(th)*hLen;
  const dotR=S*0.045;
  const BG=[214,40,40,255],FG=[255,255,255,255];
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const px=x+0.5,py=y+0.5,d=Math.hypot(px-cx,py-cy);
    let col=BG;
    if(Math.abs(d-R)<=rHalf||distSeg(px,py,cx,cy,mX,mY)<=mHalf||distSeg(px,py,cx,cy,hX,hY)<=hHalf||d<=dotR)col=FG;
    const i=(y*S+x)*4;hi[i]=col[0];hi[i+1]=col[1];hi[i+2]=col[2];hi[i+3]=col[3];
  }
  const out=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){let r=0,g=0,b=0,a=0;for(let dy=0;dy<ss;dy++)for(let dx=0;dx<ss;dx++){const i=((y*ss+dy)*S+(x*ss+dx))*4;r+=hi[i];g+=hi[i+1];b+=hi[i+2];a+=hi[i+3];}const n=ss*ss,o=(y*size+x)*4;out[o]=Math.round(r/n);out[o+1]=Math.round(g/n);out[o+2]=Math.round(b/n);out[o+3]=Math.round(a/n);}
  return out;
}
const outDir=path.join(__dirname,'..','icons');
for(const size of [32,180,192,512]){
  const png=encodePNG(size,size,renderIcon(size));
  fs.writeFileSync(path.join(outDir,`icon-${size}.png`),png);
  console.log(`wrote icons/icon-${size}.png (${png.length} bytes)`);
}
