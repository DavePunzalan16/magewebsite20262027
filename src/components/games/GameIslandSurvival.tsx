"use client";
import { useEffect, useRef, useCallback } from "react";
import { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void> }
const W = 700, H = 520, TW = 28, TH = 20, TS = 25, FPS = 60;
type Tile = 0|1|2|3|4|5|6|7;

function genMap(): Tile[][] {
  const m: Tile[][] = Array.from({length:TH}, ()=>Array(TW).fill(2));
  // water borders + lakes
  for(let y=0;y<TH;y++) for(let x=0;x<TW;x++){
    if(x===0||y===0||x===TW-1||y===TH-1) m[y][x]=0;
    else if(Math.random()<0.06) m[y][x]=0;
  }
  // sand near water
  for(let y=1;y<TH-1;y++) for(let x=1;x<TW-1;x++){
    if(m[y][x]===2){
      const nb=[m[y-1]?.[x],m[y+1]?.[x],m[y][x-1],m[y][x+1]];
      if(nb.includes(0)&&Math.random()<0.7) m[y][x]=1;
    }
  }
  // resources
  for(let y=2;y<TH-2;y++) for(let x=2;x<TW-2;x++){
    if(m[y][x]===2){
      const r=Math.random();
      if(r<0.1) m[y][x]=3;
      else if(r<0.15) m[y][x]=4;
      else if(r<0.19) m[y][x]=5;
    }
  }
  m[10][14]=2; // player spawn clear
  return m;
}

interface Animal { x:number;y:number;hp:number;maxHp:number;type:'rabbit'|'boar';vx:number;vy:number;timer:number;dead:boolean;dropTimer:number }
interface Enemy { x:number;y:number;hp:number }
interface Placed { x:number;y:number;type:6|7|8 } // 8=shelter

function spawnAnimals(): Animal[] {
  const a: Animal[]=[];
  for(let i=0;i<2;i++) a.push({x:Math.random()*600+50,y:Math.random()*400+50,hp:15,maxHp:15,type:'rabbit',vx:0,vy:0,timer:0,dead:false,dropTimer:0});
  for(let i=0;i<2;i++) a.push({x:Math.random()*600+50,y:Math.random()*400+50,hp:40,maxHp:40,type:'boar',vx:0,vy:0,timer:0,dead:false,dropTimer:0});
  return a;
}

