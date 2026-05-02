document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".table-row");
    cards.forEach((card) => {
        card.style.animationDelay = card.style.getPropertyValue("--delay") || "0ms";
    });

    const appRoot = document.querySelector("[data-app='album']");
    if (!appRoot) {
        return;
    }

    const storageKey = "copa2026-album";
    const statusButtons = Array.from(appRoot.querySelectorAll(".seg-btn[data-status]"));
    const modeButtons = Array.from(appRoot.querySelectorAll(".seg-btn[data-mode]"));
    const groupFilter = appRoot.querySelector("#groupFilter");
    const searchInput = appRoot.querySelector("#searchInput");
    const resetBtn = appRoot.querySelector("#resetBtn");
    const groupsContainer = appRoot.querySelector("#albumGroups");
    const modePill = appRoot.querySelector("#modePill");

    const overallPercent = appRoot.querySelector("#overallPercent");
    const overallCount = appRoot.querySelector("#overallCount");
    const overallBar = appRoot.querySelector("#overallBar");
    const ownedCount = appRoot.querySelector("#ownedCount");
    const repeatedCount = appRoot.querySelector("#repeatedCount");
    const missingCount = appRoot.querySelector("#missingCount");
    const totalCount = appRoot.querySelector("#totalCount");

    const teams = [
        "MEX", "RSA", "KOR", "CZE",
        "CAN", "BIH", "QAT", "SUI",
        "BRA", "MAR", "HAI", "SCO",
        "USA", "PAR", "AUS", "TUR",
        "GER", "CUW", "CIV", "ECU",
        "NED", "JPN", "SWE", "TUN",
        "BEL", "EGY", "IRN", "NZL",
        "ESP", "CPV", "KSA", "URU",
        "FRA", "SEN", "IRQ", "NOR",
        "ARG", "ALG", "AUT", "JOR",
        "POR", "COD", "UZB", "COL",
        "ENG", "CRO", "GHA", "PAN",
    ];
    const groupIds = "ABCDEFGHIJKL".split("");
    const specials = [
        {
            id: "FWC",
            label: "FWC",
            range: { start: 0, end: 8 },
            format: (num) => String(num).padStart(2, "0"),
        },
        {
            id: "HIS",
            label: "FIFA World Cup History",
            range: { start: 9, end: 19 },
            format: (num) => String(num).padStart(2, "0"),
        },
        {
            id: "CC",
            label: "Coca-Cola",
            range: { start: 1, end: 14 },
            format: (num) => `CC${num}`,
        },
    ];

    const state = loadState();
    const stickerMeta = new Map();
    const teamBlocks = new Map();
    const groupBlocks = new Map();

    buildGroupFilter();
    buildGroups();
    applyInitialView();
    updateStats();
    updateVisibility();

    groupsContainer.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-sticker-id]");
        if (!button) {
            return;
        }
        const stickerId = button.dataset.stickerId;
        const current = normalizeStateValue(state[stickerId]);
        const mode = getActiveMode();
        const nextValue = mode === "repeated"
            ? toggleRepeated(current)
            : toggleOwned(current);
        if (nextValue === 0) {
            delete state[stickerId];
        } else {
            state[stickerId] = nextValue;
        }
        saveState(state);
        updateStats();
        updateVisibility();
    });

    statusButtons.forEach((button) => {
        button.addEventListener("click", () => {
            statusButtons.forEach((item) => item.classList.remove("is-active"));
            button.classList.add("is-active");
            updateVisibility();
        });
    });

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            modeButtons.forEach((item) => item.classList.remove("is-active"));
            button.classList.add("is-active");
            updateModePill();
        });
    });

    groupFilter.addEventListener("change", updateVisibility);
    searchInput.addEventListener("input", updateVisibility);
    resetBtn.addEventListener("click", () => {
        statusButtons.forEach((item) => item.classList.remove("is-active"));
        statusButtons[0].classList.add("is-active");
        modeButtons.forEach((item) => item.classList.remove("is-active"));
        if (modeButtons[0]) {
            modeButtons[0].classList.add("is-active");
        }
        groupFilter.value = "all";
        searchInput.value = "";
        updateModePill();
        updateVisibility();
    });

    function buildGroupFilter() {
        const options = [
            { value: "all", label: "Todos" },
            { value: "specials", label: "Especiais" },
            ...groupIds.map((group) => ({ value: group, label: `Grupo ${group}` })),
        ];
        options.forEach((option) => {
            const entry = document.createElement("option");
            entry.value = option.value;
            entry.textContent = option.label;
            groupFilter.appendChild(entry);
        });
    }

    function buildGroups() {
        groupsContainer.innerHTML = "";
        const specialsCard = buildSpecialsCard();
        groupsContainer.appendChild(specialsCard);

        groupIds.forEach((group, groupIndex) => {
            const groupTeams = teams.slice(groupIndex * 4, groupIndex * 4 + 4);
            const groupCard = document.createElement("details");
            groupCard.className = "group-card";
            groupCard.open = groupIndex < 2;
            groupCard.dataset.group = group;

            const summary = document.createElement("summary");
            summary.className = "group-header";
            summary.innerHTML = `
                <div>
                    <span class="group-title">Grupo ${group}</span>
                    <span class="group-meta" data-group-meta="${group}">0/0</span>
                </div>
                <div class="group-progress">
                    <span class="group-percent" data-group-percent="${group}">0%</span>
                    <span class="group-bar"><span data-group-bar="${group}"></span></span>
                </div>
            `;
            groupCard.appendChild(summary);

            const groupBody = document.createElement("div");
            groupBody.className = "group-body";

            groupTeams.forEach((team) => {
                const teamKey = `${group}-${team}`;
                const teamBlock = document.createElement("div");
                teamBlock.className = "team-block";
                teamBlock.dataset.team = teamKey;

                teamBlock.innerHTML = `
                    <div class="team-header">
                        <span class="team-code">${team}</span>
                        <span class="team-progress" data-team-progress="${teamKey}">0/20</span>
                    </div>
                `;

                const grid = document.createElement("div");
                grid.className = "sticker-grid";

                const stickerIds = [];
                for (let i = 1; i <= 20; i += 1) {
                    const number = String(i).padStart(2, "0");
                    const stickerId = `${team}-${number}`;
                    stickerIds.push(stickerId);
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "sticker-chip";
                    button.dataset.stickerId = stickerId;
                    button.textContent = number;
                    grid.appendChild(button);
                    stickerMeta.set(stickerId, {
                        label: `${team} ${number}`,
                        group,
                        team,
                        section: "groups",
                    });
                }

                teamBlock.appendChild(grid);
                teamBlocks.set(teamKey, { element: teamBlock, stickerIds, group });
                groupBody.appendChild(teamBlock);
            });

            groupCard.appendChild(groupBody);
            groupsContainer.appendChild(groupCard);
            groupBlocks.set(group, { element: groupCard, stickerIds: collectGroupStickerIds(group) });
        });
    }

    function buildSpecialsCard() {
        const card = document.createElement("details");
        card.className = "group-card special";
        card.open = true;
        card.dataset.group = "specials";

        const summary = document.createElement("summary");
        summary.className = "group-header";
        summary.innerHTML = `
            <div>
                <span class="group-title">Especiais</span>
                <span class="group-meta" data-group-meta="specials">0/0</span>
            </div>
            <div class="group-progress">
                <span class="group-percent" data-group-percent="specials">0%</span>
                <span class="group-bar"><span data-group-bar="specials"></span></span>
            </div>
        `;
        card.appendChild(summary);

        const body = document.createElement("div");
        body.className = "group-body";

        specials.forEach((section) => {
            const sectionKey = `special-${section.id}`;
            const sectionBlock = document.createElement("div");
            sectionBlock.className = "team-block";
            sectionBlock.dataset.team = sectionKey;

            sectionBlock.innerHTML = `
                <div class="team-header">
                    <span class="team-code">${section.label}</span>
                    <span class="team-progress" data-team-progress="${sectionKey}">0/0</span>
                </div>
            `;

            const grid = document.createElement("div");
            grid.className = "sticker-grid";
            const stickerIds = [];

            for (let i = section.range.start; i <= section.range.end; i += 1) {
                const number = section.format(i);
                const stickerId = section.id === "CC" ? number : `${section.id}-${number}`;
                stickerIds.push(stickerId);
                const button = document.createElement("button");
                button.type = "button";
                button.className = "sticker-chip";
                button.dataset.stickerId = stickerId;
                button.textContent = number;
                grid.appendChild(button);
                stickerMeta.set(stickerId, {
                    label: section.id === "CC" ? number : `${section.id} ${number}`,
                    group: "specials",
                    team: section.id,
                    section: "specials",
                });
            }

            sectionBlock.appendChild(grid);
            teamBlocks.set(sectionKey, { element: sectionBlock, stickerIds, group: "specials" });
            body.appendChild(sectionBlock);
        });

        card.appendChild(body);
        groupBlocks.set("specials", { element: card, stickerIds: collectSpecialStickerIds() });
        return card;
    }

    function collectGroupStickerIds(group) {
        const ids = [];
        teams
            .slice(groupIds.indexOf(group) * 4, groupIds.indexOf(group) * 4 + 4)
            .forEach((team) => {
                for (let i = 1; i <= 20; i += 1) {
                    ids.push(`${team}-${String(i).padStart(2, "0")}`);
                }
            });
        return ids;
    }

    function collectSpecialStickerIds() {
        const ids = [];
        specials.forEach((section) => {
            for (let i = section.range.start; i <= section.range.end; i += 1) {
                const number = section.format(i);
                ids.push(section.id === "CC" ? number : `${section.id}-${number}`);
            }
        });
        return ids;
    }

    function updateStats() {
        const total = stickerMeta.size;
        let owned = 0;
        let repeated = 0;
        stickerMeta.forEach((_meta, id) => {
            const value = normalizeStateValue(state[id]);
            if (value === 1) {
                owned += 1;
            } else if (value === 2) {
                repeated += 1;
            }
        });
        const collected = owned + repeated;
        const missing = total - collected;
        const percent = total ? Math.round((collected / total) * 100) : 0;

        setText(overallPercent, `${percent}%`);
        setText(overallCount, `${collected}/${total}`);
        setWidth(overallBar, `${percent}%`);
        setText(ownedCount, owned);
        setText(repeatedCount, repeated);
        setText(missingCount, missing);
        setText(totalCount, total);

        groupBlocks.forEach((groupBlock, groupKey) => {
            const groupOwned = countOwned(groupBlock.stickerIds);
            const groupTotal = groupBlock.stickerIds.length;
            const groupPercent = groupTotal ? Math.round((groupOwned / groupTotal) * 100) : 0;
            const metaEl = appRoot.querySelector(`[data-group-meta='${groupKey}']`);
            const percentEl = appRoot.querySelector(`[data-group-percent='${groupKey}']`);
            const barEl = appRoot.querySelector(`[data-group-bar='${groupKey}']`);
            if (metaEl) {
                metaEl.textContent = `${groupOwned}/${groupTotal}`;
            }
            if (percentEl) {
                percentEl.textContent = `${groupPercent}%`;
            }
            if (barEl) {
                barEl.style.width = `${groupPercent}%`;
            }
        });

        teamBlocks.forEach((teamBlock, teamKey) => {
            const teamOwned = countOwned(teamBlock.stickerIds);
            const teamTotal = teamBlock.stickerIds.length;
            const target = appRoot.querySelector(`[data-team-progress='${teamKey}']`);
            if (target) {
                target.textContent = `${teamOwned}/${teamTotal}`;
            }
        });
    }

    function updateVisibility() {
        const statusValue = statusButtons.find((btn) => btn.classList.contains("is-active"))
            ?.dataset.status || "all";
        const groupValue = groupFilter.value || "all";
        const searchValue = (searchInput.value || "").trim().toLowerCase();

        const teamVisibleCount = new Map();
        const groupVisibleCount = new Map();

        stickerMeta.forEach((meta, id) => {
            const button = appRoot.querySelector(`[data-sticker-id='${id}']`);
            if (!button) {
                return;
            }
            const value = normalizeStateValue(state[id]);
            const matchesStatus =
                statusValue === "all" ||
                (statusValue === "owned" && value === 1) ||
                (statusValue === "repeated" && value === 2) ||
                (statusValue === "missing" && value === 0);
            const matchesGroup =
                groupValue === "all" ||
                (groupValue === "specials" && meta.section === "specials") ||
                meta.group === groupValue;
            const matchesSearch =
                !searchValue ||
                meta.label.toLowerCase().includes(searchValue) ||
                id.toLowerCase().includes(searchValue);

            const isVisible = matchesStatus && matchesGroup && matchesSearch;
            button.hidden = !isVisible;
            button.classList.toggle("is-owned", value === 1);
            button.classList.toggle("is-repeated", value === 2);
            button.classList.toggle("is-missing", value === 0);

            const teamKey = meta.section === "specials" ? `special-${meta.team}` : `${meta.group}-${meta.team}`;
            const groupKey = meta.section === "specials" ? "specials" : meta.group;
            if (isVisible) {
                teamVisibleCount.set(teamKey, (teamVisibleCount.get(teamKey) || 0) + 1);
                groupVisibleCount.set(groupKey, (groupVisibleCount.get(groupKey) || 0) + 1);
            }
        });

        teamBlocks.forEach((teamBlock, teamKey) => {
            const visible = teamVisibleCount.get(teamKey) || 0;
            teamBlock.element.classList.toggle("is-hidden", visible === 0);
        });

        groupBlocks.forEach((groupBlock, groupKey) => {
            const visible = groupVisibleCount.get(groupKey) || 0;
            groupBlock.element.classList.toggle("is-hidden", visible === 0);
        });
    }

    function countOwned(ids) {
        return ids.reduce((total, id) => total + (normalizeStateValue(state[id]) >= 1 ? 1 : 0), 0);
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(storageKey);
            const parsed = raw ? JSON.parse(raw) : {};
            Object.keys(parsed).forEach((key) => {
                parsed[key] = normalizeStateValue(parsed[key]);
                if (parsed[key] === 0) {
                    delete parsed[key];
                }
            });
            return parsed;
        } catch (error) {
            return {};
        }
    }

    function saveState(nextState) {
        localStorage.setItem(storageKey, JSON.stringify(nextState));
    }

    function setText(element, value) {
        if (!element) {
            return;
        }
        element.textContent = String(value);
    }

    function setWidth(element, value) {
        if (!element) {
            return;
        }
        element.style.width = value;
    }

    function normalizeStateValue(value) {
        if (value === true) {
            return 1;
        }
        if (value === false || value == null) {
            return 0;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
            return 0;
        }
        return Math.max(0, Math.min(2, Math.round(numeric)));
    }

    function toggleOwned(current) {
        if (current === 2) {
            return 1;
        }
        return current === 1 ? 0 : 1;
    }

    function toggleRepeated(current) {
        if (current === 2) {
            return 1;
        }
        return 2;
    }

    function getActiveMode() {
        return modeButtons.find((btn) => btn.classList.contains("is-active"))
            ?.dataset.mode || "collection";
    }

    function updateModePill() {
        if (!modePill) {
            return;
        }
        const mode = getActiveMode();
        if (mode === "repeated") {
            modePill.textContent = "Modo repetidas ativo";
            modePill.classList.add("is-repeated");
        } else {
            modePill.textContent = "Modo colecao ativo";
            modePill.classList.remove("is-repeated");
        }
    }

    function applyInitialView() {
        const view = appRoot.dataset.view;
        if (view !== "repeated") {
            updateModePill();
            return;
        }

        modeButtons.forEach((item) => item.classList.remove("is-active"));
        const repeatedMode = modeButtons.find((item) => item.dataset.mode === "repeated");
        if (repeatedMode) {
            repeatedMode.classList.add("is-active");
        }

        statusButtons.forEach((item) => item.classList.remove("is-active"));
        const repeatedStatus = statusButtons.find((item) => item.dataset.status === "repeated");
        if (repeatedStatus) {
            repeatedStatus.classList.add("is-active");
        }

        updateModePill();
    }
});
