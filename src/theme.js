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
                        <button class="btn button-icon button-icon-small icon-trash" title="Delete" onClick='deleteTheme(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-more" onClick="moreButtonClicked(this)" title="More"></button>`
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

async function addNoteToTheme(data) {
    // var selectedStickies = await miro.board.getSelection();
    // const currentTheme = await miro.board.getById(data.theme.id)
    // for(selectedsticky of selectedStickies) {
    //     await currentTheme.add(selectedsticky)
    // }
    const frame = await miro.board.createFrame({
        title: 'this frame ratio is 16:9',
        style: {
          fillColor: '#FFFFFF',
        },
        width: 800,
        height: 450,
        x: 4100,
        y: 4200,
      });
      
      // Create a text item, and position it inside the frame.
      const text = await miro.board.createText({
        content: 'this is a piece of text',
        style: {
          fillColor: '#fff9b1', // Light yellow
        },
        x: frame.x + 180,
        y: frame.y + 10,
      });
      
      // Create a shape item, and position it inside the frame.
      const shape = await miro.board.createShape({
        width: 200,
        height: 250,
        x: frame.x + 20,
        y: frame.y + 50,
        style: {
          fillColor: '#FF0000',
        },
      });
      
      // Add the text and the shape items as children of the parent frame.
      await frame.add(text);
      await frame.add(shape);
      
      // Move the frame on the board.
      // The children items move along with the frame:
      // their coordinates are relative to the top-left corner of the frame.
      frame.x = -400;
      frame.y = -500;
      await frame.sync();
      
}

async function duplicateTheme(data) {
    var currentTheme = await miro.board.getById(data.theme.id)
    var childrens = await currentTheme.getChildren()
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
                    if(wordCount[tword] >= 1) {
                        console.log("duplicate")
                        wordCount[tword] = wordCount[tword] + 1
                    } else {
                        wordCount[tword] = 1
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
                count: theme.words[word],
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