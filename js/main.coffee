# TODO: switch back to SWFObject method (it's much faster)
# TODO: cache suggestions
# TODO: cache search results
# TODO: add old folder to repo

onPlayerReady = (event) ->
    # test

onPlayerStateChange = (newState) ->
    # TODO: Go to next video in list on stop

window.onYouTubePlayerAPIReady = ->
    window.search.player.yt = new YT.Player 'player',
        height: '390',
        width: '640',
        videoId: window.search.player.videoId,
        playerVars:
            autoplay: 1
            cc_load_policy: 0
            disablekb: 1
            enablejsapi: 1
            iv_load_policy: 3
            origin: 'http://ytinstant.com'
            rel: 0
            wmode: 'opaque'
        events:
            'onReady': onPlayerReady
            'onStateChange': onPlayerStateChange

class Player
    constructor: (@domId) ->
        @yt = null
    
    init: (@videoId) ->
        # params =
        #     allowScriptAccess: 'always'
        #     wmode: 'opaque' # Allow lightboxes to cover player
        # atts =
        #     id: 'ytplayer'
        
        tag = document.createElement 'script'
        tag.src = 'http://www.youtube.com/player_api'
        firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore tag, firstScriptTag


        # swfobject.embedSWF "http://www.youtube.com/v/#{ @videoId }" +
        # "&enablejsapi=1&playerapiid=ytplayer&rel=0&autoplay=1" +
        # "&egm=0&loop=0&fs=1&showsearch=0&showinfo=0&iv_load_policy=3" +
        # "&cc_load_policy=0&version=3&hd=1&disablekb=1",
        # @domId, '480', '295', '8', null, null, params, atts
    
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

    NUM_VID_THUMBS: 5

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
            url: "http://suggestqueries.google.com/complete/search?hl=en&ds=yt" +
                 "&client=youtube&hjson=t&jsonp=handleSuggestion&cp=1" +
                 "&q=#{ encodeURIComponent(q) }"
            success: (suggestions) =>
                # use top suggestion, but if there is none then do exact keyword search
                searchTerm = suggestions?[1]?[0]?[0] || q
                
                @suggestion.text searchTerm
                @performSearch(searchTerm)
  
    performSearch: (s) ->
        $.ajax
            dataType: 'jsonp'
            type: 'GET'
            url: "http://gdata.youtube.com/feeds/api/videos?q=#{ encodeURIComponent(s) }" +
                 "&format=5&v=2&alt=jsonc" + # Force embeddable vids (format=5)
                 "&max-results=#{ @NUM_VID_THUMBS }"
            success: (responseData, textStatus, XMLHttpRequest) =>
                if videoId = responseData?.data?.items?[0].id
                    if videoId is @player.videoId
                        @player.playVideo()
                    else
                        @player.loadVideoById videoId
        


$ ->
    window.search = new Search()







