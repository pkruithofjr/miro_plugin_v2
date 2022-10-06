function loadTabNotes() {
    toggleLoading(true);
    $("#tagViewList").empty()
    getTags().then((tags) => {
        tags.forEach((tag) => {
            $("#tagViewList").append(
                `
                    <button class="button button-primary tag-button button-small" style="font-weight:700;color:white;margin-bottom:0px;" tag-id="${tag.id}" onclick="SelectButton()">
                        ${tag.title}
                        <span class="icon-edit" style="opacity:40%;"></span>
                    </button>
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

$("#addSticky").click(async function() {
    var tags = document.querySelectorAll('.tag-button')
    var tagIds = []
    for(tag of tags) {
        if(tag.classList.length == 5) {
            tagIds.push(tag.getAttribute('tag-id'))
        }
    }
    var viewport = await miro.board.viewport.get()
    const note = await miro.board.createStickyNote({
        content: $("#noteContent").val(),
        shape: 'square',
        x: viewport.x + viewport.width / 2,
        y: viewport.y + viewport.height / 2,
        tagIds: tagIds
    })
})