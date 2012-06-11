var sp;
var models;
var player;
var lib;

function init(){
   sp = getSpotifyApi(1);
   models = sp.require("sp://import/scripts/api/models");
   player = models.player;
   lib = models.library
}

function evalTime(){
  var tracksOut=[];
  var form=document.getElementById("timeInput");

  var hours=parseInt(form.hours.value);
  var mins=parseInt(form.mins.value);
  var secs=parseInt(form.secs.value);

  var targetSecs=secs+(60*mins)+(3600*hours);
  var targetMillis=targetSecs*1000;
  var trackLib=lib.tracks;
  var numTracks=trackLib.length;

  var libTotalMillis=0;
  for (var i in trackLib){
    libTotalMillis+=trackLib[i].duration;
  }
  var meanTrackLen=libTotalMillis/trackLib.length;

  //While the target time is far away (>5 mean track lengths), pick randomly
  var newTargetMillis=targetMillis;
  while(newTargetMillis>3*meanTrackLen){
    var rand=Math.floor(Math.random()*numTracks);
    var item=trackLib[rand];
    var itemLen=item.duration;
    //Don't go closer than 3 mean track lengths
    if(newTargetMillis-itemLen >2*meanTrackLen){
      newTargetMillis-=itemLen;
      tracksOut.push(item);
    }
  }


  //Number of mean track lengths left in unallocated time
  var newMeanDist=newTargetMillis/meanTrackLen;

  //If n trackLengths remaining, pick n-1 tracks to add
  for(var i=0; i<newMeanDist.floor-1; i++){
    var suitable=false;
    //Keep picking randomly until we get one +/- 5% of mean
    while(!suitable){
      var rand=Math.floor(Math.random()*numTracks);
      var item=trackLib[rand];
      var itemLen=item.duration;
      if(itemLen>(libMeanMillis-(libMeanMillis/20)) && 
          itemLen < libMeanMillis+(libMeanMillis/20)){
        tracksOut.push(item);
        suitable=true;
        newTargetMillis-=itemLen;
      }
    }
  }

  //Loop through entire library to find final track closest to target
  var found=false;
  var closeNum=newTargetMillis;
  var bestTrack;
  for (var i in trackLib){
    var thisTrack=trackLib[i];
    //Is it within a second?
    if(thisTrack.duration>(newTargetMillis+1000) && 
        thisTrack.duration<newTargetMillis+1000){

      found=true;
      tracksOut.push(thisTrack);
      newTargetMillis-=thisTrack.duration;
    }
    //If not, it might still be the closest match
    //Some invalid tracks have -ve length, check >0
    else{
      if(newTargetMillis-thisTrack.duration < closeNum &&
          newTargetMillis-thisTrack.duration > 0 &&
          thisTrack.duration > 0){

        closeNum=newTargetMillis-thisTrack.duration;
        bestTrack=thisTrack;
      }
    }
  }

  if(!found){
    tracksOut.push(bestTrack);
  }

  nameStr=makeName(hours,mins,secs);
  makePlaylist(nameStr, tracksOut);
}

function makePlaylist(name, tracks){
  var playlist=new models.Playlist(nameStr);

  for (var i in tracks){
    playlist.add(tracks[i].uri);
  }
}

//There has GOT to be a better way to do this... Stop slacking and work it out
function makeName(hours, mins, secs){
    var nameStr="Timer: ";
    if(hours>1){
     nameStr+=hours+" hours";
    }
    else if(hours>0){
      nameStr+=hours+" hour";
    }
    if(hours>0 && (mins>0 || secs>0)){
      nameStr+=", ";
    }
    if(mins>1){
     nameStr+=mins+" minutes";
    }
    else if(mins>0){
      nameStr+=mins+" minute";
    }
    if(secs>0){
      nameStr+=", ";
    }
    if(secs>1){
     nameStr+=secs+" seconds";
    }
    else if(secs>0){
      nameStr+=secs+" second";
    }
    nameStr+=".";

    return nameStr
}
