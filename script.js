const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Otvoriť navigáciu" : "Zavrieť navigáciu");
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Otvoriť navigáciu");
      navigation.classList.remove("is-open");
    }
  });
}

const menuGrid = document.querySelector("#menu-grid");
const menuSearch = document.querySelector("#menu-search");
const menuFilters = document.querySelector(".menu-filters");
const emptyMenuMessage = document.querySelector("#menu-empty");
const cartButton = document.querySelector(".cart-button");
const cartCount = document.querySelector(".cart-count");
const cartStatus = document.querySelector("#cart-status");
const cartDialog = document.querySelector("#cart-dialog");
const cartCloseButton = document.querySelector(".cart-close");
const cartItemsList = document.querySelector("#cart-items");
const cartEmptyMessage = document.querySelector("#cart-empty");
const cartTotal = document.querySelector("#cart-total");
const shoppingCart = new Map();

const getCartItemCount = () => Array.from(shoppingCart.values())
  .reduce((total, item) => total + item.quantity, 0);

const updateCart = () => {
  if (!cartItemsList || !cartEmptyMessage || !cartTotal) return;

  cartItemsList.replaceChildren();
  let totalPrice = 0;

  shoppingCart.forEach((item, name) => {
    const itemTotal = item.price * item.quantity;
    totalPrice += itemTotal;

    const listItem = document.createElement("li");
    listItem.className = "cart-item";

    const itemHeader = document.createElement("div");
    itemHeader.className = "cart-item-header";

    const itemName = document.createElement("h3");
    itemName.className = "cart-item-name";
    itemName.textContent = name;

    const itemPrice = document.createElement("strong");
    itemPrice.className = "cart-item-total";
    itemPrice.textContent = `${itemTotal} ₴`;
    itemHeader.append(itemName, itemPrice);

    const itemDetails = document.createElement("p");
    itemDetails.className = "cart-item-detail";
    itemDetails.textContent = `${item.size} · ${item.price} ₴ / ks`;

    const actions = document.createElement("div");
    actions.className = "cart-item-actions";

    const quantityControl = document.createElement("div");
    quantityControl.className = "cart-quantity-control";

    const decreaseButton = document.createElement("button");
    decreaseButton.type = "button";
    decreaseButton.dataset.cartAction = "decrease";
    decreaseButton.dataset.itemName = name;
    decreaseButton.setAttribute("aria-label", `Znížiť množstvo ${name}`);
    decreaseButton.textContent = "−";
    decreaseButton.disabled = item.quantity === 1;

    const quantity = document.createElement("span");
    quantity.className = "cart-quantity";
    quantity.setAttribute("aria-label", `${item.quantity} ks`);
    quantity.textContent = String(item.quantity);

    const increaseButton = document.createElement("button");
    increaseButton.type = "button";
    increaseButton.dataset.cartAction = "increase";
    increaseButton.dataset.itemName = name;
    increaseButton.setAttribute("aria-label", `Zvýšiť množstvo ${name}`);
    increaseButton.textContent = "+";

    quantityControl.append(decreaseButton, quantity, increaseButton);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "cart-item-remove";
    removeButton.dataset.cartAction = "remove";
    removeButton.dataset.itemName = name;
    removeButton.setAttribute("aria-label", `Odstrániť ${name} z košíka`);
    removeButton.textContent = "Odstrániť";

    actions.append(quantityControl, removeButton);
    listItem.append(itemHeader, itemDetails, actions);
    cartItemsList.append(listItem);
  });

  const itemCount = getCartItemCount();
  cartEmptyMessage.hidden = shoppingCart.size > 0;
  cartTotal.textContent = `${totalPrice} ₴`;

  if (cartCount) {
    cartCount.textContent = String(itemCount);
    cartCount.hidden = itemCount === 0;
  }
  if (cartButton) cartButton.setAttribute("aria-label", `Košík, položiek: ${itemCount}`);
};

const openCart = () => {
  if (!cartDialog) return;
  if (!cartDialog.open) cartDialog.showModal();
  if (cartButton) cartButton.setAttribute("aria-expanded", "true");
};

if (cartButton && cartDialog) {
  cartButton.addEventListener("click", openCart);
  cartDialog.addEventListener("close", () => {
    cartButton.setAttribute("aria-expanded", "false");
  });
  cartDialog.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
  });
}

if (cartCloseButton && cartDialog) {
  cartCloseButton.addEventListener("click", () => cartDialog.close());
}

