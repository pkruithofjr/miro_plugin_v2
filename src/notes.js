function loadTabNotes() {
    toggleLoading(true);
    $("#tagViewList").empty()
    getTags().then((tags) => {
        tags.forEach((tag) => {
            $("#tagViewList").append(
                `<div class="cs1 ce12 placeholder">
                    <button class="button button-secondary tag-button" style="background-color:${tag.color};">
                        <span class="icon-tag"></span>
                        ${tag.title}
                    <button>
                </div>`)
        })
    })
}

$(".tag-button").click(function() {
    this.classList.add('selected')
})