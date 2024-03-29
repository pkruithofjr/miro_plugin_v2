
var wordCounts;
var NOTAG = '!-----!';
var defaultStopList;

$.getJSON('src/nltk_stoplist.json', (data) => {
    defaultStopList = data;
    $('#stopList').val(defaultStopList.join(', '));
});

//////////////// Count Tab ///////////////////////

function analyzeStopList() {
    var list = $('#stopList').val().toLowerCase().replace(/\s/g, '').split(',');
    list.push('');
    //list = defaultStopList.concat(list);
    return list;
}

function getSelectedTag() {
    return $('#tag-select').val();
}

function loadTagSelectOptions() {
    toggleLoading();
    getTags().then((tags) => {
        $('#tag-select').html('<option value="all"> All </option>');
        tags.forEach((tag) => {
            if (tag.title.toLowerCase() != 'copy')
                $('#tag-select').append(`<option value='${tag.id}'>${tag.title}</option>`);
        });
        toggleLoading(false);
    });
}

function getWordTagTotalCount(words) {
    console.log(words)
    var sum = 0;

    for (index in words) {
        sum += words[index];
    }

    return sum;
}

function getWordTotalCount(wordTags) {
    console.log(wordTags)
    var sum = 0;
    var duplicated = [];

    for (tagName in wordTags) {
        for (widgetId in wordTags[tagName]) {
            if (!duplicated[widgetId]) {
                sum += wordTags[tagName][widgetId];
                duplicated[widgetId] = true;
            }
        }
    }
    
    return sum;
}

function getSortedWordsArrayIndex(wordCounts) {
    indexes = Object.keys(wordCounts);
    indexes.sort((a, b) => {
        return getWordTotalCount(wordCounts[a]) < getWordTotalCount(wordCounts[b]) ? 1 : -1;
    });
    return indexes;
}

function getSortedWordTagArrayIndex(wordTagCounts) {
    indexes = Object.keys(wordTagCounts);
    indexes.sort((a, b) => {
        return getWordTagTotalCount(wordTagCounts[a]) < getWordTagTotalCount(wordTagCounts[b]) ? 1 : -1;
    });
    return indexes;
}

function getSortedWordWidgetArrayIndex(wordWidgetCounts) {
    indexes = Object.keys(wordWidgetCounts);
    indexes.sort((a, b) => {
        return wordWidgetCounts[a] < wordWidgetCounts[b] ? 1 : -1;
    });
    return indexes;
}

function addToStopList(ele, word) {
    var wordMenu = $(ele).closest('.menu-item-word');

    wordMenu.remove();

    var stopList = analyzeStopList();
    stopList.push(word);
    stopList = stopList.filter((item) => item !== '');

    $('#stopList').val(stopList.join(', '));
}

