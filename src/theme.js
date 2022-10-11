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
                    : `<button class="btn button-icon button-icon-small icon-tile" title="Cluster stickies of this theme" onClick='clusteringTheme(${JSON.stringify(data)})'></button>
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

async function clusteringTheme(data) {
    console.log(data)
    var count = data.wordList.length
    var note_x = Math.sqrt(count).toFixed(0)*1
    var note_y
    if (note_x * note_x <= count) note_y = note_x
    else note_y = note_x + 1
    var total_x = 200 * note_x + 20 * (note_x - 1)
    var total_y = 200 * note_y + 20 * (note_y - 1)
    const currentTheme = await miro.board.getById(data.theme.id)
    if(currentTheme.width < total_x || currentTheme.height < total_y) {
        currentTheme.width = total_x + 400
        currentTheme.height = total_y + 400
        await currentTheme.sync()
    }
    var init_x = 120 + Math.random() * (currentTheme.width - total_x) - 200, init_y = 120 + Math.random() * (currentTheme.height - total_y) - 200
    // init_x = Math.random() * (currentTheme.width - total_x) - currentTheme.width / 2
    // init_y = Math.random() * (currentTheme.height - total_y) - currentTheme.height / 2

    var color = randomNoteColor()
    for(i=0; i<count; i++) {
        var currentNote = await miro.board.getById(data.wordList[i])
        currentNote.style.fillColor = color 
        currentNote.width = 200
        currentNote.x = init_x + (i / note_x) * 200 + (i / note_x) * 20
        currentNote.y = init_y + (i % note_y) * 250 + (i % note_y) * 20
        currentNote.sync()
    }
}

async function addNoteToTheme(data) {
    var selectedStickies = await miro.board.getSelection();
    const currentTheme = await miro.board.getById(data.theme.id)
    var registeredTags = await getTags(); // get existed tags in board
    var copyTagId
    for(i=0; i<registeredTags.length;i++) {
        if(registeredTags[i].title.toLowerCase() == 'copy') {
            copyTagId = registeredTags[i].id
            break
        }
    }
    if(!copyTagId) {
        const copyTag = await miro.board.createTag({
            title: 'Copy',
            color: 'blue',
        });
        copyTagId = copyTag.id
    }
    var i = 0;
    for(selectedsticky of selectedStickies) {
        tagIds = selectedsticky.tagIds
        tagIds.push(copyTagId)
        const note = await miro.board.createStickyNote({
            content: selectedsticky.content,
            style: selectedsticky.style,
            shape: 'square',
            tagIds: tagIds,
            width: 200,
            x: 200 + currentTheme.x + Math.random()*(currentTheme.width-200) - currentTheme.width / 2,
            y: 200 + currentTheme.y + Math.random()*(currentTheme.height-200) - currentTheme.height / 2
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
        x: currentTheme.x + 3100,
        y: currentTheme.y,
    });
    await miro.board.viewport.zoomTo(frame)
    for(children of childrens) {
        const note = await miro.board.createStickyNote({
            content: children.content,
            style: children.style,
            shape: 'square',
            tagIds: children.tagIds,
            width: children.width,
            x: children.x + currentTheme.x,
            y: children.y + currentTheme.y
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
            var unique_words = []
            $.each(words, function (i, el){
                if($.inArray(el, unique_words) === -1) unique_words.push(el);
            })
            for (word of unique_words) {
                // Get word count in this widget
                if (stopList.indexOf(word) == -1) {
                    var tword = word
                    if(wordCount[tword] != undefined) {
                        wordCount[tword].push(children[j].id)
                    } else {
                        wordCount[tword] = []
                        wordCount[tword].push(children[j].id)
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
                theme: theme,
                word: word,
                tagName: null,
                stickyId: null,
                count: theme.words[word].length,
                wordList: theme.words[word],
                type:'tag'
            },
            true,
            false)
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
    var themes = await getThemes()
    var max_width = 0, max_height = 0
    for(theme of themes) {
        if(theme.x + theme.width / 2 > max_width) {
            max_width = theme.x + theme.width
            max_height = theme.y
        }
    }
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
                    width: 3000,
                    height: 1900,
                    x: max_width+100,
                    y: max_height,
                });
                await miro.board.viewport.zoomTo(frame)
                loadTabTheme();
            }

        })
    })

    toggleLoading(false);
})