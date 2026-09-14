const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const scope={window:{}};vm.createContext(scope);
for(const file of ['config','utils','game-config'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',`${file}.js`),'utf8'),scope);
const app=scope.window.EyeTracking;
const faceAt=(x,y)=>app.gameConfig.faces.findIndex(face=>app.utils.pointInPolygon(x,y,face.outline));
test('yellow covers its actual forehead, left cheek, nose and chin as one contour strip',()=>{
  for(const point of [[240,420],[185,650],[180,710],[250,740],[260,880],[290,930]])assert.equal(faceAt(...point),3,point.join(','));
});
test('orange includes the left side of its face and ends at the beginning of the neck',()=>{
  for(const point of [[135,430],[85,650],[105,710],[135,830],[165,885]])assert.equal(faceAt(...point),4,point.join(','));
  assert.equal(faceAt(165,960),-1);
});
test('yellow and orange remain distinct across their shared cheek boundary; other face centers are unchanged',()=>{
  assert.equal(faceAt(150,700),4);assert.equal(faceAt(180,700),3);
  assert.equal(faceAt(860,650),0);assert.equal(faceAt(580,650),1);assert.equal(faceAt(390,650),2);
  assert.equal(faceAt(40,700),-1);
});
