function loadTagList() {
    toggleLoading();
    getTags().then((tags) => {
        $('#tagList').html('');
        tags.forEach((tag) => {
            $('#tagList').append(
                ` <li title="${tag.title}" id="${tag.id}">
                    <a href="#">
                        <div class="word-name">${tag.title}</div> &nbsp;
                    </a>
                    <div class="action">
                        <button class="btn button-icon button-icon-small icon-tile" title="Cluster stickies of this tag" onClick='clusterStickiesOfTag("${tag.id}")'></button>
                        <button class="btn button-icon button-icon-small icon-pin" title="Add a Tag to selection" onClick='addTagToSelectedStickies("${tag.id}")'></button>
                        <button class="btn button-icon button-icon-small icon-trash" title="Delete a tag" onClick='deleteTag("${tag.id}")'></button>
                    </div>
                </li>`
            );
        });
        toggleLoading(false);
    });
}

$('#searchApply').on('click', async function () {
    toggleLoading(true);

    var text = $('#searchKeywords').val();
    var keywords = text.split(',').filter((word) => word !== '');

    var stickies = await getStickies();

    var selectedWidgets = await filterCopies(stickies);
    var selectedWidgets = selectedWidgets.filter((sticky) => {
        return keywords.some((word) => sticky.content.toLowerCase().indexOf(word.toLowerCase()) > -1);
    });
    var selectedIds = selectedWidgets.map((sticky) => sticky.id);

    if (selectedIds.length) {
        await focusOnWidgets(selectedWidgets);
    }

    toggleLoading(false);
});

$('#createTagApply').on('click', async function () {
    toggleLoading(true);
    await miro.board.setAppData('focusedTagName', "Tag");

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
    });
    toggleLoading(false);
});

// $('#duplicateSearchedResultButton').on('click', async function () {
//     toggleLoading(true);

//     var newTagName = $('#newTagNameForSearch').val();

//     if (await checkValidatationOfTagName(newTagName)) {
//         var selectedStickies = await miro.board.selection.get();
//         selectedStickies = filterCopies(selectedStickies)
//         var newWidgets = await clusterWidgets(
//             selectedStickies.map((widget) => widget.id),
//             false
//         );
//         await miro.board.tags.create({
//             color: randomColor(),
//             title: newTagName,
//             widgetIds: newWidgets.map((widget) => widget.id),
//         });
//     }

//     loadTagList();
//     toggleLoading(false);
// });

// async function checkValidatationOfTagName(name) {
//     name = name.toLowerCase();
//     if (name != '') {
//         var tags = await getTags();
//         if (tags.findIndex((tag) => tag.title.toLowerCase() == name) == -1 && name != 'tag') {
//             return true;
//         } else {
//             miro.showErrorNotification('Your new tag name is existed already.');
//         }
//     } else {
//         miro.showErrorNotification('Please enter your new tag name.');
//     }
//     return false;
// }

async function deleteTag(tagId) {
    var currentTag = await miro.board.getById(tagId)
    await miro.board.remove(currentTag)
    $("#"+tagId).remove()
}

async function addTagToSelectedStickies(tagId) {
    toggleLoading(true);

    var tags = await getTags();
    var index = tags.findIndex((tag) => tag.id == tagId);

    if (index > -1) {
        var selectedStickies = await miro.board.getSelection();
        selectedStickies = await filterCopies(selectedStickies);
        console.log(selectedStickies)
        console.log(tags[index])
        selectedStickies.map((widget) => {
            widget.tagIds.push(tags[index].id)
            console.log(tags[index].id)
            widget.sync()
        })
    }

    toggleLoading(false);
}

async function clusterStickiesOfTag(tagId) {
    toggleLoading(true);

    stickies = await getStickies();
    stickies = await filterCopies(stickies);
    await clusterWidgets(stickies.filter((widget) => widget.tagIds.some((tag) => tag == tagId)).map((widget) => widget.id));

    toggleLoading(false);
}
