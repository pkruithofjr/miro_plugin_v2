function loadTabNotes() {
    toggleLoading(true);
    $("#tagViewList").empty()
    getTags().then((tags) => {
        tags.forEach((tag) => {
            $("#tagViewList").append(`<div class="cs1 ce12 placeholder">${tag}</div>`)
        })
    })
}