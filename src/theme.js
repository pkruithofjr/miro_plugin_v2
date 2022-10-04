function addThemeList(theme) {
    $('#themeList').append(`
        <li class="menu-item" title="${theme.title}">
            <a href="#" onclick='moveToSnapshot(${theme.id})'>
                <div class="word-name"></div>
                &nbsp;
            </a>
            <div class="action">
                <button class="btn button-icon button-icon-small icon-photo" title="Update with current view" onclick='updateSnapshot(${snapshot.id})'></button>
                <button class="btn button-icon button-icon-small icon-trash" title="Remove" onclick='removeSnapshot(${snapshot.id})'></button>
            </div>
        </li>
    `);
}

async function genList(themes) {
    var wordCount = []
    var stopList = analyzeStopList();
    var themeList = []
    for(i=0; i<themes.length; i++) {
        var themeinfo = {}
        themeinfo['name'] = themes[i].title
        themeinfo['id'] = themes[i].id
        themeinfo['childrenIds'] = themes[i].childrenIds
        wordCount = []
        const children = await themes[i].getChildren()
        for(j=0; j<children.length; j++) {
            var text = stripHtml(children[j].content)
            .replace(/[^A-Za-z0-9]/g, ' ')
            .toLowerCase()
            .replace(/\s\s+/g, ' ')
            var words = text.split(' ');
            for (word of words) {
                // Get word count in this widget
                if (stopList.indexOf(word) == -1) {
                    if(wordCount[word]) {
                        console.log("duplicate")
                        wordCount[word] = wordCount[word] + 1
                    } else {
                        wordCount[word] = 0
                    }
                }
            }
        }
        themeinfo.words = wordCount
        themeList.push(themeinfo)
    }
    console.log(themeList)
}

function loadTabTheme() {
    toggleLoading(true);
    getThemes().then((themes) => {
        $("#themeList").html('')
        if(themes && themes.length) {
            genList(themes)
        }
        toggleLoading(false)
    })
}

async function getThemes() {
    return await miro.board.get({type:['frame']})
}

$('#addTheme').on('click', async () => {
    toggleLoading(true);

    await miro.board.setAppData('focusedThemeName','Theme')

    var stickies = await getStickies();
    var tags = await getTags();
    var themes = await getThemes();
    var viewport = await miro.board.viewport.get()
    
    miro.board.ui.openModal({
        url: 'setThemeNameModal.html',
        width: 400,
        height: 250,
        fullscreen: false,
    }).then(() => {
        miro.board.getAppData("focusedThemeName").then(async (metadata) => {
            if (metadata) {
                const frame = await miro.board.createFrame({
                    title: metadata,
                    style: {
                      fillColor: '#FFFFFF',
                    },
                    width: 800,
                    height: 450,
                    x: viewport.x + viewport.width / 2,
                    y: viewport.y + viewport.height / 2,
                });
                await miro.board.viewport.zoomTo(frame)
            }
        })
    })

    toggleLoading(false);
})