const yearEl = document.getElementById("year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

const galleryModal = document.getElementById("galleryModal");
const galleryImage = document.getElementById("galleryImage");
const galleryCounter = document.getElementById("galleryCounter");
const galleryCaption = document.getElementById("galleryCaption");
const galleryClose = document.getElementById("galleryClose");
const galleryPrev = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");

let activeImages = [];
let activeIndex = 0;
let activeTitle = "";
let activeDescription = "";
let sliderInterval = null;

function encodePath(path) {
    return encodeURI(path).replace(/#/g, "%23");
}

function setSliderAutoplay() {
    clearSliderAutoplay();

    if (activeImages.length < 2) {
        return;
    }

    sliderInterval = window.setInterval(() => {
        nextGalleryImage(1);
    }, 2800);
}

function clearSliderAutoplay() {
    if (sliderInterval) {
        window.clearInterval(sliderInterval);
        sliderInterval = null;
    }
}

function updateGalleryView() {
    if (!galleryImage || !galleryCounter || activeImages.length === 0) {
        return;
    }

    galleryImage.classList.remove("slide-in");
    void galleryImage.offsetWidth;
    galleryImage.src = encodePath(activeImages[activeIndex]);
    galleryImage.classList.add("slide-in");
    galleryCounter.textContent = "Image " + (activeIndex + 1) + " / " + activeImages.length;

    if (galleryCaption) {
        galleryCaption.textContent = activeDescription ? activeTitle + " - " + activeDescription : activeTitle;
    }
}

function openGallery(images, startIndex, title, description) {
    if (!galleryModal || !images.length) {
        return;
    }

    activeImages = images;
    activeIndex = startIndex;
    activeTitle = title;
    activeDescription = description;
    updateGalleryView();
    galleryModal.classList.add("is-open");
    galleryModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setSliderAutoplay();
}

function closeGallery() {
    if (!galleryModal) {
        return;
    }

    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    clearSliderAutoplay();
}

function nextGalleryImage(step) {
    if (!activeImages.length) {
        return;
    }

    activeIndex = (activeIndex + step + activeImages.length) % activeImages.length;
    updateGalleryView();
}

const cards = document.querySelectorAll(".project-card[data-images]");
cards.forEach((card) => {
    const raw = card.getAttribute("data-images") || "";
    const images = raw.split(",").map((item) => item.trim()).filter(Boolean);
    const cardImage = card.querySelector(".project-image");
    const openBtn = card.querySelector(".gallery-open");
    const cardTitle = (card.querySelector("h3")?.textContent || "Project Folder").trim();
    const cardDesc = (card.querySelector(".project-body p")?.textContent || "Project screenshots gallery").replace(/\s+/g, " ").trim();

    if (cardImage) {
        cardImage.style.cursor = images.length > 1 ? "zoom-in" : "pointer";
        cardImage.addEventListener("click", () => openGallery(images, 0, cardTitle, cardDesc));
    }

    if (openBtn) {
        openBtn.addEventListener("click", () => openGallery(images, 0, cardTitle, cardDesc));
    }
});

const certificateCards = document.querySelectorAll(".certificate-card[data-images]");
certificateCards.forEach((card) => {
    const raw = card.getAttribute("data-images") || "";
    const images = raw.split(",").map((item) => item.trim()).filter(Boolean);
    const cardTitle = (card.querySelector(".certificate-label")?.textContent || "Certificate").trim();
    const cardDesc = "";

    if (!images.length) {
        return;
    }

    card.addEventListener("click", () => openGallery(images, 0, cardTitle, cardDesc));
    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openGallery(images, 0, cardTitle, cardDesc);
        }
    });
});

if (galleryClose) {
    galleryClose.addEventListener("click", closeGallery);
}

if (galleryPrev) {
    galleryPrev.addEventListener("click", () => {
        nextGalleryImage(-1);
        setSliderAutoplay();
    });
}

if (galleryNext) {
    galleryNext.addEventListener("click", () => {
        nextGalleryImage(1);
        setSliderAutoplay();
    });
}

if (galleryModal) {
    galleryModal.addEventListener("click", (event) => {
        if (event.target === galleryModal) {
            closeGallery();
        }
    });

    galleryModal.addEventListener("mouseenter", clearSliderAutoplay);
    galleryModal.addEventListener("mouseleave", setSliderAutoplay);
}

document.addEventListener("keydown", (event) => {
    if (!galleryModal || !galleryModal.classList.contains("is-open")) {
        return;
    }

    if (event.key === "Escape") {
        closeGallery();
    }

    if (event.key === "ArrowLeft") {
        nextGalleryImage(-1);
        setSliderAutoplay();
    }

    if (event.key === "ArrowRight") {
        nextGalleryImage(1);
        setSliderAutoplay();
    }
});

