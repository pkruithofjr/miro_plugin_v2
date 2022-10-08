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

function themeItem(data, shorten = false, expandable = true) {
    var id = randomId()

    return $(`
    <li class="menu-item-${data.type}" title="${capitalizeFirstLetter(data.showName) + ' (' + data.count + ')'}" id="${id}">
        <a href="#" ${expandable ? 'class="has-arrow" aria-expanded="false"' : ''}>
            <span class="word-name">${data.showName}</span> &nbsp;
            <span class="item-badge">${data.count==null? '' : '('+data.count+')'}</span>
        </a>
        <div class="action">
            ${
                !shorten
                    ? `<button class="btn button-icon button-icon-small icon-eye" title="View" onClick='selectTheme(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-plus" title="Add Stickies" onClick='addNoteToTheme(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon- icon-duplicate" title="Duplicate" onClick='duplicateTheme(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-trash" title="Delete" onClick='deleteTheme(${JSON.stringify(data)})'></button>`
                    : `<button class="btn button-icon button-icon-small icon-tile" title="Delete" onClick='deleteSticky(${JSON.stringify(data)})'></button>
                        `
            }
            ${
                !shorten
                    ? `<ul class="more-dropmenu"> <li> <button class="btn button-icon button-icon-small icon-deactivated" title="Add to stop list" onClick='addToStopList(this, "${data.word}")'> Add to stop list</button> </li> </ul>`
                    : `<ul class="more-dropmenu"> 
                        <li><button class="btn button-icon button-icon-small icon-duplicate" title="Duplicate" onClick='duplicateSelection(${JSON.stringify(data)})'>Duplicate</button></li>
                        <li> <button class="btn button-icon button-icon-small icon-deactivated" title="Add to stop list" onClick='addToStopList(this, "${data.word}")'>Add to stop list</button> </li> </ul>`
            }
        </div>
    </li>`)
}

async function selectTheme(data) {
    await miro.board.viewport.zoomTo(data.theme)
}

async function deleteTheme(data) {
    const currentTheme = await miro.board.getById(data.theme.id)
    var childrens = await currentTheme.getChildren()
    for (children of childrens) {
        await miro.board.remove(children)
    }
    await miro.board.remove(currentTheme);
}

async function addNoteToTheme(data) {
    var selectedStickies = await miro.board.getSelection();
    const currentTheme = await miro.board.getById(data.theme.id)
    var i = 0;
    for(selectedsticky of selectedStickies) {
        const note = await miro.board.createStickyNote({
            content: selectedsticky.content,
            style: selectedsticky.style,
            shape: 'square',
            tagIds: selectedsticky.tagIds,
            width: 200,
            x: currentTheme.x + Math.random()*currentTheme.width - currentTheme.width / 2,
            y: currentTheme.y + Math.random()*currentTheme.height - currentTheme.height / 2
        })
        await currentTheme.add(note)
        i++;
    }
}

async function duplicateTheme(data) {
    var currentTheme = await miro.board.getById(data.theme.id)
    var childrens = await currentTheme.getChildren()
    var viewport = await miro.board.viewport.get()
    const frame = await miro.board.createFrame({
        title: currentTheme.title+' - Copy',
        style: {
          fillColor: '#FFFFFF',
        },
        width: currentTheme.width,
        height: currentTheme.height,
        x: viewport.x + viewport.width / 2,
        y: viewport.y + viewport.height / 2,
    });
    await miro.board.viewport.zoomTo(frame)
    for(children of childrens) {
        const note = await miro.board.createStickyNote({
            content: children.content,
            style: children.style,
            shape: 'square',
            tagIds: children.tagIds,
            width: children.width,
            x: frame.x,
            y: frame.y
        })
        await frame.add(note)
    }
    await frame.sync();
    console.log(childrens)
}

async function genList(themes) {
    var stopList = analyzeStopList();
    var themeList = []
    for(i=0; i<themes.length; i++) {
        var themeinfo = {}
        themeinfo['name'] = themes[i].title
        themeinfo['id'] = themes[i].id
        themeinfo['childrenIds'] = themes[i].childrenIds
        var wordCount = {}
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
                    var tword = word
                    if(wordCount[tword].length != undefined) {
                        console.log("duplicate")
                        wordCount[tword].push(children.id)
                    } else {
                        wordCount[tword] = []
                    }
                }
            }
        }
        themeinfo.words = wordCount
        themeList.push(themeinfo)
    }
    
    $('#themeList').html('');

    for (theme of themeList) {
        var themeEle = themeItem({
            showName: theme.name,
            theme: theme,
            word: theme.name,
            wordName: null,
            count: null,
            type:'word'
        })
        var wordWrapper = $('<ul></ul>');
        var words = Object.keys(theme.words)
        for(word of words) {
            var wordEle = themeItem({
                showName: word,
                word: word,
                tagName: null,
                stickyId: null,
                count: theme.words[word].length,
                wordList: theme.words[word],
                type:'tag'
            },
            true)
            wordWrapper.append(wordEle)
        }
        themeEle.append(wordWrapper)
        $('#themeList').append(themeEle)
        $('#themeList').metisMenu('dispose');
        $('#themeList').metisMenu();
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