if (cartItemsList) {
  cartItemsList.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const actionButton = event.target.closest("[data-cart-action]");
    if (!(actionButton instanceof HTMLButtonElement)) return;

    const itemName = actionButton.dataset.itemName;
    const item = itemName ? shoppingCart.get(itemName) : undefined;
    if (!item || !itemName) return;

    if (actionButton.dataset.cartAction === "increase") {
      item.quantity += 1;
    } else if (actionButton.dataset.cartAction === "decrease" && item.quantity > 1) {
      item.quantity -= 1;
    } else if (actionButton.dataset.cartAction === "remove") {
      shoppingCart.delete(itemName);
    }

    updateCart();
  });
}

if (menuGrid && menuSearch && menuFilters && emptyMenuMessage) {
  const cards = Array.from(menuGrid.querySelectorAll(".menu-card"));
  const filters = Array.from(menuFilters.querySelectorAll(".menu-filter"));
  let activeCategory = "all";

  const normalize = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sk");

  const filterCards = () => {
    const searchTerm = normalize(menuSearch.value.trim());
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
      const searchableText = normalize(`${card.dataset.search || ""} ${card.textContent || ""}`);
      const matchesSearch = searchableText.includes(searchTerm);
      const isVisible = matchesCategory && matchesSearch;

      card.hidden = !isVisible;
      visibleCount += Number(isVisible);
    });

    emptyMenuMessage.hidden = visibleCount > 0;
  };

  menuSearch.addEventListener("input", filterCards);

  menuFilters.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const selectedFilter = event.target.closest(".menu-filter");
    if (!(selectedFilter instanceof HTMLButtonElement)) return;

    activeCategory = selectedFilter.dataset.category || "all";
    filters.forEach((filter) => {
      const isActive = filter === selectedFilter;
      filter.classList.toggle("is-active", isActive);
      filter.setAttribute("aria-pressed", String(isActive));
    });
    filterCards();
  });

  menuGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;

    const card = button.closest(".menu-card");
    const quantityOutput = card?.querySelector(".item-quantity");
    if (!card || !(quantityOutput instanceof HTMLOutputElement)) return;

    const quantity = Number(quantityOutput.value || quantityOutput.textContent);
    const quantityChange = Number(button.dataset.quantityChange);

    if (Number.isFinite(quantityChange)) {
      quantityOutput.value = String(Math.max(1, quantity + quantityChange));
      quantityOutput.textContent = quantityOutput.value;
      return;
    }

    if (!button.classList.contains("add-to-cart")) return;

    const itemName = card.querySelector("h3")?.textContent?.trim() || "Položka";
    const price = Number(card.dataset.price);
    const size = card.querySelector(".menu-size")?.textContent?.trim() || "";

    if (!Number.isSafeInteger(price) || price < 0 || !size) {
      if (cartStatus) cartStatus.textContent = `Položku ${itemName} sa nepodarilo pridať do košíka.`;
      return;
    }

    const existingItem = shoppingCart.get(itemName);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      shoppingCart.set(itemName, { price, size, quantity });
    }

    updateCart();
    if (cartStatus) cartStatus.textContent = `Pridané do košíka: ${itemName}, ${quantity} ks.`;
    openCart();
  });
}

const reservationForm = document.querySelector("#reservation-form");
const reservationDateInput = document.querySelector("#reservation-date");
const reservationConfirmation = document.querySelector("#reservation-confirmation");
const reservationConfirmationTitle = document.querySelector("#reservation-confirmation-title");
const reservationConfirmationDetails = document.querySelector("#reservation-confirmation-details");

if (reservationDateInput instanceof HTMLInputElement) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  reservationDateInput.min = today.toISOString().slice(0, 10);
}

if (
  reservationForm instanceof HTMLFormElement
  && reservationConfirmation instanceof HTMLElement
  && reservationConfirmationTitle instanceof HTMLElement
  && reservationConfirmationDetails instanceof HTMLElement
) {
  const nameInput = reservationForm.querySelector("#reservation-name");
  const dateInput = reservationForm.querySelector("#reservation-date");
  const timeInput = reservationForm.querySelector("#reservation-time");
  const guestsSelect = reservationForm.querySelector("#reservation-guests");

  if (
    nameInput instanceof HTMLInputElement
    && dateInput instanceof HTMLInputElement
    && timeInput instanceof HTMLInputElement
    && guestsSelect instanceof HTMLSelectElement
  ) {
    reservationForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!reservationForm.reportValidity()) return;

      const name = nameInput.value.trim();
      if (!name) {
        nameInput.setCustomValidity("Zadajte svoje meno a priezvisko.");
        nameInput.reportValidity();
        nameInput.setCustomValidity("");
        return;
      }

      const selectedGuests = guestsSelect.selectedOptions.item(0);
      if (!selectedGuests) {
        guestsSelect.reportValidity();
        return;
      }

      const [year, month, day] = dateInput.value.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, day).toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      reservationConfirmationTitle.textContent = `Ďakujeme, ${name}!`;
      reservationConfirmationDetails.textContent = `Vaša žiadosť o stôl pre ${selectedGuests.textContent?.trim()} na ${formattedDate} o ${timeInput.value} bola zaznamenaná.`;
      reservationConfirmation.hidden = false;
      reservationConfirmation.focus({ preventScroll: true });
      reservationConfirmation.scrollIntoView({ block: "center" });
    });
  }
}