if (galleryImage) {
    galleryImage.addEventListener("error", () => {
        if (galleryCaption) {
            galleryCaption.textContent = activeTitle + " - image path not found for this screenshot.";
        }
    });
}

const snakeCanvas = document.getElementById("snakeCanvas");
const snakeScoreEl = document.getElementById("snakeScore");
const snakeBestEl = document.getElementById("snakeBest");
const snakeStateEl = document.getElementById("snakeState");
const snakeStatusEl = document.getElementById("snakeStatus");
const snakeStartBtn = document.getElementById("snakeStart");
const snakeResetBtn = document.getElementById("snakeReset");
const snakeUpBtn = document.getElementById("snakeUp");
const snakeDownBtn = document.getElementById("snakeDown");
const snakeLeftBtn = document.getElementById("snakeLeft");
const snakeRightBtn = document.getElementById("snakeRight");

const snakeBestStorageKey = "wassim_snake_best";

if (snakeCanvas instanceof HTMLCanvasElement) {
    const snakeCtx = snakeCanvas.getContext("2d");
    const gridSize = 16;
    const tileCount = snakeCanvas.width / gridSize;
    const tickMs = 120;

    let snake = [{ x: 8, y: 8 }];
    let direction = { x: 1, y: 0 };
    let pendingDirection = { x: 1, y: 0 };
    let food = { x: 12, y: 8 };
    let score = 0;
    let best = Number(window.localStorage.getItem(snakeBestStorageKey) || "0");
    let timer = null;
    let running = false;

    function setSnakeState(text) {
        if (snakeStateEl) {
            snakeStateEl.textContent = text;
        }
    }

    function setSnakeStatus(text) {
        if (snakeStatusEl) {
            snakeStatusEl.textContent = text;
        }
    }

    function paintCell(x, y, color) {
        if (!snakeCtx) {
            return;
        }

        snakeCtx.fillStyle = color;
        snakeCtx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
    }

    function drawSnakeBoard() {
        if (!snakeCtx) {
            return;
        }

        snakeCtx.fillStyle = "#08101c";
        snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

        snakeCtx.strokeStyle = "rgba(92, 247, 255, 0.08)";
        snakeCtx.lineWidth = 1;
        for (let i = 0; i <= tileCount; i += 1) {
            const p = i * gridSize;
            snakeCtx.beginPath();
            snakeCtx.moveTo(p, 0);
            snakeCtx.lineTo(p, snakeCanvas.height);
            snakeCtx.stroke();

            snakeCtx.beginPath();
            snakeCtx.moveTo(0, p);
            snakeCtx.lineTo(snakeCanvas.width, p);
            snakeCtx.stroke();
        }

        paintCell(food.x, food.y, "#ffac4d");

        snake.forEach((segment, index) => {
            paintCell(segment.x, segment.y, index === 0 ? "#8bff5a" : "#5cf7ff");
        });
    }

    function spawnFood() {
        let valid = false;

        while (!valid) {
            const next = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };

            valid = !snake.some((part) => part.x === next.x && part.y === next.y);
            if (valid) {
                food = next;
            }
        }
    }

    function updateSnakeUi() {
        if (snakeScoreEl) {
            snakeScoreEl.textContent = String(score);
        }

        if (snakeBestEl) {
            snakeBestEl.textContent = String(best);
        }
    }

    function applyDirection(nextX, nextY) {
        if (nextX === -direction.x && nextY === -direction.y) {
            return;
        }

        pendingDirection = { x: nextX, y: nextY };
    }

    function stopSnake() {
        if (timer) {
            window.clearInterval(timer);
            timer = null;
        }

        running = false;
        setSnakeState("Stopped");
        if (snakeStartBtn) {
            snakeStartBtn.textContent = "Start";
        }
    }

    function gameOverSnake() {
        stopSnake();
        setSnakeState("Game Over");
        setSnakeStatus("Game over. Press Start to play again.");
    }

    function snakeTick() {
        direction = pendingDirection;
        const head = snake[0];
        const nextHead = {
            x: head.x + direction.x,
            y: head.y + direction.y
        };

        if (nextHead.x < 0 || nextHead.x >= tileCount || nextHead.y < 0 || nextHead.y >= tileCount) {
            gameOverSnake();
            drawSnakeBoard();
            return;
        }

        if (snake.some((part) => part.x === nextHead.x && part.y === nextHead.y)) {
            gameOverSnake();
            drawSnakeBoard();
            return;
        }

        snake.unshift(nextHead);

        if (nextHead.x === food.x && nextHead.y === food.y) {
            score += 1;

            if (score > best) {
                best = score;
                window.localStorage.setItem(snakeBestStorageKey, String(best));
                setSnakeStatus("New best score: " + best + ".");
            } else {
                setSnakeStatus("Nice. Keep going.");
            }

            updateSnakeUi();
            spawnFood();
        } else {
            snake.pop();
        }

        drawSnakeBoard();
    }

    function resetSnake() {
        stopSnake();
        snake = [{ x: 8, y: 8 }];
        direction = { x: 1, y: 0 };
        pendingDirection = { x: 1, y: 0 };
        score = 0;
        spawnFood();
        updateSnakeUi();
        setSnakeState("Ready");
        setSnakeStatus("Press Start to play Snake.");
        drawSnakeBoard();
    }

    function startSnake() {
        if (running) {
            return;
        }

        running = true;
        setSnakeState("Running");
        setSnakeStatus("Avoid walls and your own tail.");
        if (snakeStartBtn) {
            snakeStartBtn.textContent = "Running";
        }

        timer = window.setInterval(snakeTick, tickMs);
    }

    if (snakeStartBtn) {
        snakeStartBtn.addEventListener("click", startSnake);
    }

    if (snakeResetBtn) {
        snakeResetBtn.addEventListener("click", resetSnake);
    }

    if (snakeUpBtn) {
        snakeUpBtn.addEventListener("click", () => applyDirection(0, -1));
    }

    if (snakeDownBtn) {
        snakeDownBtn.addEventListener("click", () => applyDirection(0, 1));
    }

    if (snakeLeftBtn) {
        snakeLeftBtn.addEventListener("click", () => applyDirection(-1, 0));
    }

    if (snakeRightBtn) {
        snakeRightBtn.addEventListener("click", () => applyDirection(1, 0));
    }

    document.addEventListener("keydown", (event) => {
        if (!running && event.key !== " ") {
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            applyDirection(0, -1);
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            applyDirection(0, 1);
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            applyDirection(-1, 0);
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            applyDirection(1, 0);
        }

        if (event.key === " ") {
            event.preventDefault();
            if (!running) {
                startSnake();
            }
        }
    });

    updateSnakeUi();
    drawSnakeBoard();
}

