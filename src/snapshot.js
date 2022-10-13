function addSnapshotList(snapshot) {
    $('#snapshotList').append(`
        <li class="menu-item" title="${snapshot.name}">
            <a href="#" onclick='moveToSnapshot(${snapshot.id})'>
                <div class="word-name">${snapshot.name}</div>
                &nbsp;
            </a>
            <div class="action">
                <button class="btn button-icon button-icon-small icon-photo" title="Update with current view" onclick='updateSnapshot(${snapshot.id})'></button>
                <button class="btn button-icon button-icon-small icon-trash" title="Remove" onclick='removeSnapshot(${snapshot.id})'></button>
            </div>
        </li>
    `);
}

function loadSnapshotsToList() {
    toggleLoading();
    getSnapshots().then((snapshots) => {
        $('#snapshotList').html('');
        if (snapshots && snapshots.length) {
            snapshots.forEach((snapshot) => {
                addSnapshotList(snapshot);
            });
        }
        toggleLoading(false);
    });
}

async function getSnapshotById(snapshotId) {
    var snapshots = await getSnapshots();
    var snapshotIndex = snapshots.findIndex((item) => item.id == snapshotId);
    return snapshots[snapshotIndex];
}

function convertId(prev, next, now) {
    var res = []
    for(i=0;i<now.length;i++) {
        res.push(next[prev.indexOf(now[i])])
    }
    return res
}

async function moveToSnapshot(snapshotId) {
    if (confirm("You will lose all of the current stickies and you'd better take a new snapshot of the current board. Do you want to reset and load this snapshot?")) {
        toggleLoading(true);

        var snapshot = await getSnapshotById(snapshotId);
        var oldTags = await getTags();
        var oldStickies = await getStickies();
        var oldThemes = await getThemes();

        oldTags.forEach(async (tag) => {
            await miro.board.remove(tag);
        })
        oldStickies.forEach(async (sticky) => {
            await miro.board.remove(sticky);
        })
        oldThemes.forEach(async (theme) => {
            await miro.board.remove(theme)
        })

        var newTags = []
        var prevTags = []
        for(i=0;i<snapshot.tags.length;i++) {
            newTag = await miro.board.createTag({color: snapshot.tags[i].color, title: snapshot.tags[i].title})
            prevTags.push(snapshot.tags[i].id)
            newTags.push(newTag.id)
        }
        var newThemes = [], oldThemes = []
        for(i=0;i<snapshot.themes.length;i++) {
            oldThemes.push(snapshot.themes[i].id)
            const newTheme = await miro.board.createFrame({
                title: snapshot.themes[i].title,
                x: snapshot.themes[i].x,
                y: snapshot.themes[i].y,
                width: snapshot.themes[i].width,
                height: snapshot.themes[i].height
            })
            newThemes.push(newTheme.id)
        }
        for(i=0;i<snapshot.stickies.length;i++) {
            var newNote = snapshot.stickies[i]
            delete newNote.id
            delete newNote.height
            var res = []
            for(j=0;j<newNote.tagIds.length;j++) {
                res.push(newTags[prevTags.indexOf(newNote.tagIds[j])])
            }
            if(newNote.parentId) {
                newNote.parentId = newThemes[oldThemes.indexOf(newNote.parentId)]
            }
            newNote.tagIds = res
            await miro.board.createStickyNote(newNote)
        }
        toggleLoading(false);
    }
}

async function updateSnapshot(snapshotId) {
    toggleLoading(true);

    var stickies = await getStickies();
    var tags = await getTags();
    var themes = await getThemes();
    var snapshot = await getSnapshotById(snapshotId);

    miro.board.getAppData("snapshots").then(async (metadata) => {
        var index = metadata.findIndex((item) => item.id == snapshot.id);
        snapshots = metadata
        if (index > -1) {

            snapshots[index].stickies = stickies;
            snapshots[index].tags = tags;
            snapshots[index].themes = themes;
        }
        await miro.board.setAppData("snapshots", snapshots)

        toggleLoading(false);
        loadSnapshotsToList();
    });

    miro.board.metadata.get().then(async (metadata) => {
        var index = metadata[appId].snapshots.findIndex((item) => item.id == snapshot.id);

        if (index > -1) {
            metadata[appId].snapshots[index].stickies = stickies;
            metadata[appId].snapshots[index].tags = tags;
        }

        await miro.board.metadata.update({
            [appId]: {
                ...metadata[appId],
            },
        });

        toggleLoading(false);
        loadSnapshotsToList();
    });
}

function removeSnapshot(snapshotId) {
    toggleLoading(true);

    miro.board.getAppData("snapshots").then(async (metadata) => {
        var index = metadata.findIndex((item) => item.id == snapshotId);
        var snapshots = metadata
        if (index > -1) {
            snapshot = snapshots.splice(index, 1);
            await miro.board.setAppData("snapshots", snapshot)
        }
        
        toggleLoading(false);
        loadSnapshotsToList();
    })

    miro.board.metadata.get().then(async (metadata) => {
        var index = metadata[appId].snapshots.findIndex((item) => item.id == snapshotId);

        if (index > -1) {
            metadata[appId].snapshots.splice(index, 1);
        }

        await miro.board.metadata.update({
            [appId]: {
                ...metadata[appId],
            },
        });

        toggleLoading(false);
        loadSnapshotsToList();
    });
}

$('#addSnapshot').on('click', async () => {
    toggleLoading(true);

    await miro.board.setAppData('focusedSnapshotName','Snapshot')

    var stickies = await getStickies();
    var tags = await getTags();
    var themes = await getThemes();

    miro.board.ui.openModal({
        url: 'setSnapshotNameModal.html',
        width: 400,
        height: 250,
        fullscreen: false,
    }).then(() => {
        miro.board.getAppData("focusedSnapshotName").then(async (metadata) => {
            if (metadata) {
                snapshots = await miro.board.getAppData("snapshots")
                if (!snapshots || !snapshots.length) {
                    await miro.board.setAppData("snapshots", [])
                    snapshots = []
                }

                snapshots.push({
                    id: randomId(),
                    name: metadata,
                    stickies,
                    tags,
                    themes
                })
                await miro.board.setAppData('snapshots', snapshots)
                
                loadSnapshotsToList();
            }
            toggleLoading(false);
        });

        miro.board.metadata.get().then(async (metadata) => {
            if (metadata[appId].focusedSnapshotName) {
                if (!metadata[appId].snapshots || !metadata[appId].snapshots.length) metadata[appId].snapshots = [];

                metadata[appId].snapshots.push({
                    id: randomId(),
                    name: metadata[appId].focusedSnapshotName,
                    stickies,
                    tags,
                });

                await miro.board.metadata.update({
                    [appId]: {
                        ...metadata[appId],
                    },
                });

                loadSnapshotsToList();
            }
            toggleLoading(false);
        });
    });
});
