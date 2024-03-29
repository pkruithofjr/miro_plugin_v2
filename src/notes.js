function loadTabNotes() {
    toggleLoading(true);
    var colors = {
        red: "#f24726",
        magenta: "#da0063",
        violet: "	#9510ac",
        light_green: "#cee741",
        green: "#8fd14f",
        dark_green: "#0ca789",
        cyan: "#12cdd4",
        blue: "#2d9bf0",
        dark_blue: "#414bb2",
        yellow: "#fac710",
        gray: "#808080",
        black:"#1a1a1a"
    }
    $("#tagViewList").empty()
    getTags().then((tags) => {
        tags.forEach((tag) => {
            $("#tagViewList").append(
                `
                    <div class="tag-edit-div button-primary tag-button button-small" style="font-weight:700;color:white;margin-bottom:0px;background-color:${colors[tag.color]};" tag-id="${tag.id}">
                        ${tag.title}
                        <button class="icon-edit" style="opacity:40%;width: 24px;height: 24px;background-color: #00000000;border-color: #00000000;" onclick="editTagDetail('${tag.id}')"></button>
                    </div>
                `)
        })
        document.querySelectorAll('.tag-button').forEach((button) => {
            button.onclick = function() {
                if(this.classList.length == 4) {
                    this.classList.add('selected')
                } else {
                    this.classList.remove('selected')
                }
            }
        })
        toggleLoading(false);
    })
}

async function editTagDetail(tagId) {
    var currentTag = await miro.board.getById(tagId)
    await miro.board.setAppData('editTagName', currentTag.title)
    miro.board.ui.openModal({
        url: 'editTagNameModal.html',
        width: 400,
        height: 250,
        fullscreen: false,
    }).then(() => {
        miro.board.getAppData("editTagName").then(async (metadata) => {
            if (metadata) {
                currentTag.title = metadata
                currentTag.sync()
                loadTabNotes();
            }
        })
    })
}

$("#addSticky").click(async function() {
    var tags = document.querySelectorAll('.tag-button')
    var tagIds = []
    for(tag of tags) {
        if(tag.classList.length == 5) {
            tagIds.push(tag.getAttribute('tag-id'))
        }
    }
    var viewport = await miro.board.viewport.get()
    if($("#noteContent").val() != "") {
        const note = await miro.board.createStickyNote({
            content: $("#noteContent").val(),
            shape: 'square',
            x: viewport.x + viewport.width * Math.random(),
            y: viewport.y + viewport.height * Math.random(),
            tagIds: tagIds
        })
        await miro.board.viewport.zoomTo(note)
        $("#noteContent").val("")
        $("#noteContent").focus()
    }
})

document.getElementById('noteContent').addEventListener('keypress', function(event) {
    if(event.key === 'Enter') {
        event.preventDefault()
        document.getElementById('addSticky').click()
    }
})