export default function GameIslandSurvival({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<'start'|'playing'|'win'|'dead'>('start');
  const startTimeRef = useRef(0);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let state = stateRef.current;
    let map = genMap();
    let px=14*TS+12, py=10*TS+12, facing={x:1,y:0};
    let hp=100,hunger=100,thirst=100,stamina=100;
    let inv={wood:0,stone:0,berry:0,rawMeat:0,cookedMeat:0,fish:0};
    let crafted={axe:false,sword:false,rod:false};
    let placed: Placed[]=[];
    let animals=spawnAnimals(), enemies: Enemy[]=[];
    let day=1, dayTimer=0, isNight=false, kills=0;
    let craftMenu=false, gathering=0, gatherTarget:{x:number,y:number}|null=null;
    let atkCd=0, keys:Record<string,boolean>={};
    let respawns: {x:number,y:number,type:Tile,timer:number}[]=[];
    let animId=0;

    const kd=(e:KeyboardEvent)=>{keys[e.key.toLowerCase()]=true; e.preventDefault()};
    const ku=(e:KeyboardEvent)=>{keys[e.key.toLowerCase()]=false;
      if(e.key.toLowerCase()==='c') craftMenu=!craftMenu;
      if(e.key.toLowerCase()==='e') eat();
      if(e.key.toLowerCase()==='b') build();
      if(e.key.toLowerCase()==='f') fish();
      if(craftMenu&&e.key>='1'&&e.key<='7') craft(+e.key);
    };
    const mc=()=>{attack()};
    canvas.addEventListener('mousedown',mc);
    window.addEventListener('keydown',kd);
    window.addEventListener('keyup',ku);

    function tileAt(px2:number,py2:number):Tile{ const tx=Math.floor(px2/TS),ty=Math.floor(py2/TS); return (tx>=0&&tx<TW&&ty>=0&&ty<TH)?map[ty][tx]:0; }
    function inWater():boolean{ return tileAt(px,py)===0; }

    function eat(){
      if(inv.cookedMeat>0){inv.cookedMeat--;hunger=Math.min(100,hunger+30)}
      else if(inv.fish>0){inv.fish--;hunger=Math.min(100,hunger+20)}
      else if(inv.berry>0){inv.berry--;hunger=Math.min(100,hunger+15)}
      else if(inv.rawMeat>0){inv.rawMeat--;hunger=Math.min(100,hunger+8);hp=Math.max(0,hp-5)}
      // cook at fire
      if(inv.rawMeat>0){
        const near=placed.find(p=>p.type===6&&Math.abs(p.x*TS-px)<40&&Math.abs(p.y*TS-py)<40);
        if(near){inv.rawMeat--;inv.cookedMeat++;hunger=Math.min(100,hunger+30)}
      }
      // sleep at shelter
      const shelter=placed.find(p=>p.type===8&&Math.abs(p.x*TS-px)<40&&Math.abs(p.y*TS-py)<40);
      if(shelter&&isNight){isNight=false;dayTimer=0;day++;enemies=[];}
    }

    function build(){
      const tx=Math.floor(px/TS),ty=Math.floor(py/TS);
      if(inv.wood>=5&&inv.stone>=3&&!placed.find(p=>p.x===tx&&p.y===ty)){
        if(keys['6']||(!crafted.axe&&!crafted.sword)){inv.wood-=5;inv.stone-=3;placed.push({x:tx,y:ty,type:6});return;}
      }
      if(inv.wood>=8&&inv.stone>=5&&!placed.find(p=>p.x===tx&&p.y===ty)){inv.wood-=8;inv.stone-=5;placed.push({x:tx,y:ty,type:7});return;}
      if(inv.wood>=10&&inv.stone>=6&&!placed.find(p=>p.x===tx&&p.y===ty)){inv.wood-=10;inv.stone-=6;placed.push({x:tx,y:ty,type:8});return;}
    }

    function fish(){
      if(!crafted.rod) return;
      const tx=Math.floor(px/TS),ty=Math.floor(py/TS);
      const nearWater=[map[ty-1]?.[tx],map[ty+1]?.[tx],map[ty]?.[tx-1],map[ty]?.[tx+1]].includes(0);
      if(nearWater&&Math.random()<0.3) inv.fish++;
    }

    function craft(n:number){
      if(n===1&&inv.wood>=3&&inv.stone>=2&&!crafted.axe){inv.wood-=3;inv.stone-=2;crafted.axe=true;}
      if(n===2&&inv.wood>=5&&inv.stone>=4&&!crafted.sword){inv.wood-=5;inv.stone-=4;crafted.sword=true;}
      if(n===3&&inv.wood>=5&&inv.stone>=3){inv.wood-=5;inv.stone-=3;placed.push({x:Math.floor(px/TS),y:Math.floor(py/TS),type:6});}
      if(n===4&&inv.wood>=4&&inv.stone>=2&&!crafted.rod){inv.wood-=4;inv.stone-=2;crafted.rod=true;}
      if(n===5&&inv.wood>=8&&inv.stone>=5){inv.wood-=8;inv.stone-=5;placed.push({x:Math.floor(px/TS),y:Math.floor(py/TS),type:7});}
      if(n===6&&inv.wood>=15&&inv.stone>=8&&placed.find(p=>p.type===7)){
        inv.wood-=15;inv.stone-=8;
        stateRef.current='win'; state='win';
      }
      if(n===7&&inv.wood>=10&&inv.stone>=6){inv.wood-=10;inv.stone-=6;placed.push({x:Math.floor(px/TS),y:Math.floor(py/TS),type:8});}
    }

    function attack(){
      if(atkCd>0) return;
      const dmg=crafted.sword?25:crafted.axe?15:5;
      const cd=crafted.sword?18:crafted.axe?24:30;
      atkCd=cd; stamina=Math.max(0,stamina-8);
      animals.forEach(a=>{
        if(a.dead) return;
        const dx=a.x-px,dy=a.y-py,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<40){a.hp-=dmg;if(a.hp<=0){a.dead=true;a.dropTimer=180;inv.rawMeat++;kills++;}}
      });
      enemies.forEach((e,i)=>{
        const dx=e.x-px,dy=e.y-py,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<40){e.hp-=dmg;if(e.hp<=0){enemies.splice(i,1);kills++;}}
      });
    }

    function update(){
      if(state!=='playing') return;
      // movement
      let speed=inWater()?1:2; let moved=false;
      if(keys['w']||keys['arrowup']){py-=speed;facing={x:0,y:-1};moved=true;}
      if(keys['s']||keys['arrowdown']){py+=speed;facing={x:0,y:1};moved=true;}
      if(keys['a']||keys['arrowleft']){px-=speed;facing={x:-1,y:0};moved=true;}
      if(keys['d']||keys['arrowright']){px+=speed;facing={x:1,y:0};moved=true;}
      if(keys[' ']) attack();
      px=Math.max(5,Math.min(W-5,px)); py=Math.max(5,Math.min(H-5,py));

      // stats
      hunger=Math.max(0,hunger-0.015); thirst=Math.max(0,thirst-0.02);
      if(inWater()){thirst=Math.min(100,thirst+0.1);stamina=Math.max(0,stamina-0.05);}
      if(!moved&&!inWater()) stamina=Math.min(100,stamina+0.15);
      if(hunger===0||thirst===0) hp-=0.04;
      if(atkCd>0) atkCd--;
      if(hp<=0){stateRef.current='dead';state='dead';}

      // gathering
      const ct=tileAt(px,py);
      if(ct>=3&&ct<=5){
        if(!gatherTarget||gatherTarget.x!==Math.floor(px/TS)||gatherTarget.y!==Math.floor(py/TS)){
          gatherTarget={x:Math.floor(px/TS),y:Math.floor(py/TS)};gathering=0;
        }
        gathering++;
        if(gathering>=60){
          if(ct===3) inv.wood++;
          if(ct===4) inv.stone++;
          if(ct===5) inv.berry++;
          map[gatherTarget.y][gatherTarget.x]=2;
          respawns.push({x:gatherTarget.x,y:gatherTarget.y,type:ct as Tile,timer:1500});
          gathering=0;gatherTarget=null;
        }
      } else { gathering=0;gatherTarget=null; }

      // respawns
      respawns.forEach((r,i)=>{r.timer--;if(r.timer<=0){map[r.y][r.x]=r.type;respawns.splice(i,1);}});

      // day/night
      dayTimer++;
      if(dayTimer>=5400){dayTimer=0;isNight=!isNight;if(!isNight){day++;enemies=[];}
        else{ for(let i=0;i<2+Math.floor(Math.random()*3);i++) enemies.push({x:Math.random()*W,y:Math.random()*H,hp:30}); }
      }

      // animals AI
      animals.forEach(a=>{
        if(a.dead){a.dropTimer--;return;}
        a.timer--;
        const dx=px-a.x,dy=py-a.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(a.type==='rabbit'&&dist<80){a.vx=-dx/dist*1.5;a.vy=-dy/dist*1.5;}
        else if(a.type==='boar'&&dist<60){a.vx=dx/dist*1.2;a.vy=dy/dist*1.2;
          if(dist<15){hp-=0.08;}
        }
        else if(a.timer<=0){a.vx=(Math.random()-0.5)*1;a.vy=(Math.random()-0.5)*1;a.timer=60+Math.random()*60;}
        a.x+=a.vx;a.y+=a.vy;
        a.x=Math.max(25,Math.min(W-25,a.x));a.y=Math.max(25,Math.min(H-25,a.y));
      });

      // enemies AI
      enemies.forEach(e=>{
        const dx=px-e.x,dy=py-e.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist>0){e.x+=dx/dist*1;e.y+=dy/dist*1;}
        if(dist<15) hp-=0.13;
      });
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      // tiles
      for(let y=0;y<TH;y++) for(let x=0;x<TW;x++){
        const t=map[y][x]; const dx=x*TS,dy=y*TS;
        if(t===0) ctx.fillStyle='#1a6b8a';
        else if(t===1) ctx.fillStyle='#c2a060';
        else ctx.fillStyle='#2d6b2d';
        ctx.fillRect(dx,dy,TS,TS);
        if(t===3){ctx.fillStyle='#1a4a1a';ctx.beginPath();ctx.arc(dx+12,dy+12,8,0,Math.PI*2);ctx.fill();}
        if(t===4){ctx.fillStyle='#777';ctx.beginPath();ctx.arc(dx+12,dy+12,7,0,Math.PI*2);ctx.fill();}
        if(t===5){ctx.fillStyle='#ff69b4';ctx.beginPath();ctx.arc(dx+12,dy+10,5,0,Math.PI*2);ctx.fill();}
      }
      // placed structures
      placed.forEach(p=>{
        const dx=p.x*TS,dy=p.y*TS;
        if(p.type===6){ctx.fillStyle='#ff4500';ctx.beginPath();ctx.arc(dx+12,dy+12,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff8c00';ctx.beginPath();ctx.arc(dx+12,dy+8,5,0,Math.PI*2);ctx.fill();}
        if(p.type===7){ctx.fillStyle='#8B4513';ctx.fillRect(dx+3,dy+3,19,19);ctx.strokeStyle='#654321';ctx.strokeRect(dx+3,dy+3,19,19);ctx.beginPath();ctx.moveTo(dx+3,dy+12);ctx.lineTo(dx+22,dy+12);ctx.stroke();}
        if(p.type===8){ctx.fillStyle='#556B2F';ctx.beginPath();ctx.moveTo(dx+12,dy+2);ctx.lineTo(dx+22,dy+20);ctx.lineTo(dx+2,dy+20);ctx.closePath();ctx.fill();}
      });

      // animals
      animals.forEach(a=>{
        if(a.dead){if(a.dropTimer>0){ctx.fillStyle='#8B0000';ctx.beginPath();ctx.arc(a.x,a.y,4,0,Math.PI*2);ctx.fill();}return;}
        ctx.fillStyle=a.type==='rabbit'?'#8B6914':'#4a2f0a';
        ctx.beginPath();ctx.arc(a.x,a.y,a.type==='rabbit'?6:10,0,Math.PI*2);ctx.fill();
      });
      // enemies
      enemies.forEach(e=>{
        ctx.fillStyle='#cc0000';ctx.beginPath();ctx.arc(e.x,e.y,8,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ff0000';ctx.fillRect(e.x-3,e.y-3,2,2);ctx.fillRect(e.x+1,e.y-3,2,2);
      });
      // player
      ctx.fillStyle='#22cc44';ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px-3,py-2,2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+3,py-2,2,0,Math.PI*2);ctx.fill();
      // attack indicator
      if(atkCd>20){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px+facing.x*20,py+facing.y*20,12,0,Math.PI*2);ctx.stroke();}
      // gathering bar
      if(gathering>0){ctx.fillStyle='#333';ctx.fillRect(px-15,py-18,30,4);ctx.fillStyle='#0f0';ctx.fillRect(px-15,py-18,30*(gathering/60),4);}
      // night overlay
      if(isNight){ctx.fillStyle='rgba(0,0,30,0.55)';ctx.fillRect(0,0,W,H);}

      // HUD bars
      const drawBar=(y2:number,val:number,color:string,label:string)=>{
        ctx.fillStyle='#222';ctx.fillRect(8,y2,102,12);ctx.fillStyle=color;ctx.fillRect(9,y2+1,val,10);
        ctx.fillStyle='#fff';ctx.font='9px sans-serif';ctx.fillText(label+' '+Math.floor(val),12,y2+10);
      };
      drawBar(8,hp,'#cc3333','HP');drawBar(22,hunger,'#cc8833','HGR');drawBar(36,thirst,'#3388cc','THR');drawBar(50,stamina,'#cccc33','STM');

      // top right
      ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='right';
      ctx.fillText(`Day ${day}  ${isNight?'🌙':'☀️'}`,W-10,18);
      ctx.fillText(crafted.sword?'⚔️Sword':crafted.axe?'🪓Axe':'👊Fists',W-10,34);
      ctx.textAlign='left';

      // bottom inventory
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,H-28,W,28);
      ctx.fillStyle='#fff';ctx.font='11px sans-serif';
      const items=[`🪵${inv.wood}`,`🪨${inv.stone}`,`🫐${inv.berry}`,`🥩${inv.rawMeat}`,`🍖${inv.cookedMeat}`,`🐟${inv.fish}`];
      items.forEach((t,i)=>ctx.fillText(t,10+i*80,H-10));

      // controls hint
      ctx.fillStyle='#aaa';ctx.font='9px sans-serif';ctx.textAlign='right';
      ctx.fillText('WASD:move Space:attack C:craft E:eat B:build F:fish',W-8,H-10);
      ctx.textAlign='left';

      // craft menu
      if(craftMenu){
        ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(150,80,400,320);
        ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.fillText('⚒️ CRAFTING (1-7)',170,110);
        ctx.font='13px sans-serif';
        const recipes=[
          `1. Axe (3🪵+2🪨)${crafted.axe?' ✅':''}`,`2. Sword (5🪵+4🪨)${crafted.sword?' ✅':''}`,
          `3. Campfire (5🪵+3🪨)`,`4. Fishing Rod (4🪵+2🪨)${crafted.rod?' ✅':''}`,
          `5. Craft Table (8🪵+5🪨)`,`6. RAFT (15🪵+8🪨+table) 🏆`,`7. Shelter (10🪵+6🪨)`
        ];
        recipes.forEach((r,i)=>{ctx.fillStyle=i===5?'#ffd700':'#ddd';ctx.fillText(r,170,135+i*28);});
        ctx.fillStyle='#888';ctx.fillText('Press C to close',170,340);
      }
    }

    function drawStart(){
      ctx.fillStyle='#1a3a2a';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff';ctx.font='bold 36px sans-serif';ctx.textAlign='center';
      ctx.fillText('🏝️ Island Survival',W/2,120);
      ctx.font='16px sans-serif';ctx.fillStyle='#ccc';
      const lines=['Gather resources, craft tools, survive the nights!','','WASD: Move | Space/Click: Attack','E: Eat/Interact | C: Craft menu (1-7)',
        'B: Build structure | F: Fish (need rod+water)','','🎯 Goal: Craft a RAFT to escape!','','Beware: enemies come at night 🌙'];
      lines.forEach((l,i)=>ctx.fillText(l,W/2,170+i*28));
      ctx.fillStyle='#22cc44';ctx.fillRect(W/2-60,420,120,40);
      ctx.fillStyle='#000';ctx.font='bold 18px sans-serif';ctx.fillText('START',W/2,446);
      ctx.textAlign='left';
    }

    function drawEnd(won:boolean){
      const score=day*100+kills*20+(inv.wood+inv.stone+inv.berry+inv.rawMeat+inv.cookedMeat+inv.fish)*5;
      ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle=won?'#ffd700':'#cc3333';ctx.font='bold 32px sans-serif';ctx.textAlign='center';
      ctx.fillText(won?'🎉 You Escaped!':'💀 You Died',W/2,180);
      ctx.fillStyle='#fff';ctx.font='20px sans-serif';
      ctx.fillText(`Score: ${score}`,W/2,230);
      ctx.fillText(`Days: ${day} | Kills: ${kills}`,W/2,260);
      ctx.fillStyle='#22cc44';ctx.fillRect(W/2-60,310,120,40);
      ctx.fillStyle='#000';ctx.font='bold 16px sans-serif';ctx.fillText(won?'PLAY AGAIN':'RETRY',W/2,336);
      ctx.textAlign='left';

      // submit result
      const dur=Math.floor((Date.now()-startTimeRef.current)/1000);
      onComplete({score,won,durationSeconds:dur});
    }

    function clickHandler(e:MouseEvent){
      if(!canvas) return;
      const rect=canvas.getBoundingClientRect();
      const cx=e.clientX-rect.left,cy=e.clientY-rect.top;
      if(state==='start'&&cx>W/2-60&&cx<W/2+60&&cy>420&&cy<460){
        stateRef.current='playing';state='playing';startTimeRef.current=Date.now();
        map=genMap();px=14*TS+12;py=10*TS+12;hp=100;hunger=100;thirst=100;stamina=100;
        inv={wood:0,stone:0,berry:0,rawMeat:0,cookedMeat:0,fish:0};
        crafted={axe:false,sword:false,rod:false};placed=[];animals=spawnAnimals();enemies=[];
        day=1;dayTimer=0;isNight=false;kills=0;craftMenu=false;gathering=0;respawns=[];
      }
      if((state==='win'||state==='dead')&&cx>W/2-60&&cx<W/2+60&&cy>310&&cy<350){
        stateRef.current='start';state='start';
      }
    }
    canvas.addEventListener('click',clickHandler);

    function frame(){
      if(state==='playing'){update();draw();}
      else if(state==='start') drawStart();
      else drawEnd(state==='win');
      animId=requestAnimationFrame(frame);
    }
    animId=requestAnimationFrame(frame);

    return()=>{
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown',kd);
      window.removeEventListener('keyup',ku);
      canvas.removeEventListener('mousedown',mc);
      canvas.removeEventListener('click',clickHandler);
    };
  }, [onComplete]);

  useEffect(()=>{const cleanup=gameLoop();return()=>{if(cleanup)cleanup();};},[gameLoop]);

  return <canvas ref={canvasRef} width={W} height={H} style={{background:'#111',borderRadius:8,display:'block',margin:'0 auto'}} tabIndex={0}/>;
}
