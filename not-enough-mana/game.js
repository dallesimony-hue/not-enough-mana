const crypto=require('node:crypto');
const CARDS=[
{id:'spark',name:'Gnistslag',type:'attack',cost:1,text:'Giv 2 skade.',power:2},
{id:'bolt',name:'Tordenkile',type:'attack',cost:2,text:'Giv 4 skade.',power:4},
{id:'meteor',name:'Meteornedslag',type:'attack',cost:4,text:'Giv 7 skade.',power:7},
{id:'drain',name:'Livstyv',type:'drain',cost:2,text:'Giv 2 skade og helbred 2.',power:2},
{id:'heal',name:'Helende lys',type:'heal',cost:2,text:'Helbred 4 liv.',power:4},
{id:'shield',name:'Runeskjold',type:'shield',cost:1,text:'Få 3 skjold.',power:3},
{id:'ward',name:'Stenmur',type:'shield',cost:2,text:'Få 6 skjold.',power:6},
{id:'curse',name:'Forbandelse',type:'curse',cost:2,text:'Modstanderen mister 2 mana.',power:2},
{id:'siphon',name:'Manatyv',type:'steal',cost:2,text:'Stjæl op til 2 mana.',power:2},
{id:'focus',name:'Meditation',type:'mana',cost:0,text:'Få 2 mana.',power:2},
{id:'surge',name:'Manabølge',type:'mana',cost:1,text:'Få 4 mana.',power:4},
{id:'blast',name:'Vild magi',type:'attack',cost:3,text:'Giv 5 skade.',power:5},
{id:'vamp',name:'Blodritual',type:'trade',cost:0,text:'Mist 2 liv, få 4 mana.',power:4},
{id:'purify',name:'Renselse',type:'heal',cost:1,text:'Helbred 2 liv.',power:2},
{id:'orb',name:'Krystalorb',type:'artifact',cost:2,text:'Permanent: +1 mana ved turstart.',power:1},
{id:'ring',name:'Beskyttelsesring',type:'artifact',cost:2,text:'Permanent: +1 skjold ved turstart.',power:1}
];
const catalogue=Object.fromEntries(CARDS.map(c=>[c.id,c]));
const random=()=>crypto.randomBytes(12).toString('hex');
function deck(){const a=CARDS.flatMap(c=>Array.from({length:c.type==='artifact'?2:5},()=>({...c,instance:random()})));for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function createRoom(code){return {code,phase:'lobby',players:[],turn:0,round:1,pile:[],discard:[],log:[],winner:null,updated:Date.now()}}
function addPlayer(room,name,token){if(room.phase!=='lobby')throw Error('Spillet er allerede startet.');if(room.players.length>=6)throw Error('Rummet er fuldt (maks. 6).');const p={id:random(),token,name:String(name).trim().slice(0,24),connected:true,ready:false,hp:10,mana:0,shield:0,hand:[],artifacts:[],eliminated:false};if(!p.name)throw Error('Skriv et navn.');room.players.push(p);return p}
function note(r,s){r.log.unshift(s);r.log=r.log.slice(0,45);r.updated=Date.now()}
function draw(r,p,n=1){for(let i=0;i<n;i++){if(!r.pile.length){r.pile=r.discard.splice(0);for(let j=r.pile.length-1;j>0;j--){const k=crypto.randomInt(j+1);[r.pile[j],r.pile[k]]=[r.pile[k],r.pile[j]]}}if(r.pile.length)p.hand.push(r.pile.pop())}}
function start(r){if(r.phase!=='lobby')throw Error('Spillet er allerede startet.');if(r.players.length<2)throw Error('Mindst 2 spillere kræves.');if(!r.players.every(p=>p.ready))throw Error('Alle skal være klar.');r.phase='playing';r.pile=deck();r.discard=[];r.turn=0;r.round=1;r.winner=null;r.log=[];for(const p of r.players){Object.assign(p,{hp:10,mana:3,shield:0,hand:[],artifacts:[],eliminated:false});draw(r,p,5)}note(r,'Kampen er startet! '+r.players[0].name+' begynder.')}
function damage(p,n){const absorbed=Math.min(n,p.shield);p.shield-=absorbed;p.hp=Math.max(0,p.hp-(n-absorbed));if(!p.hp)p.eliminated=true;return n-absorbed}
function next(r){const alive=r.players.filter(p=>!p.eliminated);if(alive.length<=1){r.phase='finished';r.winner=alive[0]?.id||null;note(r,alive[0]?alive[0].name+' vandt!':'Ingen overlevede.');return}let i=r.turn;do{i=(i+1)%r.players.length;if(i===0)r.round++}while(r.players[i].eliminated);r.turn=i;const p=r.players[i];p.mana=Math.min(12,p.mana+2+p.artifacts.filter(x=>x==='orb').length);p.shield+=p.artifacts.filter(x=>x==='ring').length;p.potionUsed=false;draw(r,p,1);note(r,'Det er '+p.name+'s tur.')}
function act(r,p,action){if(r.phase!=='playing')throw Error('Spillet er ikke i gang.');if(r.players[r.turn]!==p)throw Error('Det er ikke din tur.');if(p.eliminated)throw Error('Du er elimineret.');if(action.type==='end'){note(r,p.name+' afsluttede sin tur.');next(r);return}
if(action.type==='potion'){if(p.potionUsed)throw Error('Du har allerede drukket en potion denne tur.');p.mana=Math.min(12,p.mana+3);p.potionUsed=true;note(r,p.name+' fik 3 mana fra en potion.');return}
if(action.type!=='play')throw Error('Ukendt handling.');const idx=p.hand.findIndex(c=>c.instance===action.card);if(idx<0)throw Error('Kortet findes ikke på din hånd.');const c=p.hand[idx];if(p.mana<c.cost)throw Error('Ikke nok mana.');const target=r.players.find(q=>q.id===action.target);const targeted=['attack','drain','curse','steal'].includes(c.type);if(targeted&&(!target||target===p||target.eliminated))throw Error('Vælg en levende modstander.');if(c.type==='artifact'&&p.artifacts.includes(c.id))throw Error('Du har allerede denne artefakt.');p.mana-=c.cost;p.hand.splice(idx,1);if(c.type!=='artifact')r.discard.push(c);let msg=p.name+' brugte '+c.name;
switch(c.type){case 'attack':msg+=' på '+target.name+' ('+damage(target,c.power)+' skade)';break;case 'drain':msg+=' på '+target.name+' ('+damage(target,c.power)+' skade)';p.hp=Math.min(10,p.hp+2);break;case 'heal':p.hp=Math.min(10,p.hp+c.power);break;case 'shield':p.shield+=c.power;break;case 'curse':target.mana=Math.max(0,target.mana-c.power);msg+=' på '+target.name;break;case 'steal':{const n=Math.min(c.power,target.mana,12-p.mana);target.mana-=n;p.mana+=n;msg+=' fra '+target.name;break}case 'mana':p.mana=Math.min(12,p.mana+c.power);break;case 'trade':damage(p,2);p.mana=Math.min(12,p.mana+4);break;case 'artifact':p.artifacts.push(c.id);break}note(r,msg+'.');if(p.eliminated||r.players.filter(x=>!x.eliminated).length<=1)next(r)}
function publicState(r,p){return {code:r.code,phase:r.phase,turn:r.players[r.turn]?.id,round:r.round,winner:r.winner,log:r.log,players:r.players.map(q=>({id:q.id,name:q.name,connected:q.connected,ready:q.ready,hp:q.hp,mana:q.mana,shield:q.shield,handCount:q.hand.length,artifacts:q.artifacts,eliminated:q.eliminated})),self:p?{id:p.id,hand:p.hand,potionUsed:!!p.potionUsed}:null}}
module.exports={createRoom,addPlayer,start,act,publicState,next,draw,catalogue};
