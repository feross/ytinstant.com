/* global $ */

var INITIAL_VID_THUMBS = 5

var player
let currentVideoId = '_2c5Fh3kfrI'

$(document).ready(onBodyLoad)

function onYouTubeIframeAPIReady () {
  player = new YT.Player('innerVideoDiv', {
    height: '405',
    width: '720',
    videoId: currentVideoId,
    playerVars: {
      autoplay: 0,
      cc_load_policy: 1,
      controls: 1,
      enablejsapi: 1,
      iv_load_policy: 3,
      showinfo: 0,
      playerapiid: 'ytplayer',
      rel: 0,
      loop: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  })
}

function onPlayerReady (event) {
  ytplayer = event.target
}

let currentSearch
let currentSuggestion
let playlistShowing
let playlistArr
let currentPlaylistPos
let xhrWorking
let pendingSearch
let pendingDoneWorking
let playerState
let hashTimeout

function onBodyLoad () {
  currentSearch = ''
  currentSuggestion = ''
  currentVideoId = ''
  playlistShowing = false
  playlistArr = []
  currentPlaylistPos = 0
  xhrWorking = false
  pendingSearch = false
  pendingDoneWorking = false
  playerState = -1
  hashTimeout = false
  loadRandomTip()

  if (typeof ytplayer === 'undefined') {
    setTimeout(onBodyLoad, 250)
    return
  }
  var searchBox = $('#searchBox')
  searchBox.keyup(doInstantSearch)
  $(document.documentElement).keydown(onKeyDown)
  $('#buttonControl').click(playPause)
  $('#linkUrl').click(function (e) {
    $(this).select()
  })
  $('#embedUrl').click(function (e) {
    $(this).select()
  })
  if (window.location.hash) {
    var searchTerm = $('<div/>').text(getHash()).html() // escape html
    $('#searchBox').val(searchTerm).focus()
  } else {
    var defaultSearches = [
      'YouTube',
      'Rihanna',
      'Far East Movement',
      'Glee Cast',
      'Nelly',
      'Usher',
      'Katy Perry',
      'Taio Cruz',
      'Eminem',
      'Shakira',
      'Kesha',
      'B.o.B.',
      'Taylor Swift',
      'Bon Jovi',
      'Michael Jackson',
      'Lady Gaga',
      'Jay Z',
      'The Beatles',
      'Led Zepplin',
      'Guns N Roses',
      'AC DC',
      'System of a Down',
      'Aerosmith',
      'Tetris',
      'Basshunter',
      'Fallout Boy',
      'Blink 182',
      'Pink Floyd',
      'Still Alive',
      'Justin Bieber',
      'The Killers',
      'Bed intruder song',
      'Baba O Riley',
      'Billy Joel',
      'Drake',
      'Jay Sean'
    ]
    var randomNumber = Math.floor(Math.random() * defaultSearches.length)
    $('#searchBox').val(defaultSearches[randomNumber]).select().focus()
  }
  doInstantSearch()
}

function onPlayerStateChange (event) {
  playerState = event.data
  if (pendingDoneWorking && (playerState === 1 || playerState === -1)) {
    doneWorking()
    pendingDoneWorking = false
  } else if (playerState === 0) {
    goNextVideo()
  }
}

function onKeyDown (e) {
  if (e.keyCode === 39 || e.keyCode === 40) {
    goNextVideo()
  } else if (e.keyCode === 37 || e.keyCode === 38) {
    goPrevVideo()
  } else if (e.keyCode === 13) {
    playPause()
  }
}

function goNextVideo () {
  if (currentPlaylistPos === INITIAL_VID_THUMBS - 1) {
    return
  }
  goVid(currentPlaylistPos + 1)
}

function goPrevVideo () {
  if (currentPlaylistPos === 0) {
    return
  }
  goVid(currentPlaylistPos - 1)
}

function goVid (playlistPos) {
  loadAndPlayVideo(playlistArr[playlistPos].id, playlistPos)
}

function doInstantSearch () {
  if (xhrWorking) {
    pendingSearch = true
    return
  }
  var searchBox = $('#searchBox')
  if (searchBox.val() === currentSearch) {
    return
  }
  currentSearch = searchBox.val()
  if (searchBox.val() === '') {
    $('#playlistWrapper').slideUp('slow')
    playlistShowing = false
    pauseVideo()
    clearVideo()
    updateHash('')
    currentSuggestion = ''
    updateSuggestedKeyword('<strong>Search YouTube Instantly</strong>')
    return
  }
  searchBox.attr('class', 'statusLoading')
  keyword = searchBox.val()
  var the_url = 'https://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&jsonp=window.yt.www.suggest.handleResponse&q=' + encodeURIComponent(searchBox.val()) + '&cp=1'
  $.ajax({
    type: 'GET',
    url: the_url,
    dataType: 'script'
  })
  xhrWorking = true
}

yt = {}

yt.www = {}

yt.www.suggest = {}

yt.www.suggest.handleResponse = function (suggestions) {
  if (suggestions[1][0]) {
    var searchTerm = suggestions[1][0][0]
  } else {
    var searchTerm = null
  }
  updateHash(currentSearch)
  if (!searchTerm) {
    searchTerm = keyword
    updateSuggestedKeyword(searchTerm + ' (Exact search)')
  } else {
    updateSuggestedKeyword(searchTerm)
    if (searchTerm === currentSuggestion) {
      doneWorking()
      return
    }
  }
  getTopSearchResult(searchTerm)
  currentSuggestion = searchTerm
}

function getTopSearchResult (keyword) {
  var request = fetch('https://play.cash/api/video?q=' + encodeURIComponent(keyword) + '&maxResults=' + INITIAL_VID_THUMBS)
    .then(res => res.json())
    .then(response => {
      console.log(response)
      var videos = response.result.videos
      if (videos) {
        playlistArr = videos
        updateVideoDisplay(videos)
        pendingDoneWorking = true
      } else {
        updateSuggestedKeyword('No results for "' + keyword + '"')
        doneWorking()
      }
    })
}

function updateVideoDisplay (videos) {
  var numThumbs = videos.length >= INITIAL_VID_THUMBS ? INITIAL_VID_THUMBS : videos.length
  var playlist = $('<div />').attr('id', 'playlist')
  for (var i = 0; i < numThumbs; i++) {
    var videoId = videos[i].id
    var img = $('<img />').attr('src', `https://img.youtube.com/vi/${videoId}/default.jpg`)
    var a = $('<a />').attr('href', "javascript:loadAndPlayVideo('" + videoId + "', " + i + ')')
    var title = $('<div />').html(videos[i].title)
    playlist.append(a.append(img).append(title))
  }
  var playlistWrapper = $('#playlistWrapper')
  $('#playlist').remove()
  playlistWrapper.append(playlist)
  if (!playlistShowing) {
    playlistWrapper.slideDown('slow')
    playlistShowing = true
  }
  currentPlaylistPos = -1
  if (currentVideoId !== videoId) {
    loadAndPlayVideo(videoId, 0, true)
  }
}

function doneWorking () {
  xhrWorking = false
  if (pendingSearch) {
    pendingSearch = false
    doInstantSearch()
  }
  var searchBox = $('#searchBox')
  searchBox.attr('class', 'statusPlaying')
}

function updateHTML (elmId, value) {
  document.getElementById(elmId).innerHTML = value
}

function updateSuggestedKeyword (keyword) {
  updateHTML('searchTermKeyword', keyword)
}

function updateHash (hash) {
  var timeDelay = 1e3
  if (hashTimeout) {
    clearTimeout(hashTimeout)
  }
  hashTimeout = setTimeout(function () {
    window.location.replace('#' + encodeURI(hash))
    $('#fb_share').attr('share_url', window.location)
    $.ajax({
      type: 'GET',
      url: 'https://static.ak.fbcdn.net/connect.php/js/FB.Share',
      dataType: 'script'
    })
    $('#linkUrl').val(window.location)
    document.title = '"' + currentSuggestion.toTitleCase() + '" on YouTube Instant!'
    prepareFBShare()
  }, timeDelay)
}

function getHash () {
  return decodeURIComponent(window.location.hash.substring(1))
}

function prepareFBShare () {
  $('#hidden').empty()
  $('#hidden').append($('<a id="fb_share" name="fb_share" type="button_count" href="https://www.facebook.com/sharer.php">Share</a>'))
  $('#hidden').append($('<script src="https://static.ak.fbcdn.net/connect.php/js/FB.Share" type="text/javascript"></script>'))
}

function doFBShare () {
  $('#fb_share').click()
}

function loadRandomTip () {
  var tips = ['Use the <strong>arrow keys</strong> on your keyboard to skip to the next video!', 'Press <strong>Enter</strong> to pause the video.', 'Every time you type a letter, a <strong>new video</strong> loads!']
  var randomNumber = Math.floor(Math.random() * tips.length)
  $('#tip').html(tips[randomNumber])
}

function setVideoVolume () {
  var volume = parseInt(document.getElementById('volumeSetting').value)
  if (isNaN(volume) || volume < 0 || volume > 100) {
    alert('Please enter a valid volume between 0 and 100.')
  } else if (ytplayer) {
    ytplayer.setVolume(volume)
  }
}

function loadVideo (videoId) {
  if (ytplayer) {
    ytplayer.cueVideoById(videoId)
    currentVideoId = videoId
  }
}

function playVideo () {
  if (ytplayer) {
    ytplayer.playVideo()
  }
}

function loadAndPlayVideo (videoId, playlistPos, bypassXhrWorkingCheck) {
  if (currentPlaylistPos === playlistPos) {
    playPause()
    return
  }
  if (!bypassXhrWorkingCheck && xhrWorking) {
    return
  }
  if (ytplayer) {
    xhrWorking = true
    ytplayer.loadVideoById(videoId)
    currentVideoId = videoId
    pendingDoneWorking = true
  }
  currentPlaylistPos = playlistPos
  $('#playlistWrapper').removeClass('play0 play1 play2 play3 play4 pauseButton playButton').addClass('pauseButton play' + playlistPos)
  var playlist = $('#playlist')
  playlist.children().removeClass('selectedThumb')
  playlist.children(':nth-child(' + (playlistPos + 1) + ')').addClass('selectedThumb')
  $('#embedUrl').val('<object width="640" height="385"><param name="movie" value="https://www.youtube.com/v/' + currentVideoId + '?fs=1&hl=en_US"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="https://www.youtube.com/v/' + currentVideoId + '?fs=1&hl=en_US" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="640" height="385"></embed></object>')
}

function showCredits () {
  $('#additionalCredits').slideToggle('fast')
}

function setPlaybackQuality (quality) {
  if (ytplayer) {
    ytplayer.setPlaybackQuality(quality)
  }
}

function pauseVideo () {
  if (ytplayer) {
    ytplayer.pauseVideo()
  }
}

function muteVideo () {
  if (ytplayer) {
    ytplayer.mute()
  }
}

function unMuteVideo () {
  if (ytplayer) {
    ytplayer.unMute()
  }
}

function clearVideo () {
  if (ytplayer) {
    ytplayer.clearVideo()
  }
}

function getEmbedCode () {
  alert(ytplayer.getVideoEmbedCode())
}

function getVideoUrl () {
  alert(ytplayer.getVideoUrl())
}

function setVolume (newVolume) {
  if (ytplayer) {
    ytplayer.setVolume(newVolume)
  }
}

function getVolume () {
  if (ytplayer) {
    return ytplayer.getVolume()
  }
}

function playPause () {
  if (ytplayer) {
    if (playerState === 1) {
      pauseVideo()
      $('#playlistWrapper').removeClass('pauseButton').addClass('playButton')
    } else if (playerState === 2) {
      playVideo()
      $('#playlistWrapper').removeClass('playButton').addClass('pauseButton')
    }
  }
}

String.prototype.toTitleCase = function () {
  return this.replace(/([\w&`'‘’"“.@:\/\{\(\[<>_]+-? *)/g, function (match, p1, index, title) {
    if (index > 0 && title.charAt(index - 2) !== ':' && match.search(/^(a(nd?|s|t)?|b(ut|y)|en|for|i[fn]|o[fnr]|t(he|o)|vs?\.?|via)[ \-]/i) > -1) return match.toLowerCase()
    if (title.substring(index - 1, index + 1).search(/['"_{(\[]/) > -1) return match.charAt(0) + match.charAt(1).toUpperCase() + match.substr(2)
    if (match.substr(1).search(/[A-Z]+|&|[\w]+[._][\w]+/) > -1 || title.substring(index - 1, index + 1).search(/[\])}]/) > -1) return match
    return match.charAt(0).toUpperCase() + match.substr(1)
  })
}

function loadYouTubeIframeAPI () {
  var tag = document.createElement('script')

  tag.src = 'https://www.youtube.com/iframe_api'
  var firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
}

loadYouTubeIframeAPI()
