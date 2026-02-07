<script>
document.addEventListener("DOMContentLoaded", function () {
    fetch("assets/papers/publications.json")
      .then(response => response.json())
      .then(data => {
        let journalContainer = document.getElementById("collapseJournalPapers").querySelector(".accordion-body");
        let conferenceContainer = document.getElementById("collapseConferenceProceedings").querySelector(".accordion-body");

        journalContainer.innerHTML = ""; 
        conferenceContainer.innerHTML = "";

        data.forEach((paper, index) => {
          let paperHTML = `
            <strong>${index + 1}. ${paper.title}</strong> <br>
            <em>${paper.author}</em> (${paper.year}). 
            ${paper.journal ? `<i>${paper.journal}</i>.` : ""}
            ${paper.conference ? `<i>${paper.conference}</i>.` : ""}
            ${paper.publisher ? `<i>${paper.publisher}</i>.` : ""}
            ${paper.doi ? ` <a href="https://doi.org/${paper.doi}" target="_blank">DOI</a>` : ""}
            ${paper.url ? ` <a href="${paper.url}" target="_blank">Read More</a>` : ""}
            <hr>
          `;

          if (paper.type === "article") {
            journalContainer.innerHTML += paperHTML;
          } else if (paper.type === "inproceedings") {
            conferenceContainer.innerHTML += paperHTML;
          }
        });
      })
      .catch(error => console.error("Error loading publications:", error));
});
</script>
