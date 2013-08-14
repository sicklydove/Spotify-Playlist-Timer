//TODO DISABLE REPEATS?

var sp;
var models;
var player;
var lib;
var views;
var restrictedLib;

//form validation
$(function(){
  $("form input").change(function(){
   $('#submitBtn').attr("disabled",true);

   var h=($('#hours').val());
   var m=($('#mins').val());
   var s=($('#secs').val());

   if(validNumber(h) && validNumber(m) && validNumber(s)){
      $('#submitBtn').attr("disabled",false);
   }

  });
});

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

function init(){
   sp = getSpotifyApi(1);
   models = sp.require("sp://import/scripts/api/models");
   views = sp.require("sp://import/scripts/api/views");
   player = models.player;
   lib = models.library;
}


function validNumber(i){
  return((!(isNaN(parseInt(i))) && parseInt(i)>=0) || i==='');
}


function sanitise(){

  if(!$('#hours').val()){
    $('#hours').val(0);
  }
  if(!$('#mins').val()){
    $('#mins').val(0);
  }
  if(!$('#secs').val()){
    $('#secs').val(0);
  }

  var h=parseInt($('#hours').val());
  var m=parseInt($('#mins').val());
  var s=parseInt($('#secs').val());

  if(m>60){
  	var extra=Math.floor(m/60);
	$('#mins').val(m%60);
	$('#hours').val(h+=extra);
  }
  if(s>60){
  	var extra=Math.floor(s/60);
	$('#secs').val(s%60);
	$('#mins').val(m+=extra);
  }
}


function findTracks(){

  sanitise();

  var trackList=[];

  var h=parseInt($('#hours').val());
  var m=parseInt($('#mins').val());
  var s=parseInt($('#secs').val());

  var targetMillis=1000*(s+(60*m)+(3600*h));

  if(restrictedLib){
    library=restrictedLib.tracks;
  }
  else{
    library=lib.tracks;
  }

  var numTracks=library.length;

  //Iterate over library to find mean track length
  var totalMillis=0;
  for (var i in library){
    totalMillis+=library[i].duration;
  }
  var meanTrackMillis=totalMillis/library.length;

  //While the target time is far away (>3 mean track lengths), pick randomly
  var remainingMillis=targetMillis;

  while(remainingMillis>3*meanTrackMillis){
    var item = library[Math.floor(Math.random()*numTracks)];

    //Don't go closer than 1.5 mean track length
    if((remainingMillis-item.duration > 1.5*meanTrackMillis)){
      remainingMillis-=item.duration;
      trackList.push(item);
    }
  }

  //Number of mean track lengths left in unallocated time
  var meanTracksLeft=Math.floor(remainingMillis/meanTrackMillis);
  var bottomFivePct=meanTrackMillis-(meanTrackMillis/20);
  var topFivePct=meanTrackMillis+(meanTrackMillis/20);

  //If n trackLengths remaining, pick n-1 tracks to add
  for(var i=0; i<meanTracksLeft-1; i++){
    var suitable=false;
    //Keep picking randomly until we find a track +/- 5% of mean
    while(!suitable){
      var item = library[Math.floor(Math.random()*numTracks)];
      if(item.duration > bottomFivePct && item.duration < topFivePct){
        trackList.push(item);
        suitable=true;
        remainingMillis-=item.duration;
      }
    }
  }

  //Loop through entire library to find final track closest to target
  var found=false;
  var closest=remainingMillis;
  var bestTrack;
  for (var i in library){
    var track=library[i];
    //Is it within a second?
    if(track.duration>(remainingMillis+1000) && 
        track.duration<remainingMillis+1000){
      found=true;
      closest=0;
      trackList.push(track);
      remainingMillis-=track.duration;
    }
    //If not, it might still be the closest match
    //Some invalid tracks have -ve length, check >0
    else{
      if(Math.abs(remainingMillis-track.duration) < closest 
     	&& track.duration > 0 
	&& trackList.indexOf(track)==-1){

        closest=Math.abs(remainingMillis-track.duration);
        bestTrack=track;
      }
    }
  }

  if(!found){
    trackList.push(bestTrack);
  }

  accuracyHTML=getAccuracyHTML(closest);

  nameStr=makeName(hours,mins,secs);

  pl=getPlaylist(nameStr, trackList);

  if ($('#player')){
    $('#player').remove();
  }
  $('#wrapper').append(accuracyHTML);
  $('#player').append(pl.node);
}

function getAccuracyHTML(distance){
  var playerHTML= '<div id="player">';
  if(distance==0){
    playerHTML+='<h2>Done! Perfect match</h2>';
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

//There has GOT to be a better way to do this...
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
