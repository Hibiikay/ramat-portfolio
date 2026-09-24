const API_URL =
    "https://script.google.com/macros/s/AKfycbzQi3UWeGm0C56iel0FwHlU3KL2H5xUdoRDIoups2C2hIeK89YpYhKzaUSd5dYWmz5j/exec";


const state = {
    projects: [],
    skills: [],
    experience: [],
    activeCategory: "all"
};


document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("year").textContent =
        new Date().getFullYear();

    setupNavigation();

    setupModal();

    loadPortfolio();

});


function setupNavigation() {

    const menuButton =
        document.getElementById("menuButton");

    const nav =
        document.getElementById("navMenu");


    menuButton.addEventListener("click", () => {

        nav.classList.toggle("open");

    });


    nav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            nav.classList.remove("open");

        });

    });

}


async function loadPortfolio() {

    try {

        const [
            projectsResponse,
            skillsResponse,
            experienceResponse
        ] = await Promise.all([

            fetch(`${API_URL}?action=projects`),

            fetch(`${API_URL}?action=skills`),

            fetch(`${API_URL}?action=experience`)

        ]);


        const projectsData =
            await projectsResponse.json();

        const skillsData =
            await skillsResponse.json();

        const experienceData =
            await experienceResponse.json();


        if (!projectsData.success) {

            throw new Error(
                "Could not load projects."
            );

        }


        state.projects =
            cleanProjects(projectsData.data || []);


        state.skills =
            skillsData.success
                ? skillsData.data || []
                : [];


        state.experience =
            experienceData.success
                ? experienceData.data || []
                : [];


        updateStats();

        renderProjectFilters();

        renderProjects();

        renderSkills();

        renderExperience();


    } catch (error) {

        console.error(error);

        showLoadingError();

    }

}


function cleanProjects(projects) {

    return projects.filter(project => {

        const status =
            String(project.Status || "")
                .trim()
                .toLowerCase();

        return (
            status === "" ||
            status === "published"
        );

    });

}


function updateStats() {

    document.getElementById("projectCount")
        .textContent =
        state.projects.length;


    document.getElementById("skillCount")
        .textContent =
        state.skills.length;

}


function renderProjectFilters() {

    const container =
        document.getElementById(
            "categoryFilters"
        );


    const categories = [
        ...new Set(

            state.projects
                .map(project =>
                    String(
                        project.Category || ""
                    ).trim()
                )
                .filter(Boolean)

        )
    ];


    container.innerHTML = `

        <button
            type="button"
            class="filter active"
            data-category="all"
        >
            All
        </button>

        ${categories.map(category => `

            <button
                type="button"
                class="filter"
                data-category="${escapeAttribute(category)}"
            >
                ${escapeHTML(category)}
            </button>

        `).join("")}

    `;


    container
        .querySelectorAll(".filter")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    container
                        .querySelectorAll(".filter")
                        .forEach(btn =>
                            btn.classList.remove("active")
                        );


                    button.classList.add("active");


                    state.activeCategory =
                        button.dataset.category;


                    renderProjects();

                }
            );

        });

}


function renderProjects() {

    const container =
        document.getElementById(
            "projectsGrid"
        );


    let projects =
        state.projects;


    if (
        state.activeCategory !==
        "all"
    ) {

        projects =
            projects.filter(project =>

                String(
                    project.Category || ""
                ).trim() ===
                state.activeCategory

            );

    }


    if (!projects.length) {

        container.innerHTML = `

            <div class="loading">

                No projects found in this category.

            </div>

        `;

        return;

    }


    container.innerHTML =
        projects.map(
            (project, index) =>
                createProjectCard(
                    project,
                    index
                )
        ).join("");


    container
        .querySelectorAll(
            "[data-project-index]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.projectIndex
                        );

                    openProject(
                        projects[index]
                    );

                }
            );

        });

}


function createProjectCard(
    project,
    index
) {

    const image =
        project["Image 1"] ||
        project.Image ||
        "";


    const title =
        project.Title ||
        "Untitled Project";


    const category =
        project.Category ||
        "Project";


    const description =
        project["Short Description"] ||
        project.Description ||
        "Project details coming soon.";


    const tools =
        String(
            project.Tools || ""
        )
        .split(",")
        .map(tool => tool.trim())
        .filter(Boolean);


    const imageHTML = image
        ? `
            <img
                class="project-image"
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(title)}"
                loading="lazy"
            >
        `
        : `
            <div class="project-placeholder">
                ${escapeHTML(category)}
            </div>
        `;


    return `

        <article class="project-card">

            ${imageHTML}

            <div class="project-body">

                <div class="project-category">
                    ${escapeHTML(category)}
                </div>

                <h3 class="project-title">
                    ${escapeHTML(title)}
                </h3>

                <p class="project-description">
                    ${escapeHTML(description)}
                </p>

                <div class="project-tools">

                    ${tools
                        .slice(0, 5)
                        .map(tool => `
                            <span class="tool">
                                ${escapeHTML(tool)}
                            </span>
                        `)
                        .join("")}

                </div>

                <button
                    type="button"
                    class="project-link"
                    data-project-index="${index}"
                >
                    View case study →
                </button>

            </div>

        </article>

    `;

}