const reflexBtn = document.getElementById("reflexBtn");
const reflexStatusEl = document.getElementById("reflexStatus");
const reflexStateEl = document.getElementById("reflexState");
const bestReflexEl = document.getElementById("bestReflex");
const lastReflexEl = document.getElementById("lastReflex");

let reflexBest = null;
let reflexReady = false;
let reflexWaiting = false;
let reflexStartTime = 0;
let reflexTimer = null;

function setReflexState(text) {
    if (reflexStateEl) {
        reflexStateEl.textContent = text;
    }
}

if (reflexBtn) {
    reflexBtn.addEventListener("click", () => {
        if (reflexReady) {
            const reaction = Math.round(performance.now() - reflexStartTime);
            reflexReady = false;
            setReflexState("Ready");

            if (lastReflexEl) {
                lastReflexEl.textContent = reaction + " ms";
            }

            if (reflexBest === null || reaction < reflexBest) {
                reflexBest = reaction;
                if (bestReflexEl) {
                    bestReflexEl.textContent = reaction + " ms";
                }
                if (reflexStatusEl) {
                    reflexStatusEl.textContent = "New high score. " + reaction + " ms.";
                }
            } else if (reflexStatusEl) {
                reflexStatusEl.textContent = "Reaction time: " + reaction + " ms.";
            }

            reflexBtn.textContent = "Start Round";
            return;
        }

        if (reflexWaiting) {
            reflexWaiting = false;
            if (reflexTimer) {
                window.clearTimeout(reflexTimer);
                reflexTimer = null;
            }

            setReflexState("Too Soon");
            if (reflexStatusEl) {
                reflexStatusEl.textContent = "Too early. Wait for GO before clicking.";
            }

            reflexBtn.textContent = "Start Round";
            return;
        }

        reflexWaiting = true;
        setReflexState("Waiting");
        if (reflexStatusEl) {
            reflexStatusEl.textContent = "Get ready. Wait for GO...";
        }
        reflexBtn.textContent = "Wait...";

        const delay = 1000 + Math.floor(Math.random() * 2200);
        reflexTimer = window.setTimeout(() => {
            reflexWaiting = false;
            reflexReady = true;
            reflexStartTime = performance.now();

            setReflexState("GO");
            if (reflexStatusEl) {
                reflexStatusEl.textContent = "GO! Click now.";
            }
            reflexBtn.textContent = "Click";
        }, delay);
    });
}
