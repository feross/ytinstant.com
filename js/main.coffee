# TODO: cache suggestions
# TODO: cache search results
# TODO: add old folder to repo

window.onYouTubePlayerReady = (playerId) ->
    # Save reference to YouTube player
    window.search.player.yt = document.getElementById(playerId)

window.onPlayerStateChange = (newState) ->
    # TODO: Go to next video in list on stop


class Player

    constructor: ->
        @yt = null
    
    init: (@videoId) ->
        params =
            allowScriptAccess: 'always'
            wmode: 'opaque' # Allow other stuff to cover the player
        atts =
            id: 'ytplayer'

        swfobject.embedSWF "http://www.youtube.com/v/#{ @videoId }" +
        '&autoplay=1' +                 # enable autostart
        '&disablekb=1' +                # disable keyboard shortcuts
        '&enablejsapi=1' +              # enable JS API
        '&iv_load_policy=3' +           # hide video annotations
        '&playerapiid=ytplayer' +       # id passed to onYouTubePlayerReady
        '&rel=0' +                      # no related videos
        '&showinfo=0' +                 # hide video title
        '&version=3',                   # latest version of API
        'player', '480', '295', '8', null, null, params, atts
    
    setPlaybackQuality: (quality) ->
        @yt.setPlaybackQuality quality if @yt?
    
    playPause: ->
        return if not @yt?
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

    @NUM_VID_THUMBS: 5

    constructor: ->
        @player = new Player()
    
        # Save DOM elems for quick access
        @query = $('#search .query')
        @suggestion = $('#search .suggestion')
    
        @query.focus()
        @query.keyup (event) =>
            @onSearch(event)
  
    onSearch: (event) ->
        q = @query.val()
        
        if q == @lastQuery
            return

        @lastQuery = q

        # Clear suggestion text unless query is a prefix of suggestion
        if @suggestion.text().indexOf(q) != 0 || q == ''
            @suggestion.text ''
    
        # Pause video on blank query
        if q == ''
            @player.pauseVideo()
            return
    
        # Get suggestions
        $.ajax
            dataType: 'jsonp'
            jsonp: 'jsonp' # YouTube uses this instead of the normal "?callback="
            type: 'GET'
            url: 'http://suggestqueries.google.com/complete/search' +
                 '?hl=en' +
                 '&ds=yt' +
                 '&client=youtube' + 
                 '&hjson=t' +
                 '&cp=1' +
                 "&q=#{ encodeURIComponent(q) }"
            success: (suggestions) =>
                # Use the top suggestion, but fallback to an exact keyword search
                # if there are no suggestions. 
                searchTerm = suggestions?[1]?[0]?[0] || q
                
                @suggestion.text searchTerm
                @performSearch(searchTerm)
  
    performSearch: (s) ->
        $.ajax
            dataType: 'jsonp'
            type: 'GET'
            url: 'http://gdata.youtube.com/feeds/api/videos' + 
            "?q=#{ encodeURIComponent(s) }" +
            '&format=5' +   # Only return videos that can be embedded
            '&v=2' + 
            '&alt=jsonc' +
            "&max-results=#{ Search.NUM_VID_THUMBS }"
            success: (responseData, textStatus, XMLHttpRequest) =>
                if videoId = responseData?.data?.items?[0].id
                    if videoId is @player.videoId
                        @player.playVideo()
                    else
                        @player.loadVideoById videoId


$ ->
    window.search = new Search()