function openProject(project) {

    const modal =
        document.getElementById(
            "projectModal"
        );


    const body =
        document.getElementById(
            "modalBody"
        );


    const image =
        project["Image 1"] ||
        project.Image ||
        "";


    const tools =
        String(
            project.Tools || ""
        )
        .split(",")
        .map(tool => tool.trim())
        .filter(Boolean);


    const imageHTML = image
        ? `
            <img
                class="modal-image"
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(project.Title || "Project")}"
            >
        `
        : "";


    body.innerHTML = `

        ${imageHTML}

        <div class="project-category">

            ${escapeHTML(
                project.Category ||
                "Project"
            )}

        </div>

        <h2>
            ${escapeHTML(
                project.Title ||
                "Untitled Project"
            )}
        </h2>


        <p>
            ${escapeHTML(
                project["Short Description"] ||
                ""
            )}
        </p>


        ${
            project.Problem
                ? `
                    <h3 class="modal-subtitle">
                        The Problem
                    </h3>

                    <p>
                        ${escapeHTML(
                            project.Problem
                        )}
                    </p>
                `
                : ""
        }


        ${
            project.Solution
                ? `
                    <h3 class="modal-subtitle">
                        The Solution
                    </h3>

                    <p>
                        ${escapeHTML(
                            project.Solution
                        )}
                    </p>
                `
                : ""
        }


        ${
            project.Impact
                ? `
                    <h3 class="modal-subtitle">
                        Impact
                    </h3>

                    <p>
                        ${escapeHTML(
                            project.Impact
                        )}
                    </p>
                `
                : ""
        }


        ${
            tools.length
                ? `
                    <div class="project-tools">

                        ${tools.map(tool => `

                            <span class="tool">
                                ${escapeHTML(tool)}
                            </span>

                        `).join("")}

                    </div>
                `
                : ""
        }


        <div class="hero-buttons">

            ${
                project["Demo URL"]
                    ? `
                        <a
                            class="button primary"
                            href="${escapeAttribute(project["Demo URL"])}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View Demo
                        </a>
                    `
                    : ""
            }


            ${
                project["GitHub URL"]
                    ? `
                        <a
                            class="button secondary"
                            href="${escapeAttribute(project["GitHub URL"])}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View Code
                        </a>
                    `
                    : ""
            }

        </div>

    `;


    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function setupModal() {

    const modal =
        document.getElementById(
            "projectModal"
        );


    const close =
        document.getElementById(
            "closeModal"
        );


    const overlay =
        modal.querySelector(
            ".modal-overlay"
        );


    function closeModal() {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    close.addEventListener(
        "click",
        closeModal
    );


    overlay.addEventListener(
        "click",
        closeModal
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }
    );

}


function renderSkills() {

    const container =
        document.getElementById(
            "skillsGrid"
        );


    if (!state.skills.length) {

        container.innerHTML = `

            <div class="loading">
                Add your skills to the Skills sheet
                to display them here.
            </div>

        `;

        return;

    }


    container.innerHTML =
        state.skills.map(skill => `

            <div class="skill-card">

                <strong>
                    ${escapeHTML(
                        skill.Skill || ""
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        skill.Category || ""
                    )}
                </span>

            </div>

        `).join("");

}


function renderExperience() {

    const container =
        document.getElementById(
            "experienceList"
        );


    if (!state.experience.length) {

        container.innerHTML = `

            <div class="loading">
                Add your experience to the
                Experience sheet to display it here.
            </div>

        `;

        return;

    }


    container.innerHTML =
        state.experience.map(item => `

            <article class="experience-card">

                <div class="experience-top">

                    <div>

                        <div class="experience-role">

                            ${escapeHTML(
                                item.Role || ""
                            )}

                        </div>

                        <div class="experience-org">

                            ${escapeHTML(
                                item.Organization || ""
                            )}

                        </div>

                    </div>


                    <div class="experience-date">

                        ${escapeHTML(
                            item["Start Date"] || ""
                        )}

                        –

                        ${escapeHTML(
                            item["End Date"] ||
                            "Present"
                        )}

                    </div>

                </div>


                <p class="experience-description">

                    ${escapeHTML(
                        item.Description || ""
                    )}

                </p>

            </article>

        `).join("");

}


function showLoadingError() {

    document.getElementById(
        "projectsGrid"
    ).innerHTML = `

        <div class="loading">

            Unable to load portfolio data.
            Please check the API connection.

        </div>

    `;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}