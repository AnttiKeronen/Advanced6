const form = document.getElementById("offerForm");
const offersContainer = document.getElementById("offersContainer");
async function loadOffers() {
  offersContainer.innerHTML = "";
  const res = await fetch("/offers");
  const offers = await res.json();
  offers.forEach((offer) => {
    const colDiv = document.createElement("div");
    colDiv.classList.add("offerDiv", "col", "s12", "m6", "l4");
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", "hoverable");
    const cardImageDiv = document.createElement("div");
    cardImageDiv.classList.add("card-image");
    const img = document.createElement("img");
    img.classList.add("responsive-img");
    if (offer.image && offer.image.path) {
      const src = offer.image.path.replace("public", "");
      img.src = src;
    } else {
      img.src =
        "https://via.placeholder.com/300x200?text=No+Image";
    }
    const titleSpan = document.createElement("span");
    titleSpan.classList.add("card-title");
    titleSpan.textContent = offer.title;
    cardImageDiv.appendChild(img);
    cardImageDiv.appendChild(titleSpan);
    const cardContentDiv = document.createElement("div");
    cardContentDiv.classList.add("card-content");
    const priceP = document.createElement("p");
    priceP.textContent = `Price: ${offer.price} €`;
    const descP = document.createElement("p");
    descP.textContent = offer.description;
    cardContentDiv.appendChild(priceP);
    cardContentDiv.appendChild(descP);
    cardDiv.appendChild(cardImageDiv);
    cardDiv.appendChild(cardContentDiv);
    colDiv.appendChild(cardDiv);
    offersContainer.appendChild(colDiv);
  });
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const res = await fetch("/upload", {
    method: "POST",
    body: formData
  });
  if (res.ok) {
    form.reset();
    if (M && M.updateTextFields) {
      M.updateTextFields();
    }
    loadOffers(); 
  } else {
    alert("Failed to upload offer");
  }
});
document.addEventListener("DOMContentLoaded", () => {
  loadOffers();
});
