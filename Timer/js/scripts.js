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

  var hours=form.hours.value;
  var mins=form.mins.value;
  var secs=form.secs.value;

  var tSecs=secs+(60*mins)+(3600*hours);
  var targetMillis=1000*tSecs;

  var targetMillis=120*60*1000;

  var trackLib=lib.tracks;
  var libTotalMillis=0;
  var numTracks=trackLib.length;

  for (var i in trackLib){
    libTotalMillis+=trackLib[i].duration;
  }
  var libMeanMillis=libTotalMillis/trackLib.length;

  var meanDist=targetMillis/libMeanMillis;

  var newTargetMillis=targetMillis;
  while(newTargetMillis>3*libMeanMillis){
    var rand=Math.floor(Math.random()*numTracks);
    var item=trackLib[rand];
    var itemLen=item.duration;
    if(newTargetMillis-itemLen > 2*libMeanMillis){
      newTargetMillis-=itemLen;
      tracksOut.push(item);
    }
  }


  var newMeanDist=newTargetMillis/libMeanMillis;

  for(var i=0; i<newMeanDist.floor-1; i++){
    var suitable=false;
    while(!suitable){
      var rand=Math.floor(Math.random()*numTracks);
      var item=trackLib[rand];
      var itemLen=item.duration;
      if(itemLen>(libMeanMillis-(libMeanMillis/100)) && 
          itemLen < libMeanMillis+(libMeanMilis/100)){
        tracksOut.push(item);
        suitable=true;
        newTargetMillis-=itemLen;
      }
    }
  }

  var found=false;
  var closeNum=1000000000000;
  var closest;
  for (var i in trackLib){
    if(trackLib[i].duration>(newTargetMillis-60) && 
        trackLib[i].duration<newTargetMillis+60){
      tracksOut.push(trackLib[i]);
      found=true;
      newTargetMillis-=trackLib[i].duration;
    }
    else{
      if(newTargetMillis-trackLib[i].duration<closeNum &&
          newTargetMillis-trackLib[i].duration>0 &&
          trackLib[i].duration>1000){
        closeNum=newTargetMillis-trackLib[i];
        closest=trackLib[i];
      }
    }
  }

    if(!found){
      console.log("notfound");
      console.log(closest);
      tracksOut.push(closest);
      newTargetMillis-=closest.duration;
    }


    nameStr=makeName(hours,mins,secs);

    var playlist=new models.Playlist(nameStr);

    for (var i in tracksOut){
      playlist.add(tracksOut[i].uri);
    }

}


function makeName(hours, mins, secs){
    var nameStr="Timer: ";
    if(hours>1){
     nameStr+=hours+" hours";
    }
    else if(hours>0){
      nameStr+=hours+" hour";
    }
    if(mins>0 || secs>0){
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
     nameStr+=secs+" seconds.";
    }
    else if(secs>0){
      nameStr+=secs+" second.";
    }

    return nameStr
}



  




