NUM_VID_THUMBS = 5

$ ->
  window.search = new Search()

window.onYouTubePlayerReady = (playerId) ->
  search.player.yt = document.getElementById(playerId)
  search.player.yt.addEventListener 'onStateChange', 'onYouTubePlayerStateChange'

window.onYouTubePlayerStateChange = (newState) ->
  # TODO: Go to next video in list on stop

class Player
  constructor: (@domId) ->
    @yt = null

  init: (@videoId) ->
    params =
      allowScriptAccess: 'always'
      wmode: 'opaque' # Allow lightboxes to cover player
    atts =
      id: @domId
      allowFullScreen: 'true'

    swfobject.embedSWF "http://www.youtube.com/v/#{ encodeURIComponent(@videoId) }" +
    "&enablejsapi=1&playerapiid=#{ encodeURIComponent(@domId) }&rel=0&autoplay=1" +
    "&egm=0&loop=0&fs=1&showsearch=0&showinfo=0&iv_load_policy=3" +
    "&cc_load_policy=0&version=3&hd=1&disablekb=1",
    'player', '480', '295', '8', null, null, params, atts

  onReady: ->
  onPlayerStateChange: ->

  setPlaybackQuality: (quality) ->
    @yt.setPlaybackQuality quality if @yt?

  playPause: ->
    if @yt?
      if @getPlayerState() == YT.PlayerState.PLAYING
        @pauseVideo()
      else if @getPlayerState() == YT.PlayerState.PAUSED
        @playVideo()

  playVideo: ->
    @yt.playVideo() if @yt?

  pauseVideo: ->
    @yt.pauseVideo() if @yt?

  stopVideo: ->
    @yt.stopVideo() if @yt?

  getPlayerState: ->
    @yt.getPlayerState() if @yt?

  getVideoUrl: ->
    @yt.getVideoUrl() if @yt?

  loadVideoById: (videoId) ->
    if @yt?
      @yt.stopVideo()
      @yt.loadVideoById(videoId)
      @videoId = videoId
    else
      @init(videoId)

class Search
  constructor: ->
    @player = new Player('player')

    # Save DOM elems for quick access
    @query = $('#search .query')
    @suggestion = $('#search .suggestion')

    @query.focus()
    @query.keyup (event) =>
      @onSearch(event)

  onSearch: (event) ->
    q = @query.val()
    @maybeClearSuggestionText(q)

    if q == @lastQuery
      return

    @lastQuery = q

    if q == ''
      @player.stopVideo()
      return

    # Get suggestions
    $.ajax
       type: "GET"
       url: "http://suggestqueries.google.com/complete/search?hl=en&ds=yt" +
            "&client=youtube&hjson=t&jsonp=handleSuggestion&cp=1" +
            "&q=#{ encodeURIComponent(q) }"
       dataType: "jsonp"
       jsonp: "jsonp" # YouTube uses this instead of the normal "?callback="
       success: (suggestions) =>
         # use top suggestion, but if there is none then do exact keyword search
         searchTerm = suggestions?[1]?[0]?[0] || q
         @setSuggestionText(searchTerm)
         @performSearch(searchTerm)

  performSearch: (s) ->
    $.ajax
      dataType: 'jsonp'
      type: 'GET'
      url: "http://gdata.youtube.com/feeds/api/videos?q=#{ encodeURIComponent(s) }" +
           "&format=5&v=2&alt=jsonc" + # Force embeddable vids (format=5)
           "&max-results=#{ NUM_VID_THUMBS }"
      success: (responseData, textStatus, XMLHttpRequest) =>
        if videoId = responseData?.data?.items?[0].id
          @player.loadVideoById videoId if videoId != @player.videoId

  setSuggestionText: (text) ->
    @suggestion.text text

  # Depending on what the user's next letter is, we should maybe clear the
  # suggested text so it doesn't look weird.
  maybeClearSuggestionText: (query) ->
    if @suggestion.text().indexOf(query) == -1 or query == ''
      @suggestion.text ''