const reviewForm = document.querySelector("#review-form");
const reviewsGrid = document.querySelector(".reviews-grid");
const reviewFormStatus = document.querySelector("#review-form-status");
const reviewsStorageKey = "u-josefa-reviews";

if (
  reviewForm instanceof HTMLFormElement
  && reviewsGrid instanceof HTMLElement
  && reviewFormStatus instanceof HTMLElement
) {
  const nameInput = reviewForm.querySelector("#review-name");
  const ratingSelect = reviewForm.querySelector("#review-rating");
  const textInput = reviewForm.querySelector("#review-text");

  const isReview = (value) => (
    typeof value === "object"
    && value !== null
    && typeof value.name === "string"
    && value.name.trim().length > 0
    && Number.isInteger(value.rating)
    && value.rating >= 1
    && value.rating <= 5
    && typeof value.text === "string"
    && value.text.trim().length > 0
    && typeof value.date === "string"
    && !Number.isNaN(Date.parse(value.date))
  );

  const createReviewCard = (review) => {
    const card = document.createElement("article");
    card.className = "review-card";

    const header = document.createElement("header");
    header.className = "review-card-header";

    const person = document.createElement("div");
    person.className = "review-person";

    const avatar = document.createElement("span");
    avatar.className = "review-avatar";
    avatar.setAttribute("aria-hidden", "true");
    const initials = review.name.trim().split(/\s+/).slice(0, 2)
      .map((part) => Array.from(part)[0] || "")
      .join("")
      .toLocaleUpperCase("sk-SK");
    avatar.textContent = initials;

    const personDetails = document.createElement("div");
    const name = document.createElement("h4");
    name.textContent = review.name.trim();

    const date = document.createElement("time");
    date.dateTime = review.date;
    date.textContent = new Date(review.date).toLocaleDateString("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    personDetails.append(name, date);
    person.append(avatar, personDetails);

    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.setAttribute("role", "img");
    stars.setAttribute("aria-label", `${review.rating} z 5 hviezdičiek`);
    const starDisplay = document.createElement("span");
    starDisplay.setAttribute("aria-hidden", "true");
    starDisplay.textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`;
    stars.append(starDisplay);
    header.append(person, stars);

    const quote = document.createElement("blockquote");
    const paragraph = document.createElement("p");
    paragraph.textContent = review.text.trim();
    quote.append(paragraph);
    card.append(header, quote);
    return card;
  };

  try {
    const storedReviews = localStorage.getItem(reviewsStorageKey);
    if (storedReviews) {
      const parsedReviews = JSON.parse(storedReviews);
      if (!Array.isArray(parsedReviews) || !parsedReviews.every(isReview)) {
        throw new Error("Uložené hodnotenia majú neplatný formát.");
      }
      parsedReviews.forEach((review) => reviewsGrid.append(createReviewCard(review)));
    }
  } catch {
    reviewFormStatus.textContent = "Uložené hodnotenia sa nepodarilo načítať.";
  }

  if (
    nameInput instanceof HTMLInputElement
    && ratingSelect instanceof HTMLSelectElement
    && textInput instanceof HTMLTextAreaElement
  ) {
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!reviewForm.reportValidity()) return;

      const name = nameInput.value.trim();
      const text = textInput.value.trim();
      const rating = Number(ratingSelect.value);
      if (!name || !text || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        reviewFormStatus.textContent = "Skontrolujte, prosím, vyplnené údaje.";
        return;
      }

      const review = { name, rating, text, date: new Date().toISOString() };
      reviewsGrid.append(createReviewCard(review));

      try {
        const storedReviews = localStorage.getItem(reviewsStorageKey);
        const parsedReviews = storedReviews ? JSON.parse(storedReviews) : [];
        if (!Array.isArray(parsedReviews) || !parsedReviews.every(isReview)) {
          throw new Error("Uložené hodnotenia majú neplatný formát.");
        }
        parsedReviews.push(review);
        localStorage.setItem(reviewsStorageKey, JSON.stringify(parsedReviews));
        reviewFormStatus.textContent = "Ďakujeme za vaše hodnotenie. Bolo pridané a uložené v tomto zariadení.";
      } catch {
        reviewFormStatus.textContent = "Hodnotenie bolo pridané, ale nepodarilo sa ho uložiť v tomto zariadení.";
      }

      reviewForm.reset();
    });
  }
}
