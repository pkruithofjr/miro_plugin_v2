function loadTabNotes() {
    toggleLoading(true);
    $("#tagViewList").empty()
    getTags().then((tags) => {
        tags.forEach((tag) => {
            $("#tagViewList").append(
                `<div class="cs1 ce12 placeholder">
                    <button class="button button-secondary tag-button button-small" style="font-weight:700;color:white;margin-bottom:0px;background-color:${tag.color};" tag-id="${tag.id}" onclick="SelectButton()">
                        ${tag.title}
                        <span class="icon-edit" style="opacity:40%;"></span>
                    </button>
                </div>`)
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

