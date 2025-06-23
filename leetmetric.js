document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");

    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            alert("Invalid Username");
        }
        return isMatching;
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;
            if (statsContainer) statsContainer.querySelector(".stats-cards").innerHTML = "";

            const proxyUrl = "https://cors-anywhere.herokuapp.com/";
            const targetUrl = "https://leetcode.com/graphql/";

            const myHeaders = new Headers();
            myHeaders.append("content-type", "application/json");

            const graphql = JSON.stringify({
                query: `
                    query userSessionProgress($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: { username }
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: graphql,
            };

            const response = await fetch(proxyUrl + targetUrl, requestOptions);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Fetch failed: ${response.status} - ${errorText}`);
            }

            const parsedData = await response.json();
            if (!parsedData.data || !parsedData.data.matchedUser) {
                throw new Error("User not found or data unavailable.");
            }

            displayUserData(parsedData);
        } catch (error) {
            alert("Error fetching data: " + error.message + "\nVisit https://cors-anywhere.herokuapp.com/corsdemo and click 'Request temporary access'.");
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function updateProgress(solved, total, label, circle) {
        const progressDegree = total > 0 ? (solved / total) * 100 : 0;
        circle?.style.setProperty("--progress-degree", `${progressDegree}%`);
        if (label) label.textContent = `${solved}/${total}`;
    }

    function displayUserData(parsedData) {
        const allQuestions = parsedData.data.allQuestionsCount;
        const acSubmissions = parsedData.data.matchedUser.submitStats.acSubmissionNum;
        const totalSubmissions = parsedData.data.matchedUser.submitStats.totalSubmissionNum;

        const getCount = (arr, level) => (arr.find(q => q.difficulty === level) || { count: 0 }).count;
        const getSubmissions = (arr, level) => (arr.find(q => q.difficulty === level) || { submissions: 0 }).submissions;

        updateProgress(getCount(acSubmissions, "Easy"), getCount(allQuestions, "Easy"), easyLabel, easyProgressCircle);
        updateProgress(getCount(acSubmissions, "Medium"), getCount(allQuestions, "Medium"), mediumLabel, mediumProgressCircle);
        updateProgress(getCount(acSubmissions, "Hard"), getCount(allQuestions, "Hard"), hardLabel, hardProgressCircle);

        const cardsData = [
            { label: "Overall Submissions", value: totalSubmissions[0]?.submissions || 0 },
            { label: "Easy Submissions", value: getSubmissions(totalSubmissions, "Easy") },
            { label: "Medium Submissions", value: getSubmissions(totalSubmissions, "Medium") },
            { label: "Hard Submissions", value: getSubmissions(totalSubmissions, "Hard") },
        ];

        if (cardStatsContainer) {
            cardStatsContainer.innerHTML = cardsData.map(
                data => `
                    <div class="card">
                        <h4>${data.label}</h4>
                        <p>${data.value}</p>
                    </div>`
            ).join("");
        }
    }

    searchButton.addEventListener("click", function () {
        const username = usernameInput.value.trim();
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });
});