function menuItem(data, shorten = false, expandable = true) {
    var id = randomId();

    return $(`
    <li class="menu-item-${data.type}" title="${capitalizeFirstLetter(data.showName) + ' (' + data.count + ')'}" id="${id}">
        <a href="#" ${expandable ? 'class="has-arrow" aria-expanded="false"' : ''} onClick='selectWidgets(${JSON.stringify(data)})'>
            <span class="word-name">${data.showName}</span> &nbsp;
            <span class="item-badge">(${data.count})</span>
        </a>
        <div class="action">
            ${
                !shorten
                    ? `<button class="btn button-icon button-icon-small icon-tile" title="Cluster" onClick='clusterItemsFromData(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-pin" title="Add a Tag" onClick='addTagSelectedItem(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-duplicate" title="Duplicate" onClick='duplicateSelection(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-more" onClick="moreButtonClicked(this)" title="More"></button>`
                    : `<button class="btn button-icon button-icon-small icon-tile" title="Cluster" onClick='clusterItemsFromData(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-pin" title="Add a Tag" onClick='addTagSelectedItem(${JSON.stringify(data)})'></button>
                        <button class="btn button-icon button-icon-small icon-more" onClick="moreButtonClicked(this)" title="More"></button>`
            }
            ${
                !shorten
                    ? `<ul class="more-dropmenu"> <li> <button class="btn button-icon button-icon-small icon-deactivated" title="Add to stop list" onClick='addToStopList(this, "${data.word}")'> Add to stop list</button> </li> </ul>`
                    : `<ul class="more-dropmenu"> 
                        <li><button class="btn button-icon button-icon-small icon-duplicate" title="Duplicate" onClick='duplicateSelection(${JSON.stringify(data)})'>Duplicate</button></li>
                        <li> <button class="btn button-icon button-icon-small icon-deactivated" title="Add to stop list" onClick='addToStopList(this, "${data.word}")'>Add to stop list</button> </li> </ul>`
            }
        </div>
    </li>`);
}

function stripHtml(html)
{
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

async function listWords() {
    toggleLoading();

    var stopList = analyzeStopList();
    var selectedTag = getSelectedTag();
    var stickies = await getStickies();
    wordCounts = [];
    /*
		wordCounts = [
			'word1': [
				tag1: [
					widgetId1: count1,
					widgetId2: count2,
					widgetId3: count3,
					...
				],
				...
			],
			...
		]
	*/

    if (selectedTag !== 'all') {
        // filter stickied by selectedTag
        stickies = stickies.filter((widget) => widget.tagIds.findIndex((tag) => tag == selectedTag) != -1);
    }

    stickies = await filterCopies(stickies);
    var registeredTags = await getTags();

    for (widget of stickies) {
        var text = stripHtml(widget.content)
            .replace(/[^A-Za-z0-9]/g, ' ')
            .toLowerCase()
            .replace(/\s\s+/g, ' ')
        var words = text.split(' ');
        var tagNames = widget.tagIds.map((tag) => {
            for(i=0;i<registeredTags.length;i++) {
                if(tag == registeredTags[i].id) return registeredTags[i].title
            }
        });
        for (word of words) {
            // Get word count in this widget
            if (stopList.indexOf(word) == -1) {
                // Check if the word in the stoplist
                if (!wordCounts[word]) {
                    wordCounts[word] = [];
                }
                if (!tagNames.length) {
                    tagNames = [NOTAG];
                }
                for (tag of tagNames) {
                    if (!wordCounts[word][tag]) {
                        wordCounts[word][tag] = [];
                    }

                    if (!wordCounts[word][tag][widget.id]) {
                        wordCounts[word][tag][widget.id] = 0;
                    }
                    wordCounts[word][tag][widget.id]++;
                }
            }
        }
    }

    $('#metismenu').html('');

    wordIndexes = getSortedWordsArrayIndex(wordCounts);

    for (word of wordIndexes) {
        console.log(word)
        console.log(wordCounts)
        var wordTags = wordCounts[word];
        var totalCount = getWordTotalCount(wordTags);
        var tagIndexes = getSortedWordTagArrayIndex(wordTags);
        var wordEle = menuItem({
            showName: word,
            word: word,
            tagName: null,
            stickyId: null,
            count: totalCount,
            type: 'word',
        });
        var tagWrapper = $('<ul></ul>');

        for (tag of tagIndexes) {
            var wordTagWords = wordTags[tag];
            var totalTagCount = getWordTagTotalCount(wordTagWords);
            var widgetIndexes = getSortedWordWidgetArrayIndex(wordTagWords);
            var tagEle = menuItem(
                {
                    showName: tag == NOTAG ? 'No Tag' : tag,
                    word: word,
                    tagName: tag,
                    stickyId: null,
                    count: totalTagCount,
                    type: 'tag',
                },
                true
            );
            var widgetWrapper = $('<ul></ul>');
            var count = 1;

            for (widgetId of widgetIndexes) {
                var wordCount = wordTagWords[widgetId];
                var widgetEle = menuItem(
                    {
                        showName: 'Sticky ' + count,
                        word: word,
                        tagName: tag,
                        stickyId: widgetId,
                        count: wordCount,
                        type: 'sticky',
                    },
                    true,
                    false
                );

                widgetWrapper.append(widgetEle);
                count++;
            }

            tagEle.append(widgetWrapper);
            tagWrapper.append(tagEle);
        }
        wordEle.append(tagWrapper);
        $('#metismenu').append(wordEle);
    }
    $('#metismenu').metisMenu('dispose');
    $('#metismenu').metisMenu();
    toggleLoading(false);
}

// Cluster in Count

function getWidgetIdsFromData(data) {
    console.log(data)
    console.log(data.type)
    widgetIds = [];

    toggleLoading(true);

    if (data.type == 'word') {
        tags = wordCounts[data.word];
        for (tagName in tags) {
            widgets = tags[tagName];
            newIds = Object.keys(widgets).filter((item) => {
                return widgetIds.indexOf(item) == -1;
            });
            widgetIds = widgetIds.concat(newIds);
        }
    } else if (data.type == 'tag') {
        widgets = wordCounts[data.word][data.tagName];

        widgetIds = Object.keys(widgets);
    } else {
        toggleLoading(false);
        return false;
    }
    toggleLoading(false);
    return widgetIds;
}

function clusterItemsFromData(data) {
    clusterWidgets(getWidgetIdsFromData(data));
}

async function selectWidgets(data) {
    var widgetIds = getWidgetIdsFromData(data);
    console.log(widgetIds)
    var stickies = await getStickies();

    // if (widgetIds.length) {
    //     await miro.board.selection.selectWidgets(widgetIds);
    // }
    
    await focusOnWidgets(stickies.filter(sticky => widgetIds.includes(sticky.id)));
}

// Add a tag based on words
async function addTagSelectedItem(data) {
    toggleLoading(true);

    var widgetIds = getWidgetIdsFromData(data);

    await miro.board.setAppData('focusedTagName', {
        focusedTagName: data.word + (!data.tagName || data.tagName == NOTAG ? '' : data.word + '-' + data.tagName),
    });
    miro.board.ui.openModal({
        url: 'setTagNameModal.html',
        width: 400,
        height: 250,
        fullscreen: false,
    }).then(() => {
        console.log("setTagNameModal closed")
        miro.board.getAppData('focusedTagName').then(async (metadata) => {
            if (metadata) {
                console.log(metadata)
                newTag = await miro.board.createTag({
                    color: randomTagColor(),
                    title: metadata,
                });
                
                widgetIds.forEach(async (widget, index) =>  {
                    widget = await miro.board.getById(widget)
                    widget.tagIds.push(newTag.id)
                    widget.sync()
                })
                
                loadTagSelectOptions();
                listWords();
            }
            toggleLoading(false);
        });
        // miro.board.metadata.get().then(async (metadata) => {
        //     if (metadata[appId].focusedTagName) {
        //         await miro.board.tags.create({
        //             color: randomColor(),
        //             title: metadata[appId].focusedTagName,
        //             widgetIds: widgetIds,
        //         });

        //         loadTagSelectOptions();
        //         listWords();
        //     }
        //     toggleLoading(false);
        // });
    });
}

// Add a tag based on words
async function duplicateSelection(data) {
    toggleLoading(true);
    var oldWidgetIds = getWidgetIdsFromData(data);

    if (oldWidgetIds.length) {
        await clusterWidgets(oldWidgetIds, false);
    }
    toggleLoading(false);
    loadTagSelectOptions();
    listWords();
}

function moreButtonClicked(e) {
    show = false;

    if ($(e).parent().children('.more-dropmenu').css('display') == 'none') {
        show = true;
    } else {
        show = false;
    }

    $('.more-dropmenu').hide();

    if (show) $(e).parent().children('.more-dropmenu').show();
    else $(e).parent().children('.more-dropmenu').hide();
}

$('#countWordApply').on('click', (e) => {
    listWords();
});

document.addEventListener('paste', event => createStickyNote(event))
document.addEventListener('cut', event => createStickyNote(event))

function pastedata(e) {
    var pastedText = e.clipboardData.getData('Text');
    console.log(pastedText)
}

async function createStickyNote(e) {
    // navigator.clipboard.readText()
    // .then(text => {
    //     debugger
    //     var texts = text.split('\t')
    //     console.log(texts)
    //     for(i=0;i<texts.length;i++) {
    //         var items = texts[i].split('<br>')
    //         console.log(items)
    //     }

    // })
    var text = e.clipboardData.getData('Text');
    var texts = text.split('\t')
    var array = []
    for(i=0;i<texts.length;i++) {
        var items = texts[i].split('<br>')
        array.push(items)
    }
    var viewport = await miro.board.viewport.get()
    for(i=0;i<array.length;i++) {
        var tags = await getTags();
        var x = 320*(i%3), y = 320*(Math.ceil((i+1)/3)-1)
        var test = await miro.board.widgets.create({
            type: 'sticker',
            text: array[i][0]+'<br>'+array[i][2]+'<br>'+'<a href="'+array[i][3].split('Source: ')[1]+'">Source</a><br>'+'<a href="'+array[i][4].split('Datasheet: ')[1]+'">Datasheet</a><br>',
            x: viewport.x + x + viewport.width / 2,
            y: viewport.y + y + viewport.height / 2,
            width: 300,
            height: 300,
            }
        )

        var index = tags.findIndex((tag) => tag.title == array[i][1].split("Code: #")[1])

        if (index <=  -1) {
            var tag1 = await miro.board.tags.create({
                color: randomColor(),
                title: array[i][1].split('Code: #')[1],
                widgetIds: [test[0].id]
            });
            await miro.board.tags.update(tag1);
        } else {
            tags[index].widgetIds = tags[index].widgetIds.concat(test[0].id)
            await miro.board.tags.update(tags[index]);
        }
    } 
    
}
// Arrage tags exported from google sheet
