//TODO DISABLE REPEATS

var sp;
var models;
var player;
var lib;
var views;
var restrictedLib;


$(function(){
	var drop = document.querySelector('.dropField');
	drop.addEventListener('dragenter', handleDragEnter, false);
	drop.addEventListener('dragover', handleDragOver, false);
	drop.addEventListener('dragleave', handleDragLeave, false);
	drop.addEventListener('drop', handleDrop, false);

	function handleDragEnter(e) {
		this.style.background = '#444444';
	}
	
	function handleDragOver(e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
		return false;
	}

	function handleDragLeave(e) {
		this.style.background = '#333333';
	}
	
	function handleDrop(e) {
		this.style.background = '#444444';
		var uri = e.dataTransfer.getData('Text');
    restrictedLib=models.Playlist.fromURI(uri);
    this.innerHTML = "Using playlist: "+restrictedLib.name
		}
	}
  );

$(function(){
  $("form input").change(function(){

    var form=document.getElementById("timeInput");
    $(form.submitBtn).attr("disabled",true);

    if(form.hours.value || form.mins.value || form.secs.value){
      $(form.submitBtn).attr("disabled",false);
    }

  });
});

function init(){
   sp = getSpotifyApi(1);
   models = sp.require("sp://import/scripts/api/models");
   views = sp.require("sp://import/scripts/api/views");
   player = models.player;
   lib = models.library;
}

function sanitiseInp(){
  //TODO Jquery this...
  var form=document.getElementById("timeInput");

  if(!form.hours.value){
    form.hours.value=0;
  }
  if(!form.mins.value){
    form.mins.value=0;
  }
  if(!form.secs.value){
    form.secs.value=0;
  }
  
}


function evalTime(){

  sanitiseInp();

  var tracksOut=[];
  var form=document.getElementById("timeInput");

  var hours=parseInt(form.hours.value);
  var mins=parseInt(form.mins.value);
  var secs=parseInt(form.secs.value);

  var targetSecs=secs+(60*mins)+(3600*hours);
  var targetMillis=targetSecs*1000;

  if(restrictedLib){
    trackLib=restrictedLib.tracks;
  }
  else{
    trackLib=lib.tracks;
  }

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
    if((newTargetMillis-itemLen >2*meanTrackLen)){
      newTargetMillis-=itemLen;
      tracksOut.push(item);
    }
  }

  //Number of mean track lengths left in unallocated time
  var newMeanDist=Math.floor(newTargetMillis/meanTrackLen);

  //If n trackLengths remaining, pick n-1 tracks to add
  for(var i=0; i<newMeanDist-1; i++){
    var suitable=false;
    //Keep picking randomly until we get one +/- 5% of mean
    while(!suitable){
      var rand=Math.floor(Math.random()*numTracks);
      var item=trackLib[rand];
      var itemLen=item.duration;
      if(itemLen>(meanTrackLen-(meanTrackLen/20)) && 
          itemLen < meanTrackLen+(meanTrackLen/20)){
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
      closeNum=0;
      tracksOut.push(thisTrack);
      newTargetMillis-=thisTrack.duration;
    }
    //If not, it might still be the closest match
    //Some invalid tracks have -ve length, check >0
    else{
      if(Math.abs(newTargetMillis-thisTrack.duration) < closeNum &&
          thisTrack.duration > 0 &&
          tracksOut.indexOf(thisTrack)==-1){

        closeNum=Math.abs(newTargetMillis-thisTrack.duration);
        bestTrack=thisTrack;
      }
    }
  }

  if(!found){
    tracksOut.push(bestTrack);
  }

  accuracyHTML=getAccuracyHTML(closeNum);

  nameStr=makeName(hours,mins,secs);

  pl=getPlaylist(nameStr, tracksOut);

  if ($('#player')){
    $('#player').remove();
  }
  $('#wrapper').append(accuracyHTML);
  $('#player').append(pl.node);
}

function getAccuracyHTML(distance){
  var playerHTML= '<div id="player">';
  if(distance==0){
    playerHTML+='<h2>Done! Perfect time match</h2>';
  }
  else{
    secs=distance/1000;
    timeStr=" second";
    if(secs!=1){
      timeStr+="s"
    }
    playerHTML+='<h2>Done, accurate to within ' + secs + timeStr + '!</h2>';
  }
  playerHTML+='</div>';
  return(playerHTML);
}

function getPlaylist(name, tracks){
  var tempPlaylist = new models.Playlist();
  for (var i in tracks){
    tempPlaylist.add(tracks[i].uri);
  }
  var playlist=new views.List(tempPlaylist);
  var playerHTML= document.getElementById('player');
  return playlist;
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
