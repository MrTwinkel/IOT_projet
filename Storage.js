
const { firestore } = require("firebase-admin");
var admin = require("firebase-admin");

var serviceAccount = require("./credential.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


var db = firestore();

module.exports.registerSensor = async function(adress){
const docRef = db.collection('sensors').doc(adress);

const sensor = {
adress : adress,
date: Date.now(),
}

await docRef.get().then((snapshoteDoc) =>{

  if(!snapshoteDoc.exists)
    docRef.set(sensor);
  else
    docRef.update(sensor);
  
})

}

module.exports.registerSample = async function(adress, sample){
  const docRef = db.collection('sensors').doc(adress)
  .collection('sample').doc(Date.now().toString());

  var ladate= Date.now();
  var niveau = "";
  if (sample <= 150) {
    niveau = "Water Level: Empty";
  }
  else if (sample > 150 && sample <= 620) {
    niveau = "Water Level: Low";
  }
  else if (sample > 620 && sample <= 790) {
    niveau = "Water Level: Medium";
  }
  else if (sample > 800) {
    niveau = "Water Level: High";
  }
  //ladate = ladate.getDate()+"/"+(ladate.getMonth()+1)+"/"+ladate.getFullYear();
  const data = {
    value: sample,
    niveau: niveau,
    date: ladate
  }
  await docRef.set(data);
  console.log(data);
}

module.exports.ListSensors = function (){
  const docRef = db.collection('sensors');
  return docRef.get()

}