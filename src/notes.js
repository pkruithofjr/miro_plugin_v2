function loadTabNotes() {
    toggleLoading(true);
    $("#tagViewList").empty()
    getTags().then((tags) => {
        tags.forEach((tag) => {
            $("#tagViewList").append(
                `<div class="cs1 ce12 placeholder">
                    <button class="button button-secondary tag-button button-small" style="margin-bottom:0px;background-color:${tag.color};" tag-id="${tag.id}" onclick="SelectButton()">
                        ${tag.title}
                        <span class="icon-edit" style="opacity:70%;"></span>
                    </button>
                </div>`)
        })
        document.querySelectorAll('.tag-button').forEach((button) => {
            button.onclick = function() {
                this.classList.add('selected')
            }
        })
        toggleLoading(false);
    })
}

