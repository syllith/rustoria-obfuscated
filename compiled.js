function setKD(type) {
    var settings = {
        "url": "https://api.battlemetrics.com/activity?tagTypeMode=and&filter[types][blacklist]=event:query&filter[players]=" + playerInfo.bmId + "&include=organization,user&page[size]=1000",
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization": "Bearer " + bmKey
        },
    };

    $.ajax(settings).done(function(response) {
        var kdInfo = {
            messages: [],
            timestamps: [],
            dates: [],
            kills: [],
            deaths: [],
            kds: []
        }

        // Gathers kill information
        for (var i = 0; i < response.data.length; i++) {
            if (response.data[i].attributes.messageType == "rustLog:playerDeath:PVP") {
                var message = response.data[i].attributes.message;
                var messageTime = new Date(response.data[i].attributes.timestamp);
                var playerKilling = message.split(" was killed by ")[1];
                var playerKilled = message.split(" was killed by ")[0];

                if (playerInfo.playerIds.includes(playerKilling) || playerInfo.playerIds.includes(playerKilling.split("] ")[1])) {
                    playerInfo.kills++;
                    if (getNumberOfDays(Date.parse(messageTime), Date.now()) == 0) {
                        playerInfo.killsToday++;
                    }
                } else {
                    playerInfo.deaths++;
                    if (getNumberOfDays(Date.parse(messageTime), Date.now()) == 0) {
                        playerInfo.deathsToday++;
                    }
                }

                if (!playerInfo.uniqueKills.includes(playerKilled) && !playerInfo.playerIds.includes(playerKilled)) {
                    playerInfo.uniqueKills.push(playerKilled);
                    if (getNumberOfDays(Date.parse(messageTime), Date.now()) == 0) {
                        playerInfo.uniqueKillsToday.push(playerKilled);
                    }
                }

                kdInfo.messages.push(message);
                messageTime.setHours(0, 0, 0, 0);
                kdInfo.timestamps.push(Date.parse(messageTime));
                if (!kdInfo.dates.includes(Date.parse(messageTime))) {
                    kdInfo.dates.push(Date.parse(messageTime));
                }
            }
        }

        // Calculates K/D ratio
        playerInfo.kd = (playerInfo.kills / playerInfo.deaths).toFixed(2);
        playerInfo.kdToday = (playerInfo.killsToday / playerInfo.deathsToday).toFixed(2);

        if (playerInfo.kd == "Infinity") {
            playerInfo.kd = playerInfo.kills + ".00"
        } else if (playerInfo.kd == "NaN") {
            playerInfo.kd = 0.00;
        }

        if (playerInfo.kdToday == "Infinity") {
            playerInfo.kdToday = playerInfo.killsToday + ".00"
        } else if (playerInfo.kdToday == "NaN") {
            playerInfo.kdToday = 0.00;
        }

        // Gets chart Info
        for (var j = 0; j < kdInfo.dates.length; j++) {
            let kills = 0;
            let deaths = 0;
            let kd = 0;
            for (var i = 0; i < kdInfo.messages.length; i++) {
                if (kdInfo.timestamps[i] == kdInfo.dates[j]) {
                    if (playerInfo.playerIds.includes(kdInfo.messages[i].split(" was killed by ")[1]) || playerInfo.playerIds.includes(kdInfo.messages[i].split(" was killed by ")[1].split("] ")[1])) {
                        kills++;
                    } else {
                        deaths++;
                    }
                }

                kd = (kills / deaths).toFixed(2);
                if (kd == "Infinity") {
                    kd = +kills + ".00";
                } else if (kd == "NaN") {
                    kd = 0.00;
                }
            }
            kdInfo.kills.push(kills);
            kdInfo.deaths.push(deaths);
            kdInfo.kds.push(kd);
        }

        kdInfo.kills.reverse();
        kdInfo.deaths.reverse();
        kdInfo.kds.reverse();
        kdInfo.dates.reverse();

        if (type == 1) {
            createKdChart(kdInfo.dates, kdInfo.kds, type);
        } else if (type == 2) {
            createKdChart(kdInfo.dates, kdInfo.kills, type);
        } else if (type == 3) {
            createKdChart(kdInfo.dates, kdInfo.deaths, type);
        }

        // Draws info
        document.getElementById("overall-kf").innerHTML = playerInfo.kills + " Kills | " + playerInfo.deaths + " Deaths (<span style='color:" + colorizeReverse(playerInfo.kd / 4.5 * 100) + "'>" + playerInfo.kd + "</span> K/D)  <i id='unique-kills' class='fas fa-info-circle'></i>";
        document.getElementById("short-kf").innerHTML = playerInfo.killsToday + " Kills | " + playerInfo.deathsToday + " Deaths (<span style='color:" + colorizeReverse(playerInfo.kdToday / 4.5 * 100) + "'>" + playerInfo.kdToday + "</span> K/D)  <i id='unique-kills-short' class='fas fa-info-circle'></i>";
        document.getElementById("note").value = document.getElementById("note").value.replace("Kills today: 0 & Deaths today: 0 (0 K/D)", "Kills today: " + playerInfo.killsToday + " & Deaths today: " + playerInfo.deathsToday + " (" + playerInfo.kdToday + " K/D)");

        var percUniqueKills = (playerInfo.uniqueKills.length / playerInfo.kills * 100).toFixed(0);
        var percUniqueKillsToday = (playerInfo.uniqueKillsToday.length / playerInfo.killsToday * 100).toFixed(0);
        if (playerInfo.kills > 0) {
            document.getElementById("unique-kills").onmouseenter = function() {
                tooltip.show("Unique Kills: " + playerInfo.uniqueKills.length + "</br>" + percUniqueKills + "% of kills are from unique players");
            }
            document.getElementById("unique-kills").onmouseleave = function() {
                tooltip.hide();
            }
        } else {
            document.getElementById("unique-kills").style.display = "none";
        }

        if (playerInfo.killsToday > 0) {
            document.getElementById("unique-kills-short").onmouseenter = function() {
                tooltip.show("Unique  Kills Today: " + playerInfo.uniqueKillsToday.length + "</br>" + percUniqueKillsToday + "% of kills today are from unique players");
            }
            document.getElementById("unique-kills-short").onmouseleave = function() {
                tooltip.hide();
            }
        } else {
            document.getElementById("unique-kills-short").style.display = "none";
        }
    });
}

function createKdChart(x, y, type) {
    // Formats dates before processing
    for (var i = 0; i < x.length; i++) {
        x[i] = new Date(x[i]).toLocaleString(getLocale());
        x[i] = x[i].split("T")[0];
        x[i] = x[i].split(" ")[0];
        x[i] = x[i].substring(0, x[i].length - 1);
    }

    if (type == 1) {
        var config = {
            type: 'line',
            data: {
                labels: x,
                datasets: [{
                    label: 'K/D Ratio',
                    data: y,
                    borderColor: 'white',
                    backgroundColor: 'rgb(255, 99, 132)',
                }]
            },
            responsive: true,
            options: {
                scales: {
                    y: {
                        ticks: {
                            color: 'white',
                            callback: function(value, index, values) {
                                return value.toFixed(2) + ' K/D';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        },
                        position: 'top'
                    },
                }
            }
        };
    } else if (type == 2) {
        var config = {
            type: 'line',
            data: {
                labels: x,
                datasets: [{
                    label: 'Kills',
                    data: y,
                    borderColor: 'white',
                    backgroundColor: 'rgb(255, 99, 132)',
                }]
            },
            responsive: true,
            options: {
                scales: {
                    y: {
                        ticks: {
                            color: 'white',
                            callback: function(value, index, values) {
                                return value + ' Kills';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        },
                        position: 'top'
                    },
                }
            }
        };
    } else if (type == 3) {
        var config = {
            type: 'line',
            data: {
                labels: x,
                datasets: [{
                    label: 'Deaths',
                    data: y,
                    borderColor: 'white',
                    backgroundColor: 'rgb(255, 99, 132)',
                }]
            },
            responsive: true,
            options: {
                scales: {
                    y: {
                        ticks: {
                            color: 'white',
                            callback: function(value, index, values) {
                                return value + ' Deaths';
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        },
                        position: 'top'
                    },
                }
            }
        };
    }

    // Creates chart
    var first = true;
    const chartView = document.createElement('canvas');
    chartView.id = "chart";
    document.getElementById("chart-div").appendChild(chartView);
    var chart = new Chart(document.getElementById('chart'), config);
    chart.update();
    document.getElementById("chart-loading-label").style.display = "none";
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var ppInfo = {
    dates: [],
    playTimes: [],
    datesTrimmed: [],
    playtimesTrimmed: []
}

function setPublicProfile(link, scans) {
    if (scans == historyIterations) {
        ppInfo.dates = [];
        ppInfo.playTimes = [];
        ppInfo.datesTrimmed = [];
        ppInfo.playtimesTrimmed = [];
    }

    var settings = {
        "url": link,
        "method": "GET",
        "timeout": 6000,
        "headers": {
            "Authorization": "Bearer " + bmKey
        },
    };

    $.ajax(settings).done(function(response) {
        for (var i = 0; i < response.data.length; i++) {
            var startTime = new Date(response.data[i].attributes.start);
            var stopTime = new Date(response.data[i].attributes.stop);
            var date = new Date(response.data[i].attributes.start);
            var currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);

            // Corrects missing stop times
            if (Date.parse(stopTime) == 0 && i == 0) {
                stopTime = new Date();
            } else if (Date.parse(stopTime) == 0) {
                stopTime = startTime;
            }

            ppInfo.dates.push(Date.parse(date));
            ppInfo.playTimes.push(Math.abs(stopTime - startTime) / 36e5);
        }

        if (response.links.next && scans > 0) {
            setPublicProfile(response.links.next, scans = scans - 1);
        } else {
            ppInfo.dates.reverse();
            ppInfo.playTimes.reverse();

            // Create array of all possible dates from starting date
            var initialTime = new Date(ppInfo.dates[0]),
                endTime = new Date(),
                arrTime = [];
            for (let q = initialTime; q <= endTime; q.setDate(q.getDate() + 1)) {
                arrTime.push(Date.parse(q.toString()));
            }

            // For each possible date, look through each date logged and if the date logged includes a time in the overall ppInfo.dates, add it to the play time
            var overallPlaytimes = [];
            for (var g = 0; g < arrTime.length; g++) {
                var hoursToday = 0;
                for (var h = 0; h < ppInfo.dates.length; h++) {
                    if (ppInfo.dates[h] == arrTime[g]) {
                        hoursToday += ppInfo.playTimes[h];
                    }
                }
                if (hoursToday > 24) {
                    overallPlaytimes.push(24);
                } else {
                    overallPlaytimes.push(hoursToday);
                }
            }
            createSessionChart(arrTime, overallPlaytimes, "Public Profile");
        }
    });
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function setRtg() {
    var settings = {
        "url": "https://rustoria.digi-safe.co/scripts/rtg.php?id="+playerInfo.steamId,
        "method": "GET",
        "timeout": 6000,
    };
    
    $.ajax(settings).done(function(response) {
        response = JSON.parse(response);
        if (response != "") {
            var weapons = ["ak", "lr", "mP5", "m249", "thompson"];
            var weaponsSorted = ["AK47", "LR500", "MP5", "M249", "Thompson"];
            var scores = [];
            for (var key of Object.keys(response)) {
                if (weapons.includes(key)) {
                    scores.push(response[key].percentage.substring(0, response[key].percentage.length - 1));
                }
            }
            createRtgChart(weaponsSorted, scores);
        } else {
            document.getElementById("chart-loading-label").innerHTML = "  <b>No Data Available</b>";
        }
    });
}

function createRtgChart(x, y) {
    // Configures session chart
    var data = {
        labels: x,
        datasets: [{
            label: 'Accuracy',
            data: y,
            borderColor: 'white',
            backgroundColor: 'rgb(255, 99, 132)',
        }]
    };

    var config = {
        type: 'bar',
        data: data,
        responsive: true,
        options: {
            scales: {
                y: {
                    ticks: {
                        color: 'white',
                        callback: function(value, index, values) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    },
                    position: 'top'
                },
            }
        }
    };

    // Creates chart
    const chartView = document.createElement('canvas');
    chartView.id = "chart";
    document.getElementById("chart-div").appendChild(chartView);
    var chart = new Chart(document.getElementById('chart'), config);
    chart.update();
    document.getElementById("chart-loading-label").style.display = "none";
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var sessionInfo = {
    dates: [],
    playTimes: [],
    datesTrimmed: [],
    playtimesTrimmed: []
}

function setSession(link, scans) {
    if (scans == historyIterations) {
        sessionInfo.dates = [];
        sessionInfo.playTimes = [];
        sessionInfo.datesTrimmed = [];
        sessionInfo.playtimesTrimmed = [];
    }

    var settings = {
        "url": link,
        "method": "GET",
        "timeout": 6000,
        "headers": {
            "Authorization": "Bearer " + bmKey
        },
    };

    $.ajax(settings).done(function(response) {
        // Create array of dates played / playtime
        for (var i = 0; i < response.data.length; i++) {
            var startTime = new Date(response.data[i].attributes.start);
            var stopTime = new Date(response.data[i].attributes.stop);
            var sessionDate = new Date(response.data[i].attributes.start);
            sessionDate.setHours(0, 0, 0, 0);

            // Corrects missing / incomplete stop times
            if (Date.parse(stopTime) == 0 && i == 0) {
                stopTime = new Date();
            } else if (Date.parse(stopTime) == 0) {
                stopTime = startTime;
            }

            if (!sessionInfo.datesTrimmed.includes(Date.parse(sessionDate))) {
                sessionInfo.datesTrimmed.push(Date.parse(sessionDate));
            }

            sessionInfo.dates.push(sessionDate);
            sessionInfo.playTimes.push(Math.abs(stopTime - startTime) / 36e5);
        }
        if (response.links.next && scans > 0) {
            setSession(response.links.next, scans = scans - 1);
        } else {
            sessionInfo.dates.reverse();
            sessionInfo.playTimes.reverse();
            sessionInfo.datesTrimmed.reverse();

            for (var i = 0; i < sessionInfo.datesTrimmed.length; i++) {
                var hoursPlayed = 0;
                for (var j = 0; j < sessionInfo.dates.length; j++) {
                    if (sessionInfo.datesTrimmed[i] == Date.parse(sessionInfo.dates[j])) {
                        hoursPlayed += sessionInfo.playTimes[j];
                    }
                }
                if (hoursPlayed > 24) {
                    sessionInfo.playtimesTrimmed.push(24);
                } else {
                    sessionInfo.playtimesTrimmed.push(hoursPlayed);
                }
            }
            createSessionChart(sessionInfo.datesTrimmed, sessionInfo.playtimesTrimmed, "Session");
        }
    });
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Sets the current page
function updatePage() {
    if (window.location.href.includes("identifiers")) {
        currentPage = "Identifiers";
    } else if (window.location.href.includes("rcon/players") && window.location.href.includes("activity")) {
        currentPage = "Activity";
    } else if (window.location.href.includes("rcon/players")) {
        currentPage = "Overview";
    } else if (window.location.href.includes("players")) {
        currentPage = "Public Profile";
    } else if (window.location.href.includes("bans/add")) {
        currentPage = "Ban";
    } else if (window.location.href.includes("bans/edit")) {
        currentPage = "Edit Ban";
    } else if (window.location.href.includes("rcon/activity")) {
        currentPage = "Global Activity";
    } else if (window.location.href.includes("steamcommunity")) {
        currentPage = "Steam";
    }
}

// Waits until an element exists
function elementReady(selector) {
    return new Promise((resolve, reject) => {
      let el = document.querySelector(selector);
      if (el) {resolve(el);}
      new MutationObserver((mutationRecords, observer) => {
        Array.from(document.querySelectorAll(selector)).forEach((element) => {
          resolve(element);
          observer.disconnect();
        });
      })
        .observe(document.documentElement, {
          childList: true,
          subtree: true
        });
    });
}

// Copies text to clipboard
function copyText(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

// Adds commas to numbers that are missing them
function formatNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Returns preferred locale from browser
function getLocale() {
    if (navigator.languages != undefined) {
        return navigator.languages[0]; 
    }
    return "en-us";
}

// Converts seconds to hours (rounded)
function secondsToHours(timeInSeconds) {
    return parseInt(Math.floor(timeInSeconds / 3600));
}

// Returns number of days between 2 dates
function getNumberOfDays(start, end) {
    const date1 = new Date(start);
    const date2 = new Date(end);
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInTime = date2.getTime() - date1.getTime();
    const diffInDays = Math.round(diffInTime / oneDay);
    return diffInDays;
}

//Set cookie
function setCookie(c_name, value, expiredays) {
	var exdate = new Date()
	exdate.setDate(exdate.getDate() + expiredays)
	document.cookie = c_name+ "=" +escape(value)+((expiredays == null) ? "" : ";expires=" + exdate + ";path=/")
}

//Get cookie by name
function getCookie(c_name) {
	if (document.cookie.length > 0)
	{
		c_start=document.cookie.indexOf(c_name + "=");
		if (c_start!=-1)
		{
			c_start=c_start + c_name.length+1;
			c_end=document.cookie.indexOf(";",c_start);
			if (c_end == -1)
				{
					c_end=document.cookie.length
				}
			return unescape(document.cookie.substring(c_start,c_end))
		}
    }
	return null;
}

$(document).on('keydown', function(event) {
    if (event.key == "Escape") {
        window.scrollTo(0,document.body.scrollHeight);
    }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setBmLink() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", 'https://api.battlemetrics.com/players/match', false);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("Authorization", "Bearer " + bmKey);
    xmlHttp.onreadystatechange = function() {
        
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);
            let bmId = response.data[0].relationships.player.data.id;
            addBmButton(bmId);
        }
    }
    
    xmlHttp.send("{\"data\":[{\"type\":\"identifier\",\"attributes\":{\"type\":\"steamID\",\"identifier\":\"" + getSteamId() + "\"}}]}");
}

function addBmButton(bmId) {
    const bmLink = document.createElement('a');
    bmLink.style.fontSize = "12px";
    bmLink.style.color = "#80e2ff";
    bmLink.style.position = "absolute";
    bmLink.style.marginTop = "-70px";
    bmLink.style.marginLeft = "1px";
    bmLink.style.textDecoration = "underline";
    bmLink.style.display = "block";
    bmLink.target = "_blank";
    bmLink.href = "https://www.battlemetrics.com/rcon/players/" + bmId;
    bmLink.innerHTML = "View Battlemetrics";
    document.getElementsByClassName("namehistory_link")[0].after(bmLink);
}

async function setBanStatus() {
    const gbResult = document.createElement('span');
    gbResult.id = "eac-ban";
    gbResult.innerHTML = "Checking...";
    gbResult.style.marginTop = "5px";
    gbResult.style.position = "absolute";
    document.getElementsByClassName("profile_header_actions")[0].after(gbResult);
    var gbElement = document.getElementById("eac-ban");

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://bans.rustoria.co/api/v1/rustbans/check?token='+orgKey+'&steamId=' + getSteamId(), true);
    xmlHttp.onloadend = function() {
        if (xmlHttp.readyState === 4) {
            if (xmlHttp.status == 200) {
                var response = JSON.parse(xmlHttp.responseText);

                var link = xmlHttp.responseText.substring(xmlHttp.responseText.indexOf("https://twitter.com/rusthackreport/status/") + 42);
                link = "https://twitter.com/rusthackreport/status/" + link.split("\"")[0].split("?ref_src")[0];

                gbElement.innerHTML = "Game Banned! (" + getNumberOfDays(response.banDate, Date.now()) + " Days Ago)";
                gbElement.style.color = "#d86060";
                
                // View link button
                const viewButton = document.createElement('i');
                viewButton.classList.add("fas");
                viewButton.classList.add("fa-eye");
                viewButton.style.marginLeft = "8px";
                viewButton.style.cursor = "pointer";
                viewButton.style.color = "white";
                viewButton.onmouseover = function() {
                    tooltip.show("View original EAC ban");
                }
                viewButton.onmouseleave = function() {
                    tooltip.hide();
                }
                viewButton.onclick = function() {
                    window.open(link, "_blank");
                }

                // Copy link button
                const copyButton = document.createElement('i');
                copyButton.classList.add("fas");
                copyButton.classList.add("fa-copy");
                copyButton.style.marginLeft = "8px";
                copyButton.style.cursor = "pointer";
                copyButton.style.color = "white";
                copyButton.onmouseover = function() {
                    tooltip.show("Copy EAC ban link");
                }
                copyButton.onmouseleave = function() {
                    tooltip.hide();
                }
                copyButton.onclick = function() {
                    copyText(link);

                    copyButton.classList.add("fa-check");
                    copyButton.classList.remove("fa-copy");

                    setTimeout(function () {
                        copyButton.classList.add("fa-copy");
                        copyButton.classList.remove("fa-check");
                    }, 2000);
                }
        
                gbElement.appendChild(viewButton);
                gbElement.appendChild(copyButton);
            } else {
                gbElement.innerHTML = "Not game banned";
                gbElement.style.color = "#26ff26";
            }
        }
    }
    xmlHttp.send(null);
}

function getSteamId() {
    var steamId;
    if (window.location.href.includes("profiles")) {
        steamId = window.location.href.split("/")[window.location.href.split("/").indexOf("profiles") + 1];
    } else if (window.location.href.includes("id")) {
        var vanity = window.location.href.split("/")[window.location.href.split("/").indexOf("id") + 1];

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key="+steamKey+"&vanityurl=" + vanity, false);
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                var response = JSON.parse(xmlHttp.responseText);
                steamId = response.response.steamid;
            }
        }
        xmlHttp.send();
    }
    return steamId;
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function colorizeActivity() {
    // Create a list of all found chat element
    var chatElements;
    if (currentPage == "Overview") {
        try {
            chatElements = document.getElementsByClassName("css-1ft0qe7")[0].getElementsByClassName("css-ym7lu8");
        } catch {}
    } else if (currentPage == "Activity") {
        try {
            chatElements = document.getElementsByClassName("css-11j1tsg")[0].getElementsByClassName("css-ym7lu8");
        } catch {}
    }

    // If there are chat elements found
    if (chatElements) {
        for (var i = 0, len = chatElements.length; i < len; i++) {
            try {
                if (chatElements[i].innerHTML.includes("Rustoria Anti Hack") && chatElements[i].innerHTML.includes("ReportCount")) { 
                    chatElements[i].style.color = "#fd8c8c";
                } else if (chatElements[i].innerHTML.includes("Rustoria Anti Hack") && !chatElements[i].innerHTML.includes("ReportCount")) {
                    chatElements[i].style.color = "#ff5151";
                }

                if (chatElements[i].innerHTML.includes("has spawned")) { 
                    chatElements[i].style.color = "#62d5a0";
                }

                if (chatElements[i].innerHTML.includes("Rustoria Staff Stats")) { 
                    chatElements[i].style.color = "#9ca8ff";
                }

                if (chatElements[i].innerHTML.includes("successfully teleported")) { 
                    chatElements[i].style.color = "#ebc46d";
                }

                if (chatElements[i].innerHTML.includes("successfully traded")) { 
                    chatElements[i].style.color = "#7fbef5";
                }

                if (chatElements[i].innerHTML.includes("left the server")) { 
                    chatElements[i].style.color = "#dfaf00";
                }

                if (chatElements[i].innerHTML.includes("joined the server")) { 
                    chatElements[i].style.color = "#00fb00";
                }

                if (chatElements[i].innerHTML.includes("was suicide by suicide")) { 
                    chatElements[i].style.color = "#f783e3";
                }

                if (chatElements[i].innerHTML.includes("died (Bullet)")) { 
                    chatElements[i].style.color = "#cf7373";
                }

                if (chatElements[i].innerHTML.split(" was killed by ")[0].replace(/[\[\]']+/g,'').match(/^[0-9]+$/) != null) { 
                    chatElements[i].style.color = "#c197bc";
                }

                // Colorize Kills
                if (chatElements[i].firstChild.nextSibling.nextSibling.nodeValue == "was killed by") {
                    const newText = document.createElement('span');
                    newText.innerHTML = "was killed by";
                    // Player killed
                    if (playerInfo.playerIds.includes(chatElements[i].firstChild.nextSibling.nextSibling.nextSibling.nextSibling.innerText.split("] ")[1]) || playerInfo.playerIds.includes(chatElements[i].firstChild.nextSibling.nextSibling.nextSibling.nextSibling.innerText)) {
                        newText.style.color = "#f56060";
                        chatElements[i].firstChild.nextSibling.nextSibling.replaceWith(newText);
                    }
    
                    // Player got killed
                    if (playerInfo.playerIds.includes(chatElements[i].firstChild.innerText.split("] ")[1]) || playerInfo.playerIds.includes(chatElements[i].firstChild.innerText)) { 
                        newText.style.color = "#f6ff67";
                        chatElements[i].firstChild.nextSibling.nextSibling.replaceWith(newText);
                    }
                }
    
                // Colorize reports
                if (chatElements[i].firstChild.nodeValue == "[PlayerReport]") {
                    const newText = document.createElement('span');
                    newText.innerHTML = "[PlayerReport]";

                    // Player reported
                    if (playerInfo.playerIds.includes(chatElements[i].firstChild.nextSibling.nextSibling.innerHTML)) {
                        newText.style.color = "#08fff4";
                        chatElements[i].firstChild.replaceWith(newText);
                    } else { // Player got reported
                        newText.style.color = "#fad316";
                        chatElements[i].firstChild.replaceWith(newText);
                    }
                }
            } catch {}
        }
    }
}

async function colorizeGlobal() {
    // Create a list of all found chat element
    var chatElements;
    if (currentPage == "Global Activity") {
        try {
            chatElements = document.getElementsByClassName("css-11j1tsg")[0].getElementsByClassName("css-ym7lu8");
        } catch {}
    }

    // If there are chat elements found,
    if (chatElements) {
        for (var i = 0, len = chatElements.length; i < len; i++) {
            try {    
                // Colorize reports
                if (chatElements[i].firstChild.nodeValue == "[PlayerReport]") {
                    const newText = document.createElement('span');
                    newText.innerHTML = "[PlayerReport]";
                    newText.style.color = "#ffb631";
                    chatElements[i].firstChild.replaceWith(newText);
                } 
                
                if (chatElements[i].firstChild.innerHTML.includes("(AS MODERATOR)")) {
                    chatElements[i].firstChild.style.color = "#54ff54";
                }
            } catch {}
        }
    }
}

// Colorize steam ID
async function colorizeSteamId() {
    for (var i = 0; i < document.getElementsByClassName("css-18s4qom").length; i++) {
        if (document.getElementsByClassName("css-18s4qom")[i].innerHTML == "Steam ID") {
            document.getElementsByClassName("css-18s4qom")[i].id = "steam-id-label"
            document.getElementsByClassName("css-18s4qom")[i].parentElement.previousSibling.firstChild.firstChild.id = "steam-id"
        }
    }
}

// Converts percentage to color
function colorize(perc) {
    if (perc > 100) {
       perc = 100;
    }
   var r, g, b = 0;
   if(perc < 50) {
       r = 255;
       g = Math.round(5.1 * perc);
   }
   else {
       g = 255;
       r = Math.round(510 - 5.10 * perc);
   }
   var h = r * 0x10000 + g * 0x100 + b * 0x1;
   return '#' + ('000000' + h.toString(16)).slice(-6);
}

// Converts ratio to color
function colorizeReverse(perc) {
    if (perc > 100) {
        perc = 100;
    }
    var r, g, b = 0;
    if(perc <= 50) {
        g = 255;
        r = Math.round(5.1 * perc);
    }
    else {
        r = 255;
        g = Math.round(255 - 5.10 * perc);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Creates scroll to bottom element
function createScrollToBottom() {
    var scrollToBottom = document.createElement("span");
    scrollToBottom.id = "scroll-to-bottom";
    scrollToBottom.innerHTML = "Scroll To Bottom";
    scrollToBottom.onclick = function() { ScrollToBottom(); };

    if (currentPage == "Overview") {
        elementReady('.css-1ft0qe7').then(()=>{
            if (!document.getElementById("scroll-to-bottom")) {
                document.getElementsByClassName("css-1ft0qe7")[0].parentElement.appendChild(scrollToBottom);
            }
        });
    } else if (currentPage == "Activity" || currentPage == "Global Activity") {
        elementReady('.css-11j1tsg').then(()=>{
            if (!document.getElementById("scroll-to-bottom")) {
                document.getElementsByClassName("css-11j1tsg")[0].parentElement.appendChild(scrollToBottom);
            }
        });
    }
}

async function ScrollToBottom() {
    if (currentPage == "Overview") {
        document.getElementsByClassName("css-1ft0qe7")[0].getElementsByClassName("ReactVirtualized__Grid")[0].scrollTop = document.getElementsByClassName("css-1ft0qe7")[0].getElementsByClassName("ReactVirtualized__Grid")[0].scrollHeight;
    } else if (currentPage == "Activity" || currentPage == "Global Activity") {
        document.getElementsByClassName("css-11j1tsg")[0].getElementsByClassName("ReactVirtualized__Grid")[0].scrollTop = document.getElementsByClassName("css-11j1tsg")[0].getElementsByClassName("ReactVirtualized__Grid")[0].scrollHeight;
    }
}

var scrolling = false;
async function createScrollToTop() {
    var scrollToTop = document.createElement("span");
    scrollToTop.id = "scroll-to-top";
    scrollToTop.innerHTML = "Scroll To Top";
    scrollToTop.onclick = function() { 
        if (scrolling == false) {
            scrolling = true;
            scrollToTop.innerHTML = "Stop Scrolling";
            scrollToTop.style.color = "#e75e5e";
            ScrollToTop(); 
        } else {
            scrollToTop.innerHTML = "Scroll To Top";
            scrollToTop.style.color = "#b1b1b1";
            scrolling = false;
        }
    };

    if (currentPage == "Overview") {
        elementReady('.css-ym7lu8').then(()=>{
            if (!document.getElementById("scroll-to-top")) {
                document.getElementsByClassName("col-md-6")[1].firstChild.appendChild(scrollToTop);
            }
        });
    } 
}

async function ScrollToTop() {
    document.getElementsByClassName("css-1ft0qe7")[0].getElementsByClassName("ReactVirtualized__Grid")[0].scrollTop = 0;
    setTimeout(() => {
        if (document.getElementsByClassName("css-1ft0qe7")[0].getElementsByClassName("ReactVirtualized__Grid")[0].scrollTop != 0 && scrolling == true) {
            ScrollToTop();
        } else if (document.getElementsByClassName("css-1ft0qe7")[0].getElementsByClassName("ReactVirtualized__Grid")[0].scrollTop == 0 && scrolling == true) {
            scrolling = false;
            document.getElementById("scroll-to-top").innerHTML = "Scroll To Top";
            document.getElementById("scroll-to-top").style.color = "#b1b1b1";
        }
    }, 500);
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Shortens names in server dropdown to alias
function setBanAlias() {
    for (var i=0; i < document.getElementsByTagName("select")[0].childNodes.length; i++)  {
        var alias;
        var originalName = document.getElementsByTagName("select")[0].childNodes[i].innerHTML;

        if (originalName.includes("[EU]") && originalName.includes("2x Vanilla")) { // EU 2x Mondays
            alias = "EU 2x Mondays";
        } else if (originalName.includes("[US]") && originalName.includes("2x Vanilla")) { // US 2x Mondays
            alias = "US 2x Mondays";
        } else if (originalName.includes("[EU]") && originalName.includes("3x No BPs")) { // EU 3x No BPs
            alias = "EU 3x No BPs";
        } else if (originalName.includes("[US]") && originalName.includes("3x No BPs")) { // US 3x No Bps
            alias = "US 3x No BPs";
        } else if (originalName.includes("[EU]") && originalName.includes("Zeus 5x")) { // EU Zeus 5x
            alias = "EU Zeus 5x";
        } else if (originalName.includes("[US]") && originalName.includes("Zeus 5x")) { // US Zeus 5x
            alias = "US Zeus 5x";
        } else if (originalName.includes("[EU]") && originalName.includes("5x No BPs")) { // EU 5x No BPs
            alias = "EU 5x No BPs";
        } else if (originalName.includes("[US]") && originalName.includes("5x No BPs")) { // US 5x No BPs
            alias = "US 5x No BPs";
        } else if (originalName.includes("[EU]") && originalName.includes("10x No BPs")) { // EU 10x No BPs
            alias = "EU 10x No BPs";
        } else if (originalName.includes("[US]") && originalName.includes("10x No BPs")) { // US 10x No BPs
            alias = "US 10x No BPs";
        } else if (originalName.includes("5x No BPs [ Solo/Duo/Trio")) { // US 5x Trio
            alias = "US 5x Trio";
        } else if (originalName.includes("EU Main")) { // EU Main
            alias = "EU Main";
        } else if (originalName.includes("US Main")) { // US Main
            alias = "US Main";
        } else if (originalName.includes("EU Medium")) { // EU Medium
            alias = "EU Medium";
        } else if (originalName.includes("US Medium")) { // US Medium
            alias = "US Medium";
        } else if (originalName.includes("EU Long")) { // EU Long
            alias = "EU Long";
        } else if (originalName.includes("US Long")) { // US Long
            alias = "US Long";
        } else if (originalName.includes("EU Small")) { // EU Small
            alias = "EU Small";
        } else if (originalName.includes("US Small")) { // US Small
            alias = "US Small";
        } else if (originalName.includes("US Mondays")) { // US Mondays
            alias = "US Mondays";
        } else if (originalName.includes("[EU] Rustoria.co - RTG (UKN) Combat")) { // EU RTG
            alias = "EU RTG";
        } else if (originalName.includes("[US-E] Rustoria.co - RTG (UKN)")) { // US-East RTG
            alias = "US-East RTG";
        } else if (originalName.includes("[US-C] Rustoria.co - RTG (UKN)")) { // US-Central RTG
            alias = "US-Central RTG";
        } else if (originalName.includes("[AU] Rustoria.co - RTG (UKN) Combat")) { // AU RTG
            alias = "AU RTG";
        } else if (originalName.includes("[EU] Rustoria.co - Base Invaders")) { // EU Base Invaders
            alias = "EU Base Invaders";
        } else if (originalName.includes("[US] Rustoria.co - Base Invaders")) { // NA Base Invaders
            alias = "NA Base Invaders";
        } else if (originalName.includes("[US] Rustoria.co - RTG (UKN) #1")) { // NA Base Invaders
                alias = "US RTG";
        } else if (originalName == "") {
            alias = "No Server Selected";
        }

        if (alias != undefined) {
            document.getElementsByTagName("select")[0].options[i].innerHTML = alias;
        }
    }
}

function createBanButtons() {
    var banButtonDiv = document.createElement("div");
    banButtonDiv.id = "ban-button-div";

    var uncheckAllButton = document.createElement("span");
    uncheckAllButton.id = "ban-uncheck-all";
    uncheckAllButton.innerHTML = "Uncheck All";
    uncheckAllButton.onclick = function() { 
        uncheckAllBanIds(); 
    };

    var banDivider = document.createElement("span");
    banDivider.id = "ban-divider";
    banDivider.innerHTML = "    |    ";

    var standardBanButton = document.createElement("span");
    standardBanButton.id = "ban-standard-button";
    standardBanButton.innerHTML = "Standard Ban</br>";
    standardBanButton.onclick = function() { 
        uncheckAllBanIds(false); 
        checkStandardBanIds();
    };

    // Append elements to page
    banButtonDiv.appendChild(uncheckAllButton);
    if (currentPage != "Edit Ban") {
        banButtonDiv.appendChild(banDivider);
        banButtonDiv.appendChild(standardBanButton);
    }
    if (!document.getElementById("ban-button-div")) {
        elementReady('strong').then(() => {
            document.getElementsByTagName("strong")[0].appendChild(banButtonDiv);
        })
    }
}

// Unchecks all selected identifiers
function uncheckAllBanIds(showConfirmation = true) {
    var checkboxes = document.querySelectorAll("input[type='checkbox']");
    for (var i=0; i < checkboxes.length; i++)  {
        if (checkboxes[i].checked == true) {
            try {
                if (checkboxes[i].nextSibling.className.includes("css-q39y9k")) {
                    checkboxes[i].click();
                }
            } catch {}
        }
    }

    if (showConfirmation == true) {
        document.getElementById('ban-uncheck-all').style.color = "#55d24d";
        document.getElementById('ban-uncheck-all').innerHTML = "Unchecked!";
    
        setTimeout(function () {
            document.getElementById('ban-uncheck-all').style.color = "#ff7c7c";
            document.getElementById('ban-uncheck-all').innerHTML = "Uncheck All";
        }, 1000);
    }
}

// Checks Steam ID and first found IP
function checkStandardBanIds() {
    var firstIpFound = false;
    var firstIdFound = false;
    var checkboxes = document.querySelectorAll("input[type='checkbox']");

    for (var i=0; i < checkboxes.length; i++)  {
        try {
            if (checkboxes[i].nextSibling.className.includes("css-q39y9k") && checkboxes[i].nextSibling.nextSibling.nextSibling.innerHTML.includes("IP") && firstIpFound == false) {
                firstIpFound = true;
                checkboxes[i].click();
            }

            if (checkboxes[i].nextSibling.className.includes("css-q39y9k") && checkboxes[i].nextSibling.nextSibling.nextSibling.innerHTML.includes("Steam ID") && firstIdFound == false) {
                firstIdFound = true;
                checkboxes[i].click();
            }
        } catch {}
    }

    document.getElementById('ban-standard-button').style.color = "#55d24d";
    document.getElementById('ban-standard-button').innerHTML = "Standard Ban Selected!</br>";

    setTimeout(function () {
        document.getElementById('ban-standard-button').style.color = "#ff7c7c";
        document.getElementById('ban-standard-button').innerHTML = "Standard Ban</br>";
    }, 1000);
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var rustOnly = true;

function CreateRustOnlyButton() {
    setTimeout(function(){ 
        var toggleBox = document.createElement("input");
        toggleBox.type = "checkbox";
        toggleBox.id = "toggle-box";
    
        var toggleLabel = document.createElement('label')
        toggleLabel.htmlFor = 'toggle-box';
        toggleLabel.innerHTML = "Only show Rust";
        toggleLabel.style.position = "absolute";
        toggleLabel.style.marginTop = ".5px";
        toggleLabel.style.marginLeft = "8px";
    
        toggleBox.onclick = function() { toggleRustOnly(); };
    
        elementReady('.col-md-12').then(()=>{
            if (!document.getElementById("toggle-box")) {
                document.getElementsByClassName("col-md-12")[0].prepend(toggleLabel);
                document.getElementsByClassName("col-md-12")[0].prepend(toggleBox);
            }
        });
     }, 1000);
}

function toggleRustOnly() {
    if (rustOnly == true) {
        rustOnly = false;
        for (var i = 0; i < document.getElementsByClassName("css-5ens21").length; i++) {
            if (!document.getElementsByClassName("css-5ens21")[i].firstChild.firstChild.href.includes("rust")) {
                document.getElementsByClassName("css-5ens21")[i].style.display = "none";
            }
        }
    } else {
        rustOnly = true;
        for (var i = 0; i < document.getElementsByClassName("css-5ens21").length; i++) {
            if (!document.getElementsByClassName("css-5ens21")[i].firstChild.firstChild.href.includes("rust")) {
                document.getElementsByClassName("css-5ens21")[i].style.display = "block";
            }
        }
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function createVpnButton() {
    var toggleBox = document.createElement("input");
    toggleBox.type = "checkbox";
    toggleBox.id = "vpn-toggle-box";

    var toggleLabel = document.createElement('label')
    toggleLabel.id = "vpn-toggle-label";
    toggleLabel.htmlFor = 'vpn-toggle-box';
    toggleLabel.innerHTML = "Hide VPN Identifiers";

    toggleBox.onclick = function() { toggleVpn(); };

    if (!document.getElementById("vpn-toggle-box")) {
        document.getElementsByClassName("css-8uhtka")[0].after(toggleLabel);
        document.getElementsByClassName("css-8uhtka")[0].after(toggleBox);
    }
}

var hideVpn = false;
function toggleVpn() {
    if (hideVpn == false) {
        hideVpn = true;
        for (var i = 0; i < document.getElementsByTagName("tr").length; i++) {
            var limit = 0;
            try {
                if (document.getElementsByTagName("tr")[i].getElementsByClassName("glyphicon-info-sign")[0].nextSibling.nextSibling.nextSibling.nodeValue > 25) {
                    limit = 1;
                }
            } catch {}

            if (document.getElementsByTagName("tr")[i].innerHTML.includes("This IP appears to belong to a proxy or VPN service.") || limit == 1) {
                document.getElementsByTagName("tr")[i].style.display = "none";
            }
        }
    } else {
        hideVpn = false;
        for (var i = 0; i < document.getElementsByTagName("tr").length; i++) {
            document.getElementsByTagName("tr")[i].style.display = "";
        }
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function setAlias() {
    for (var i = 0, len =  document.getElementsByClassName("server-link").length; i < len; i++) {
        var originalName = document.getElementsByClassName("server-link")[i].firstChild.innerHTML;

        if (originalName.includes("[EU]") && originalName.includes("2x Vanilla")) { // EU 2x Mondays
            alias = "EU 2x Mondays";
        } else if (originalName.includes("[US]") && originalName.includes("2x Vanilla")) { // US 2x Mondays
            alias = "US 2x Mondays";
        } else if (originalName.includes("[EU]") && originalName.includes("3x No BPs")) { // EU 3x No BPs
            alias = "EU 3x No BPs";
        } else if (originalName.includes("[US]") && originalName.includes("3x No BPs")) { // US 3x No Bps
            alias = "US 3x No BPs";
        } else if (originalName.includes("[EU]") && originalName.includes("Zeus 5x")) { // EU Zeus 5x
            alias = "EU Zeus 5x";
        } else if (originalName.includes("[US]") && originalName.includes("Zeus 5x")) { // US Zeus 5x
            alias = "US Zeus 5x";
        } else if (originalName.includes("[EU]") && originalName.includes("5x No BPs")) { // EU 5x No BPs
            alias = "EU 5x No BPs";
        } else if (originalName.includes("[US]") && originalName.includes("5x No BPs")) { // US 5x No BPs
            alias = "US 5x No BPs";
        } else if (originalName.includes("[EU]") && originalName.includes("10x No BPs")) { // EU 10x No BPs
            alias = "EU 10x No BPs";
        } else if (originalName.includes("[US]") && originalName.includes("10x No BPs")) { // US 10x No BPs
            alias = "US 10x No BPs";
        } else if (originalName.includes("5x No BPs [ Solo/Duo/Trio")) { // US 5x Trio
            alias = "US 5x Trio";
        } else if (originalName.includes("EU Main")) { // EU Main
            alias = "EU Main";
        } else if (originalName.includes("US Main")) { // US Main
            alias = "US Main";
        } else if (originalName.includes("EU Medium")) { // EU Medium
            alias = "EU Medium";
        } else if (originalName.includes("US Medium")) { // US Medium
            alias = "US Medium";
        } else if (originalName.includes("EU Long")) { // EU Long
            alias = "EU Long";
        } else if (originalName.includes("US Long")) { // US Long
            alias = "US Long";
        } else if (originalName.includes("EU Small")) { // EU Small
            alias = "EU Small";
        } else if (originalName.includes("US Small")) { // US Small
            alias = "US Small";
        } else if (originalName.includes("US Mondays")) { // US Mondays
            alias = "US Mondays";
        } else if (originalName.includes("[EU] Rustoria.co - RTG (UKN) Combat")) { // EU RTG
            alias = "EU RTG";
        } else if (originalName.includes("[US-E] Rustoria.co - RTG (UKN)")) { // US-East RTG
            alias = "US-East RTG";
        } else if (originalName.includes("[US-C] Rustoria.co - RTG (UKN)")) { // US-Central RTG
            alias = "US-Central RTG";
        } else if (originalName.includes("[AU] Rustoria.co - RTG (UKN) Combat")) { // AU RTG
            alias = "AU RTG";
        } else if (originalName.includes("[EU] Rustoria.co - Base Invaders")) { // EU Base Invaders
            alias = "EU Base Invaders";
        } else if (originalName.includes("[US] Rustoria.co - Base Invaders")) { // NA Base Invaders
            alias = "NA Base Invaders";
        } else if (originalName.includes("[US] Rustoria.co - RTG (UKN) #1")) { // RTG #1
            alias = "US RTG";
        }

        if (!document.getElementsByClassName("server-link")[i].firstChild.getAttribute("data-alias")) {
            document.getElementsByClassName("server-link")[i].firstChild.setAttribute("data-alias", alias);
        }
        document.getElementsByClassName("server-link")[i].firstChild.innerHTML = document.getElementsByClassName("server-link")[i].firstChild.getAttribute("data-alias");
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function setServerInfo() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://rustoria.co/serverinfo', false);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);

            var fullName = document.getElementsByClassName("css-1bbtlcl")[0].firstChild.nextSibling.firstChild.innerHTML;
            var href = "https://www.battlemetrics.com/rcon/servers/" + document.getElementsByClassName("css-1bbtlcl")[0].firstChild.nextSibling.firstChild.href.split("/").pop();
            var alias;
            var command;
            var wipeSchedule;
            var mapSize;
            var clanLimit;
            var teamUi;
            var lastWiped;
            var players;
            var status;
            var maxPlayers;

            for (var i = 0, len = response.length; i < len; i++) {
                if (fullName == response[i].name) {
                    let wipeTimeRaw = response[i].wipedAt;
                    wipeTimeRaw = new Date(wipeTimeRaw + " UTC").toISOString();
                    wipeTimeRaw = new Date(wipeTimeRaw).toLocaleString(getLocale());
                    wipeTimeRaw = wipeTimeRaw.replace(",", " ");
                    lastWiped = "</br>Last Wiped: " + wipeTimeRaw;

                    players = "</br>Players Online: " + response[i].players + " ("+response[i].queued+" in queue)";

                    if (response[i].status == true) {
                        status = "</br>Server Status: Online";
                    } else {
                        status = "</br>Server Status: Offline";
                    }

                    maxPlayers = "</br>Max Players: " + response[i].maxPlayers;
                }
            }

            if (fullName.includes("[EU]") && fullName.includes("2x Vanilla")) { // EU 2x Mondays
                alias = "EU 2x Mondays";
                command = "Connect 2xmon.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Mon @ 4PM CEST / 10AM EST";
                mapSize = "</br>Map Size: 3700";
                clanLimit = "";
                teamUi = "</br>Team UI: 8";
            } else if (fullName.includes("[US]") && fullName.includes("2x Vanilla")) { // US 2x Mondays
                alias = "US 2x Mondays";
                command = "Connect 2xmon.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Mon @ 9PM CEST / 3PM EST";
                mapSize = "</br>Map Size: 3700";
                clanLimit = "";
                teamUi = "</br>Team UI: 8";
            } else if (fullName.includes("[EU]") && fullName.includes("3x No BPs")) { // EU 3x No BPs
                alias = "EU 3x No BPs";
                command = "Connect 3x.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Mon & Fri @ 2PM CEST / 8AM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 6";
                teamUi = "";
            } else if (fullName.includes("[US]") && fullName.includes("3x No BPs")) { // US 3x No Bps
                alias = "US 3x No BPs";
                command = "Connect 3x.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Fri @ 9PM CEST / 3PM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 6";
                teamUi = "";
            } else if (fullName.includes("[EU]") && fullName.includes("Zeus 5x")) { // EU Zeus 5x
                alias = "EU Zeus 5x";
                command = "Connect zeus.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Mon & Thur @ 12PM CEST / 6AM EST";
                mapSize = "</br>Map Size: 3800";
                clanLimit = "</br>Clan Limit: 8";
                teamUi = "";
            } else if (fullName.includes("[US]") && fullName.includes("Zeus 5x")) { // US Zeus 5x
                alias = "US Zeus 5x";
                command = "Connect zeus.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Mon & Thur @ 9PM CEST / 3PM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 8";
                teamUi = "";
            } else if (fullName.includes("[EU]") && fullName.includes("5x No BPs")) { // EU 5x No BPs
                alias = "EU 5x No BPs";
                command = "Connect nobps.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Wed & Sun @ 12PM CEST / 6AM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 8";
                teamUi = "";
            } else if (fullName.includes("[US]") && fullName.includes("5x No BPs")) { // US 5x No BPs
                alias = "US 5x No BPs";
                command = "Connect nobps.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Wed @ 9PM CEST / 3PM EST & Sun @ 7PM CEST / 1PM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 8";
                teamUi = "";
            } else if (fullName.includes("[EU]") && fullName.includes("10x No BPs")) { // EU 10x No BPs
                alias = "EU 10x No BPs";
                command = "Connect 10x.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Tue & Fri @ 5PM CEST / 11AM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 5";
                teamUi = "";
            } else if (fullName.includes("[US]") && fullName.includes("10x No BPs")) { // US 10x No BPs
                alias = "US 10x No BPs";
                command = "Connect 10x.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Tue & Fri @ 11PM CEST / 5PM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 5";
                teamUi = "";
            } else if (fullName.includes("5x No BPs [ Solo/Duo/Trio")) { // US 5x Trio
                alias = "US 5x Trio";
                command = "Connect trio5x.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Sat @ 7PM CEST / 1PM EST & Tue @ 9PM CEST / 3PM EST";
                mapSize = "</br>Map Size: 3750";
                clanLimit = "</br>Clan Limit: 3";
                teamUi = "";
            } else if (fullName.includes("EU Main")) { // EU Main
                alias = "EU Main";
                command = "Connect main.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Thur @ 4PM CEST / 10AM EST";
                mapSize = "</br>Map Size: 4250";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 16";
            } else if (fullName.includes("US Main")) { // US Main
                alias = "US Main";
                command = "Connect main.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Thur @ 3PM CEST / 9AM EST";
                mapSize = "</br>Map Size: 4500";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 16";
            } else if (fullName.includes("EU Medium")) { // EU Medium
                alias = "EU Medium";
                command = "Connect medium.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Thur @ 4PM CEST / 10AM EST (Bi-weekly)";
                mapSize = "</br>Map Size: 4250";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 8";
            } else if (fullName.includes("US Medium")) { // US Medium
                alias = "US Medium";
                command = "Connect medium.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Thur @ 9PM CEST / 3PM EST (Bi-weekly)";
                mapSize = "</br>Map Size: 4250";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 8";
            } else if (fullName.includes("EU Long")) { // EU Long
                alias = "EU Long";
                command = "Connect long.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Force wipe (Usually 8PM UK CEST / 2PM EST) (Monthly)";
                mapSize = "</br>Map Size: 4750";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 12";
            } else if (fullName.includes("US Long")) { // US Long
                alias = "US Long";
                command = "Connect long.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Force wipe (Usually 8PM UK CEST / 2PM EST) (Monthly)";
                mapSize = "</br>Map Size: 4750";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 12";
            } else if (fullName.includes("EU Small")) { // EU Small
                alias = "EU Small";
                command = "Connect small.rustoria.uk:28015";
                wipeSchedule = "Wipe Schedule: Thur @ 4PM CEST / 10AM EST";
                mapSize = "</br>Map Size: 3250";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 8";
            } else if (fullName.includes("US Small")) { // US Small
                alias = "US Small";
                command = "Connect small.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Thur @ 9PM CEST / 3PM EST";
                mapSize = "</br>Map Size: 3250";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 8";
            } else if (fullName.includes("US Mondays")) { // US Mondays
                alias = "US Mondays";
                command = "Connect mon.rustoria.us:28015";
                wipeSchedule = "Wipe Schedule: Mon @ 9PM CEST / 3PM EST";
                mapSize = "</br>Map Size: 3700";
                clanLimit = "</br>Clan Limit: Unlimited";
                teamUi = "</br>Team UI: 12";
            } else if (fullName.includes("[EU] Rustoria.co - RTG (UKN) Combat")) { // EU RTG
                alias = "EU RTG";
                command = "Connect rtg.rustoria.uk:28015";
                wipeSchedule = "No information available";
                mapSize = "";
                clanLimit = "";
                teamUi = "";
            } else if (fullName.includes("[US-E] Rustoria.co - RTG (UKN)")) { // US-East RTG
                alias = "US-East RTG";
                command = "Connect rtg.rustoria.na:28015";
                wipeSchedule = "No information available";
                mapSize = "";
                clanLimit = "";
                teamUi = "";
            } else if (fullName.includes("[US-C] Rustoria.co - RTG (UKN)")) { // US-Central RTG
                alias = "US-Central RTG";
                command = "Connect 199.231.233.60:28015";
                wipeSchedule = "No information available";
                mapSize = "";
                clanLimit = "";
                teamUi = "";
            } else if (fullName.includes("[AU] Rustoria.co - RTG (UKN) Combat")) { // AU RTG
                alias = "AU RTG";
                command = "Connect rtg.rustoria.asia:28015";
                wipeSchedule = "No information available";
                mapSize = "";
                clanLimit = "";
                teamUi = "";
            } else if (fullName.includes("[EU] Rustoria.co - Base Invaders")) { // EU Base Invaders
                alias = "EU Base Invaders";
                command = "Connect eu.bi.rustoria.co:28015";
                wipeSchedule = "No information available";
                mapSize = "";
                clanLimit = "";
                teamUi = "";
            } else if (fullName.includes("[US] Rustoria.co - Base Invaders")) { // NA Base Invaders
                alias = "NA Base Invaders";
                command = "Connect na.bi.rustoria.co:28025";
                wipeSchedule = "No information available";
                mapSize = "";
                clanLimit = "";
                teamUi = "";
            } else if (fullName.includes("[US] Rustoria.co - RTG (UKN) #1")) { // NA Base Invaders
                alias = "US RTG";
                command = "Connect rtg.rustoria.us:28015";
                wipeSchedule = "No information available";
                mapSize = "";
                clanLimit = "";
                teamUi = "";
            }

            // Creates server info label
            const server = document.createElement('a');
            server.style.paddingLeft = "9px";
            server.style.marginTop = "-16px";
            server.style.cursor = "default";
            server.style.color = "white";
            server.id = "server";
            server.href = href;
            server.target = "_blank";
            server.innerHTML = alias + " (Joined " + document.getElementsByClassName("css-1bbtlcl")[0].firstChild.nextSibling.nextSibling.nextSibling.firstChild.innerHTML + ")";
            server.onmouseover = function() {
                tooltip.show(wipeSchedule + lastWiped + status + maxPlayers + players + mapSize + clanLimit + teamUi + lastWiped);
            }
            server.onmouseleave = function() {
                tooltip.hide();
            }

            // Creates copy connection command button
            const copyServerBtn = document.createElement('i');
            copyServerBtn.classList.add("fas");
            copyServerBtn.classList.add("fa-copy");
            copyServerBtn.style.marginLeft = "6px";
            copyServerBtn.style.cursor = "pointer";
            copyServerBtn.onmouseover = function() {
                tooltip.show("<b>Copy server connection command:</b></br>"+command);
            }
            copyServerBtn.onmouseleave = function() {
                tooltip.hide();
            }
            copyServerBtn.onclick = function() {
                copyText(command);

                copyServerBtn.classList.add("fa-check");
                copyServerBtn.classList.remove("fa-copy");

                setTimeout(function () {
                    copyServerBtn.classList.add("fa-copy");
                    copyServerBtn.classList.remove("fa-check");
                }, 2000);
            }

            document.getElementsByClassName("css-8uhtka")[0].style.margin = "3px";
            document.getElementsByClassName("css-8uhtka")[0].parentNode.insertBefore(server, document.getElementsByClassName("css-8uhtka")[0].nextSibling);
            server.parentNode.insertBefore(copyServerBtn, server.nextSibling);

            setInterval(() => {
                server.onmouseover = function() {
                    tooltip.show(wipeSchedule + lastWiped + status + maxPlayers + players + mapSize + clanLimit + teamUi);
                }
            }, 1000);
        }
    }
    xmlHttp.send(null);
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var historyIterations = 5;

// On #chart-select value change
function changeChart() {
    document.getElementById("chart-loading-label").innerHTML = "  <b>Loading...</b>";
    document.getElementById("chart-loading-label").style.display = "inline";

    if (document.getElementById("chart")) {
        document.getElementById("chart").remove();
    }

    if (document.getElementById("chart-select").value == "K/D Ratio") {
        setKD(1);
    } else if (document.getElementById("chart-select").value == "Kills") {
        setKD(2);
    } else if (document.getElementById("chart-select").value == "Deaths") {
        setKD(3);
    } else if (document.getElementById("chart-select").value == "Public Profile (Overall)") {
        setPublicProfile('https://api.battlemetrics.com/players/'+playerInfo.bmId+'/relationships/sessions?page[size]=100', historyIterations);
    } else if (document.getElementById("chart-select").value == "Public Profile (Rustoria)") {
        setPublicProfile('https://api.battlemetrics.com/players/'+playerInfo.bmId+'/relationships/sessions?page[size]=100&filter[organizations]=3605', historyIterations);
    } else if (document.getElementById("chart-select").value == "Sessions (Overall)") {
        setSession('https://api.battlemetrics.com/players/'+playerInfo.bmId+'/relationships/sessions?page[size]=100', historyIterations);
    } else if (document.getElementById("chart-select").value == "Sessions (Rustoria)") {
        setSession('https://api.battlemetrics.com/players/'+playerInfo.bmId+'/relationships/sessions?page[size]=100&filter[organizations]=3605', historyIterations);
    } else if (document.getElementById("chart-select").value == "RTG Accuracy") {
        setRtg();
    }
}

function createSessionChart(x, y, type) {
    // Formats dates before processing
    for(var i = 0; i < x.length; i++) {
        x[i] = new Date(x[i]).toISOString();
        x[i] = new Date(x[i]).toLocaleString(getLocale());
        x[i] = x[i].split("T")[0];
        
        x[i] = x[i].split(" ")[0];
        x[i] = x[i].substring(0, x[i].length - 1);

        if (type == "Session") {
            var today = new Date();
            today.setHours(0,0,0,0);
            x[i] += " (" + getNumberOfDays(x[i], today) + " days ago)";
        }
    }

    // Configures session chart
    var data = {
        labels: x,
        datasets: [{
            label: 'Hours Played',
            data: y,
            borderColor: 'white',
            backgroundColor: 'rgb(255, 99, 132)',
        }]
    };

    var config = {
        type: 'bar',
        data: data,
        responsive: true,
        options: {
            scales: {
                y: {
                    ticks: {
                        color: 'white',
                        callback: function(value, index, values) {
                            return value + ' Hours';
                        }
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    },
                    position: 'top'
                },
            }
        }
    };

    // Creates chart
    const chartView = document.createElement('canvas');
    chartView.id = "chart";
    document.getElementById("chart-div").appendChild(chartView);
    var chart = new Chart(document.getElementById('chart'), config);
    chart.update();
    document.getElementById("chart-loading-label").style.display = "none";
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Updates BM and Steam profile ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function updateProfile() {
    playerInfo = {
        steamData : 0,
        steamId : 0,
        playerIds : [],
        bmId : 0,
        linkedAccounts : 0,
        totalHours : 0,
        atHours : 0,
        orgHours : 0,
        reports : 0,
        reportsToday : 0,
        kills: 0,
        killsToday: 0,
        deaths: 0,
        deathsToday: 0,
        kd: 0,
        kdToday: 0,
        uniqueKills: [],
        uniqueKillsToday: []
    }

    playerInfo.bmId = currentHref.match("players\/[0-9]+\/*")[0].replace("players/", "").replace("/", "");

    var bmReq = new XMLHttpRequest();
    bmReq.open("GET", 'https://api.battlemetrics.com/players/'+playerInfo.bmId+'?include=identifier', false);
    bmReq.setRequestHeader("Authorization", "Bearer " + bmKey);
    bmReq.send(null);

    var bmJson = JSON.parse(bmReq.responseText);
    var bmIds = [];

    for(var i = 0; i < bmJson.included.length; i++) {
        if (!bmIds.includes(bmJson.included[i].attributes.identifier) && bmJson.included[i].attributes.type == 'name') {
            bmIds.push(bmJson.included[i].attributes.identifier);
        } else if (bmJson.included[i].attributes.type == 'steamID') {
            playerInfo.steamId = bmJson.included[i].attributes.identifier;
        }
    }

    playerInfo.playerIds = bmIds;
    created = bmJson.data.attributes.createdAt;

    var steamReq = new XMLHttpRequest();
    steamReq.open("GET", 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key='+steamKey+'&steamids='+playerInfo.steamId, false);
    steamReq.send(null);
    playerInfo.steamData = JSON.parse(steamReq.responseText);
}

// Sets user online status ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setOnlineStatus() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://api.battlemetrics.com/activity?tagTypeMode=and&filter[types][blacklist]=event:query&filter[players]='+playerInfo.bmId+'&include=organization,user&page[size]=5', true);
    xmlHttp.setRequestHeader("Authorization", "Bearer " + bmKey);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);
            const status = document.createElement('span');
            status.style.position = "relative";
            status.style.fontSize = "20px";
            status.style.paddingLeft = "10px";
            status.style.top = "-3px";
            status.style.letterSpacing = "1px";
            status.innerHTML = "(Offline)"; 
            status.style.color = "#e75e5e";
            try {
                var offlineTypes = ["event:removePlayer", "adminLog:kick", "webhook", "adminLog:addBMBan", "adminLog:flag:add", "rustLog:eacKick"];
                if (!offlineTypes.includes(response.data[0].attributes.messageType)) {
                    status.innerHTML = "(Online)"; 
                    status.style.color = "#72ec5c";
                }
            } catch {}
            document.getElementsByClassName("css-8uhtka")[0].appendChild(status);
        }
    }
    xmlHttp.send(null);
}

// Sets EAC game ban status ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setGbStatus() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://bans.rustoria.co/api/v1/rustbans/check?token=d6cea6a7-b41c-4bdc-9ce0-1766c6f9df59&steamId=' + playerInfo.steamId, true);
    xmlHttp.onloadend = function() {
        if (xmlHttp.readyState === 4) {
            var gbElement = document.getElementById("eac-ban");

            if (xmlHttp.status == 200) {
                var response = JSON.parse(xmlHttp.responseText);

                var link = xmlHttp.responseText.substring(xmlHttp.responseText.indexOf("https://twitter.com/rusthackreport/status/") + 42);
                link = "https://twitter.com/rusthackreport/status/" + link.split("\"")[0].split("?ref_src")[0];

                gbElement.innerHTML = "Game Banned! (" + getNumberOfDays(response.banDate, Date.now()) + " Days Ago)";
                gbElement.style.color = "#d86060";
                
                // View link button
                const viewButton = document.createElement('i');
                viewButton.classList.add("fas");
                viewButton.classList.add("fa-eye");
                viewButton.style.marginLeft = "8px";
                viewButton.style.cursor = "pointer";
                viewButton.style.color = "white";
                viewButton.onmouseover = function() {
                    tooltip.show("View original EAC ban");
                }
                viewButton.onmouseleave = function() {
                    tooltip.hide();
                }
                viewButton.onclick = function() {
                    window.open(link, "_blank");
                }

                // Copy link button
                const copyButton = document.createElement('i');
                copyButton.classList.add("fas");
                copyButton.classList.add("fa-copy");
                copyButton.style.marginLeft = "8px";
                copyButton.style.cursor = "pointer";
                copyButton.style.color = "white";
                copyButton.onmouseover = function() {
                    tooltip.show("Copy EAC ban link");
                }
                copyButton.onmouseleave = function() {
                    tooltip.hide();
                }
                copyButton.onclick = function() {
                    copyText(link);

                    copyButton.classList.add("fa-check");
                    copyButton.classList.remove("fa-copy");

                    setTimeout(function () {
                        copyButton.classList.add("fa-copy");
                        copyButton.classList.remove("fa-check");
                    }, 2000);
                }
        
                gbElement.appendChild(viewButton);
                gbElement.appendChild(copyButton);
            } else {
                gbElement.innerHTML = "Not game banned";
                gbElement.style.color = "#26ff26";
            }
        }
    }
    xmlHttp.send(null);
}

// Sets linked accounts ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setLinkedAccounts() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://api.battlemetrics.com/players/'+playerInfo.bmId+'/relationships/related-identifiers?filter[matchIdentifiers]=ip&filter[identifiers]=ip&include=player&page[size]=100', true);
    xmlHttp.setRequestHeader("Authorization", "Bearer " + bmKey);
    xmlHttp.send(null);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);

            if (response.included.length > 0) {
                const linkedAccounts = document.createElement('i');
                linkedAccounts.id = "ban-info";
                linkedAccounts.classList.add("fas");
                linkedAccounts.classList.add("fa-info-circle");
                linkedAccounts.style.fontSize = "25px";
                linkedAccounts.style.marginLeft = "8px";
                linkedAccounts.style.color = "white";
                linkedAccounts.style.cursor = "default";
                linkedAccounts.onmouseover = function() {
                    tooltip.show(formatNumber(response.included.length) + " Linked Accounts (Across "+response.data.length+" IPs)");
                }
                linkedAccounts.onmouseleave = function() {
                    tooltip.hide();
                }
                document.getElementsByClassName("css-1xs030v")[0].appendChild(linkedAccounts);
            } 
            document.getElementById("linked").innerHTML = formatNumber(response.included.length);
            document.getElementById("note").value = document.getElementById("note").value.replace("Linked Accounts: 0", "Linked Accounts: " + formatNumber(response.included.length));
            playerInfo.linkedAccounts = formatNumber(response.included.length);
        }
    }
}

// Sets overall play time ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setPlaytime() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://api.battlemetrics.com/players/'+playerInfo.bmId+'?include=server&fields[server]=name', true);
    xmlHttp.setRequestHeader("Authorization", "Bearer " + bmKey);
    xmlHttp.send(null);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);
            var hoursCount = 0;
            var atCount = 0;
            var orgCount = 0;
            var playCount = 0;
        
            for(var i = 0; i < response.included.length; i++) {
                var serverName = response.included[i].attributes.name.toLowerCase();
                if (response.included[i].relationships.game.data.id == 'rust') {
                    playCount++;
                    hoursCount += response.included[i].meta.timePlayed;
        
                    if (serverName.includes("rtg") || serverName.includes("ukn") || serverName.includes("aim") || serverName.includes("train") || serverName.includes("arena") || serverName.includes("combattag")) {
                        atCount += response.included[i].meta.timePlayed;
                    } else if (serverName.includes("rustoria")) {
                        orgCount += response.included[i].meta.timePlayed;
                    }
                }
            }

            try {
                document.getElementById("total-hours").innerHTML = formatNumber(secondsToHours(hoursCount)) + " Hours";
                document.getElementById("total-hours").style.color = colorize(secondsToHours(hoursCount) / 2000 * 100);
                document.getElementById("at-hours").innerHTML = formatNumber(secondsToHours(atCount)) + " Hours";
                document.getElementById("at-hours").style.color = colorize(secondsToHours(atCount) / 200 * 100);
                document.getElementById("org-hours").innerHTML = formatNumber(secondsToHours(orgCount)) + " Hours";
                document.getElementById("org-hours").style.color = colorize(secondsToHours(orgCount) / 150 * 100);
                document.getElementById("server-count").innerHTML = document.getElementById("server-count").innerHTML.replace("Checking...", playCount);

                var totalHours = formatNumber(secondsToHours(hoursCount));
                var atHours =  formatNumber(secondsToHours(atCount));
                var orgHours = formatNumber(secondsToHours(orgCount));

                playerInfo.totalHours = totalHours;
                playerInfo.atHours = atHours;
                playerInfo.orgHours = orgHours;
                document.getElementById("note").value = document.getElementById("note").value.replace("Total hours: 0 (Aimtrain: 0) & Rustoria hours: 0", "Total hours: "+totalHours+" (Aimtrain: "+atHours+") & Rustoria hours: "+orgHours);
            
                setTopServers();
            } catch {}
        }
    }
}



// Sets number of reports
async function setReports() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://api.battlemetrics.com/activity?tagTypeMode=and&filter[types][blacklist]=event:query&filter[players]='+playerInfo.bmId+'&include=organization,user&page[size]=1000', true);
    xmlHttp.setRequestHeader("Authorization", "Bearer " + bmKey);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);
            var totalReports = 0;
            var todayReports = 0;
            var totalUniqueReports = 0;
            var todayUniqueReports = 0;
            var reportedBy = [];

            for(var i = 0; i < response.data.length; i++) {
                if (response.data[i].attributes.messageType == "rustLog:playerReport") {
                    var message = response.data[i].attributes.message.split("reported");
                    var userReporting = message[0].match(/.*\[([^\]]*)\]/)[1];
                    var userReported = message[1].match(/\[(.*?)\]/)[1];

                    // Logs all reports
                    if (userReported == playerInfo.steamId) {
                        totalReports++;
                    }
                    if (userReported == playerInfo.steamId && getNumberOfDays(response.data[i].attributes.timestamp, Date.now()) == 0) {
                        todayReports++;
                    }

                    // Logs all unique reports
                    if (userReported == playerInfo.steamId && !reportedBy.includes(userReporting)) {
                        totalUniqueReports++;
                    }
                    if (userReported == playerInfo.steamId && getNumberOfDays(response.data[i].attributes.timestamp, Date.now()) == 0  && !reportedBy.includes(userReporting)) {
                        todayUniqueReports++;
                    }

                    // Logs all reporting users
                    if (!reportedBy.includes(userReporting)) {
                        reportedBy.push(userReporting);
                    }
                }
            }

            document.getElementById("eac-reports").innerHTML = "<span style='color:"+colorizeReverse(totalReports / 15 * 100)+"'>"+totalReports+"</span> Total | <span style='color:"+colorizeReverse(todayReports / 5 * 100)+"'>"+todayReports+"</span> Today  <i id='unique-reports' class='fas fa-info-circle'></i>";
            document.getElementById("unique-reports").onmouseenter = function() {
                tooltip.show("Unique Reports Total:    "+totalUniqueReports+"</br>Unique Reports Today:  " + todayUniqueReports);
            }
            document.getElementById("unique-reports").onmouseleave = function() {
                tooltip.hide();
            }

            document.getElementById("note").value = document.getElementById("note").value.replace("F7 Reports: 0 & F7 Reports Today: 0", "F7 Reports: "+totalReports+" & F7 Reports Today: " + todayReports);
            playerInfo.reports = totalReports;
            playerInfo.reportsToday = todayReports;
        }
    }
    xmlHttp.send();
}

// Set notes
function setNotes() {
    elementReady('#note').then(()=>{
        document.getElementById("note").rows = "10";
        document.getElementById("note").value = 
`Reported for: Cheating
Total hours: 0 (Aimtrain: 0) & Rustoria hours: 0
Public profile is suspicious & doesn't match Steam profile information | Public profile is normal & Steam profile information is fine
Linked Accounts: 0
F7 Reports: 0 & F7 Reports Today: 0
Kills today: 0 & Deaths today: 0 (0 K/D)
Killfeed: Normal | Above-average
Offline: Not spectated | Spectated: Nothing suspicious`;
    });
}

// Sets hours reported by Steam ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setSteamHours() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=F47C65C88D0997F805B12C3D9F15DC50&steamid='+playerInfo.steamId, false);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var steamResponse = JSON.parse(xmlHttp.responseText);

            try {
                for(var i = 0; i < steamResponse.response.games.length; i++) {
                    if (steamResponse.response.games[i].appid == 252490) {
                        if (steamResponse.response.games[i].playtime_forever > 0) {
                            document.getElementById("total-hours-steam").innerHTML = formatNumber((steamResponse.response.games[i].playtime_forever / 60).toFixed(0)) + " Hours";
                            document.getElementById("total-hours-steam").style.color = colorize((steamResponse.response.games[i].playtime_forever / 60).toFixed(2) / 2000 * 100);
                        } else {
                            document.getElementById("total-hours-steam").style.display = "none";
                            document.getElementById("total-hours-steam").previousSibling.style.display = "none";
                        }
                    }
                }
            } catch {
                document.getElementById("total-hours-steam").style.display = "none";
                document.getElementById("total-hours-steam").previousSibling.style.display = "none";
            }
        }
    }
    xmlHttp.send();
}

// Sets top BM servers ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setTopServers() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://api.battlemetrics.com/players/'+playerInfo.bmId+'?include=server&fields[server]=name', true);
    xmlHttp.setRequestHeader("Authorization", "Bearer " + bmKey);

    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);
            var serversPlayed = [];
            for(var i = 0; i < response.included.length; i++) {
                if (response.included[i].relationships.game.data.id == "rust") {
                    serversPlayed.push([response.included[i].attributes.name, secondsToHours(response.included[i].meta.timePlayed)]);
                }
            }

            // Sorts array
            serversPlayed.sort(function(a, b) {
                var avalue = a[1],
                    bvalue = b[1];
                if (avalue < bvalue) {
                    return -1;
                }
                if (avalue > bvalue) {
                    return 1;
                }
                return 0;
            });
            serversPlayed = serversPlayed.slice(Math.max(serversPlayed.length - 5, 1))
            serversPlayed.reverse();

            // Adds tooltip
            document.getElementById("top-servers").onmouseover = function() {
                var toolTipText = "<b>Most Played Servers:</b><br>";

                for(var i = 0; i < serversPlayed.length; i++) {
                    toolTipText += (i+1) + ". " + serversPlayed[i][1] + " Hours - " + serversPlayed[i][0] + "<br>";
                }

                tooltip.show(toolTipText);
            }
            document.getElementById("top-servers").onmouseleave = function() {
                tooltip.hide();
            }
        }
    }
    xmlHttp.send();
}

// Sets ban list ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function setBanList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://api.battlemetrics.com/bans?sort=-timestamp&filter[player]='+playerInfo.bmId+'&filter[expired]=true', true);
    xmlHttp.setRequestHeader("Authorization", "Bearer " + bmKey);

    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var response = JSON.parse(xmlHttp.responseText);

            var hacking = 0;
            var banEvasion = 0;
            var groupLimit = 0;
            var bugAbuse = 0;
            var playingWithHacker = 0;
            var changeName = 0;
            var takeBreak = 0;
            var playElsewhere = 0;
            var comeToDiscord = 0;
            var chatViolation = 0;
            var playingWithEvader = 0;
            var dox = 0;
            var cycling = 0;
            var advertising = 0;
            var scripting = 0;
            var misc = 0;

            for(var i = 0; i < response.data.length; i++) {
                 if (response.data[i].attributes.reason.toLowerCase().includes("group limit") || response.data[i].attributes.reason.toLowerCase().includes("clan limit")) {
                    groupLimit++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("playing with hacker")) {
                    playingWithHacker++;
                } else if (response.data[i].attributes.reason == "Hacking") {
                    hacking++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("come to discord")) {
                    comeToDiscord++;
                } else if (response.data[i].attributes.reason == "Change your name, restart Rust and then reconnect") {
                    changeName++;
                } else if (response.data[i].attributes.reason == "Take a break") {
                    takeBreak++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("play elsewhere")) {
                    playElsewhere++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("ban evasion")) {
                    banEvasion++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("bug abuse") || response.data[i].attributes.reason.toLowerCase().includes("exploit")) {
                    bugAbuse++;
                } else if (response.data[i].attributes.reason.includes("Chat") || response.data[i].attributes.reason.includes("Racism")) {
                    chatViolation++;
                } else if (response.data[i].attributes.reason.includes("Dox")) {
                    dox++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("playing with ban evader")) {
                    playingWithEvader++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("cycling")) {
                    cycling++;
                } else if (response.data[i].attributes.reason.toLowerCase().includes("advertising")) {
                    advertising++;
                }  else if (response.data[i].attributes.reason.toLowerCase().includes("script")) {
                    scripting++;
                } else {
                    misc++;
                }
            }
            
            var banCount = "<b>Ban Count:</b><br>";
            if (hacking > 0) {
                banCount += hacking + " - Hacking<br>";
            } 
            if (banEvasion > 0) {
                banCount += banEvasion + " - Ban Evasion<br>";
            }
            if (groupLimit > 0) {
                banCount += groupLimit + " - Breaking Group Limit<br>";
            }
            if (bugAbuse > 0) {
                banCount += bugAbuse + " - Bug Abuse<br>";
            }
            if (playingWithHacker > 0) {
                banCount += playingWithHacker + " - Playing With Hacker<br>";       
            }
            if (changeName > 0) {
                banCount += changeName + " - Name Violation<br>";
            }
            if (takeBreak > 0) {
                banCount += takeBreak + " - Take A Break<br>";
            }
            if (playElsewhere > 0) {
                banCount += playElsewhere + " - Play Elsewhere<br>";
            }
            if (chatViolation > 0) {
                banCount += chatViolation + " - Chat Violation<br>";
            }
            if (comeToDiscord > 0) {
                banCount += comeToDiscord + " - Come To Discord<br>";
            }
            if (dox > 0) {
                banCount += dox + " - Doxxing<br>";
            }
            if (playingWithEvader > 0) {
                banCount += playingWithEvader + " - Playing With Ban Evader<br>";
            }
            if (cycling > 0) {
                banCount += cycling + " - Cycling Clan Members<br>";
            }
            if (advertising > 0) {
                banCount += advertising + " - Advertising<br>";
            }
            if (scripting > 0) {
                banCount += scripting + " - Scripting<br>";
            }
            if (misc > 0) {
                banCount += misc + " - Miscellaneous<br>";
            }
            
            if (hacking > 0 || banEvasion > 0 || groupLimit > 0 || bugAbuse > 0 || playingWithHacker > 0 || changeName > 0 || takeBreak > 0 || playElsewhere > 0 || chatViolation > 0 || comeToDiscord > 0 || dox > 0 || playingWithEvader > 0 || cycling > 0 || advertising > 0 || misc > 0 || scripting > 0) {
                const banInfo = document.createElement('i');
                banInfo.id = "ban-info";
                banInfo.classList.add("fas");
                banInfo.classList.add("fa-info-circle");
                banInfo.style.fontSize = "25px";
                banInfo.style.marginLeft = "8px";
                banInfo.style.color = "white";
                banInfo.style.cursor = "default";
                banInfo.onmouseover = function() {
                    tooltip.show(banCount);
                }
                banInfo.onmouseleave = function() {
                    tooltip.hide();
                }
    
                document.getElementsByClassName("css-1xs030v")[2].appendChild(banInfo);
            }
        }
    }
    xmlHttp.send();
}

function toggleNoteTempalte() {
    if (getCookie("note-template") == "false") {
        document.getElementById("note-div").style.display = "none";
    } else {
        document.getElementById("note-div").style.display = "block";
    }
}

function createNoteField(noteLabelText, fieldId, noteOptions) {
    var noteSpan = document.createElement('span');
    noteSpan.classList.add("noteField");

    var noteLabel = document.createElement('span');
    noteLabel.innerHTML = noteLabelText;
    noteLabel.style.fontWeight = "600";

    var noteInput = document.createElement('input');
    noteInput.id = fieldId + "-result";
    noteInput.setAttribute('list', fieldId);
    noteInput.classList.add("noteInput");
    noteInput.oninput = function() {
        updateNotes();
    }

    var noteData = document.createElement('datalist');
    noteData.id = fieldId;
    noteOptions.forEach(function(item) {
        var option = document.createElement('option');
        option.value = item;
        noteData.appendChild(option);
    });

    document.getElementById("note-div").appendChild(noteData);
    document.getElementById("note-div").appendChild(noteSpan);
    noteSpan.appendChild(noteLabel);
    noteSpan.appendChild(noteInput);
}

function updateNotes() {
    if (userInputedNotes == true) {
        Swal.fire({
			title: 'Replace Notes?',
            text: 'You have entered your own notes. By using the note template, this will overwrite what you have written. Are you sure you\'d like to continue?',
			showCancelButton: true,
			confirmButtonText: 'Yes',
		}).then((result) => {
			if (result.isConfirmed) {
                userInputedNotes = false;
                writeNote();
			} else {
                return;
            }
		})
    } else {
        writeNote();
    }
}

function writeNote() {
    var noteField = document.getElementById("note");
    noteField.value = "";
    if (document.getElementById("reported-for-note-result").value.length > 0) {
        noteField.value += "Reported for: " + document.getElementById("reported-for-note-result").value + "\n";
    }

    noteField.value += "Total hours: " + playerInfo.totalHours + " (Aimtrain: " + playerInfo.atHours + ") & Rustoria hours: " + playerInfo.orgHours + "\n";

    if (document.getElementById("steam-profile-note-result").value.length > 0) {
        noteField.value += "Steam Profile: " + document.getElementById("steam-profile-note-result").value + "\n";
    }

    if (document.getElementById("public-profile-note-result").value.length > 0) {
        noteField.value += "Public Profile: " + document.getElementById("public-profile-note-result").value + "\n";
    }

    if (playerInfo.linkedAccounts > 0) {
        noteField.value += "Linked Accounts: " + playerInfo.linkedAccounts + "\n";
    }

    if (playerInfo.reports > 0 || playerInfo.reportsToday > 0) {
        noteField.value += "F7 Reports: " + playerInfo.reports + " & F7 Reports Today: " + playerInfo.reportsToday + "\n";
    }

    if (playerInfo.kills > 0 || playerInfo.deaths > 0 || playerInfo.kd != 0) {
        noteField.value += "Kills today: " + playerInfo.killsToday + " & Deaths today: " + playerInfo.deathsToday + " (" + playerInfo.kdToday + " K/D)\n";
    }

    if (document.getElementById("killfeed-note-result").value.length > 0) {
        noteField.value += "Killfeed: " + document.getElementById("killfeed-note-result").value + "\n";
    }

    if (document.getElementById("spectated-note-result").value.length > 0) {
        noteField.value += document.getElementById("spectated-note-result").value + "\n";
    }

    if (document.getElementById("additional-notes").value.length > 0) {
        noteField.value += document.getElementById("additional-notes").value + "\n";
    }

    if (document.getElementById("eac-toggle-box").checked) {
        noteField.value += "Player was F7 reported\n";
    }

    if (uploadedFiles.length > 0) {
        noteField.value += "\n";
        uploadedFiles.forEach(file => {
            noteField.value += file + "\n";
        });
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function drawOverview() {
    if (!document.getElementById("eac-ban")) {
        drawStats();
        drawNotes();
        drawCharts();
        setNotes();
        setReports();
        setGbStatus();
        setOnlineStatus();
        setPlaytime();
        setLinkedAccounts();
        setServerInfo();
        setSteamHours();
        setBanList();
        toggleNoteTempalte();
        createScrollToBottom();
        setTimeout(() => {
            createScrollToTop();
        }, 2000);
    }
}

function drawStats() {
    elementReady('#note').then(() => {
        document.getElementById("note").rows = "13";
    });

    var statsTab = document.getElementsByClassName("dl-horizontal")[0];

    // Steam avatar ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    try {
        const avatar = document.createElement('img');
        avatar.id = "avatar";
        avatar.src = playerInfo.steamData.response.players[0].avatarmedium;
        document.getElementsByClassName("css-8uhtka")[0].prepend(avatar);
    } catch {}

    // Steam profile copy button ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const copySteamButton = document.createElement('i');
    copySteamButton.id = "copy-steam-button";
    copySteamButton.classList.add('fas', 'fa-copy');
    copySteamButton.onmouseover = function() {
        tooltip.show("Copy link to Steam profile");
    }
    copySteamButton.onmouseleave = function() {
        tooltip.hide();
    }
    copySteamButton.onclick = function() {
        copyText("http://steamcommunity.com/profiles/" + playerInfo.steamId);
        $("#copy-steam-button").toggleClass("fa-check fa-copy");
        setTimeout(function() {
            $("#copy-steam-button").toggleClass("fa-copy fa-check");
        }, 2000);
    }
    statsTab.firstChild.nextSibling.appendChild(copySteamButton)

    // Break ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const br = document.createElement('br');
    statsTab.appendChild(br);

     // Steam created ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     try {
        if (playerInfo.steamData.response.players[0].timecreated) {
            const steamCreatedLabel = document.createElement('dt');
            const steamCreatedResult = document.createElement('dd');
            steamCreatedLabel.innerHTML = "Steam Created:";
            var Difference_In_Time = (playerInfo.steamData.response.players[0].timecreated * 1000) - Date.now();
            var Difference_In_Days = Math.abs((Difference_In_Time / (1000 * 3600 * 24)).toFixed(0));
            steamCreatedResult.innerHTML = "<b>" + new Date(playerInfo.steamData.response.players[0].timecreated * 1000).toLocaleString(getLocale()).replace(",", "") + "</b> (" + formatNumber(Difference_In_Days) + " days ago)";
            statsTab.appendChild(steamCreatedLabel);
            statsTab.appendChild(steamCreatedResult);
        }
    } catch {}

    // BM Created ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const createdLabel = document.createElement('dt');
    const createdResult = document.createElement('dd');
    createdLabel.innerHTML = "BM Created:";
    var Difference_In_Time = Date.parse(created) - Date.now();
    var Difference_In_Days = Math.abs((Difference_In_Time / (1000 * 3600 * 24)).toFixed(0));
    createdResult.innerHTML = "<b>" + new Date(created).toLocaleString(getLocale()).replace(",", "") + "</b> (" + formatNumber(Difference_In_Days) + " days ago)";
    statsTab.appendChild(createdLabel);
    statsTab.appendChild(createdResult);

    // Real Steam name ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    try {
        if (playerInfo.steamData.response.players[0].realname) {
            const nameLabel = document.createElement('dt');
            const nameResult = document.createElement('dd');
            nameLabel.innerHTML = "Real Name:";
            nameResult.innerHTML = playerInfo.steamData.response.players[0].realname;
            statsTab.appendChild(nameLabel);
            statsTab.appendChild(nameResult);
        }
    } catch {}

    // Steam Profile Visibility ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    try {
        const privateLabel = document.createElement('dt');
        const privateResult = document.createElement('dd');
        privateLabel.innerHTML = "Private Steam Profile:";

        if (playerInfo.steamData.response.players[0].communityvisibilitystate <= 2) {
            privateResult.innerHTML = "Private / Hidden";
            privateResult.style.color = "#ff5c5c";
        } else {
            privateResult.innerHTML = playerInfo.steamData.response.players[0].communityvisibilitystate;
            privateResult.innerHTML = "Public";
            privateResult.style.color = "#26ff26";
        }
        statsTab.appendChild(privateLabel);
        statsTab.appendChild(privateResult);
    } catch {}

    // EAC Ban ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const eacLabel = document.createElement('dt');
    const eacResult = document.createElement('dd');
    eacLabel.innerHTML = "Rust EAC Ban:";
    eacResult.innerHTML = "Checking...";
    eacResult.id = "eac-ban";
    statsTab.appendChild(eacLabel);
    statsTab.appendChild(eacResult);

    // EAC Reports ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const reportLabel = document.createElement('dt');
    const reportResult = document.createElement('dd');
    reportLabel.innerHTML = "F7 Reports:";
    reportResult.innerHTML = "Checking...";
    reportResult.id = "eac-reports";
    statsTab.appendChild(reportLabel);
    statsTab.appendChild(reportResult);

    // Linked Accounts ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const linkedLabel = document.createElement('dt');
    const linkedResult = document.createElement('dd');
    linkedLabel.innerHTML = "Linked Accounts:";
    linkedResult.innerHTML = "0";
    linkedResult.id = "linked";
    statsTab.appendChild(linkedLabel);
    statsTab.appendChild(linkedResult);

    // Break ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const br3 = document.createElement('br');
    statsTab.appendChild(br3);

    // Overall Killfeed ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const kfLabel = document.createElement('dt');
    const kfResult = document.createElement('dd');
    kfLabel.innerHTML = "Kill Feed:";
    kfResult.innerHTML = "Checking...";
    kfResult.id = "overall-kf";
    statsTab.appendChild(kfLabel);
    statsTab.appendChild(kfResult);

    // 24 Hour Killfeed ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const shortKfLabel = document.createElement('dt');
    const shortKfResult = document.createElement('dd');
    shortKfLabel.innerHTML = "Kill Feed (Today):";
    shortKfResult.innerHTML = "Checking...";
    shortKfResult.id = "short-kf";
    statsTab.appendChild(shortKfLabel);
    statsTab.appendChild(shortKfResult);

    // Break ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const br6 = document.createElement('br');
    statsTab.appendChild(br6);

    // Steam Hours ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const steamHoursLabel = document.createElement('dt');
    const steamHoursResult = document.createElement('dd');
    steamHoursLabel.innerHTML = "Steam Rust Hours:";
    steamHoursResult.innerHTML = "Checking...";
    steamHoursResult.id = "total-hours-steam";
    statsTab.appendChild(steamHoursLabel);
    statsTab.appendChild(steamHoursResult);

    // Total Hours ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const hoursLabel = document.createElement('dt');
    const hoursResult = document.createElement('dd');
    hoursLabel.innerHTML = "BM Rust Hours:";
    hoursResult.innerHTML = "Checking...";
    hoursResult.id = "total-hours";
    statsTab.appendChild(hoursLabel);
    statsTab.appendChild(hoursResult);

    // Aim Train Hours ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const atLabel = document.createElement('dt');
    const atResult = document.createElement('dd');
    atLabel.innerHTML = "Aimtrain Hours:";
    atResult.innerHTML = "Checking...";
    atResult.id = "at-hours";
    statsTab.appendChild(atLabel);
    statsTab.appendChild(atResult);

    // Rustoria Hours ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const orgLabel = document.createElement('dt');
    const orgResult = document.createElement('dd');
    orgLabel.innerHTML = "Rustoria Hours:";
    orgResult.innerHTML = "Checking...";
    orgResult.id = "org-hours";
    statsTab.appendChild(orgLabel);
    statsTab.appendChild(orgResult);

    // Total Rust Servers ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const serverCountLabel = document.createElement('dt');
    const serverCountResult = document.createElement('dd');
    serverCountLabel.innerHTML = "Rust Servers Played:";
    serverCountResult.innerHTML = "Checking...";
    serverCountResult.id = "server-count";

    const topServersButton = document.createElement('i');
    topServersButton.id = "top-servers";
    topServersButton.classList.add("fas", "fa-star");

    statsTab.appendChild(serverCountLabel);
    statsTab.appendChild(serverCountResult);
    serverCountResult.appendChild(topServersButton);
}

function drawCharts() {
    // Chart Div ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const chartDiv = document.createElement('div');
    chartDiv.id = "chart-div";
    document.getElementsByClassName("css-1ft0qe7")[0].parentElement.parentElement.appendChild(chartDiv);

    // Chart Select Div ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const chartSelectDiv = document.createElement('div');
    chartSelectDiv.id = "chart-select-div";
    chartDiv.appendChild(chartSelectDiv);

    const chartSelect = document.createElement('select');
    chartSelect.id = "chart-select";
    chartSelect.onchange = function() {
        changeChart();
    };
    chartSelectDiv.appendChild(chartSelect);

    // Chart Select Options ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var charts = [
        "K/D Ratio",
        "Kills",
        "Deaths",
        "Public Profile (Overall)",
        "Public Profile (Rustoria)",
        "Sessions (Overall)",
        "Sessions (Rustoria)", 
        "RTG Accuracy"
    ];
    for (var i = 0; i < charts.length; i++) {
        var opt = document.createElement('option');
        opt.innerHTML = charts[i];
        opt.value = charts[i];
        chartSelect.appendChild(opt);
    }

    // Loading Label ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const chartLoading = document.createElement('span');
    chartLoading.id = "chart-loading-label";
    chartLoading.innerHTML = "  Loading...";
    chartSelectDiv.appendChild(chartLoading);

    setKD(1);
}

function drawNotes() {
    $("#note").on("input", function() {
        userInputedNotes = true;
    })

    // Template Toggle Box ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var templateToggleBox = document.createElement("input");
    templateToggleBox.type = "checkbox";
    templateToggleBox.id = "template-toggle-box";
    templateToggleBox.onchange = function() {
        setCookie("note-template", templateToggleBox.checked, 365)
        toggleNoteTempalte();
    }
    templateToggleBox.onmouseenter = function() {
        tooltip.show("<b>Toggle the note template form</b></br>This will overwrite the current note field!");
    }
    templateToggleBox.onmouseleave = function() {
        tooltip.hide();
    }

    // Template Toggle Label~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var templateToggleLabel = document.createElement('label')
    templateToggleLabel.id = "template-toggle-label";
    templateToggleLabel.htmlFor = 'template-toggle-box';
    templateToggleLabel.innerHTML = "Use Note Template";

    document.getElementsByTagName("h3")[0].before(templateToggleBox);
    templateToggleBox.after(templateToggleLabel);

    const noteDiv = document.createElement("div");
    noteDiv.id = "note-div";
    document.getElementsByTagName("h3")[0].after(noteDiv);

    // Populate Dropdowns ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    createNoteField("Reported For", "reported-for-note",
        [
            'Cheating',
            'ESP',
            'Aimbot',
            'Scripting',
            'Ragehacking',
            'Teaming',
            'Not specified'
        ]
    );

    createNoteField("Steam Profile", "steam-profile-note",
        [
            'Suspicious',
            'Somewhat suspicious',
            'Not suspicious',
            'Private / Hidden',
            'New account'
        ]
    );

    createNoteField("Public Profile", "public-profile-note",
        [
            'Normal',
            'Suspicious',
            'Somewhat suspicious',
            'Not suspicious',
            'Plays consistently',
            'Some gaps',
            'Large gaps'
        ]
    );

    createNoteField("Kill Feed", "killfeed-note",
        [
            'Below average',
            'Normal',
            'Above average',
            'High',
            'Very high'
        ]
    );

    createNoteField("Spectated", "spectated-note",
        [
            'Spectated: Nothing suspicious',
            'Spectated: Did not see any PVP',
            'Spectated: AFK',
            'Spectated: Logged out in the middle',
            'Offline: Not spectated'
        ]
    );

    // Additional Notes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var additionalLabel = document.createElement('span');
    additionalLabel.id = "additional-notes-label";
    additionalLabel.innerHTML = "Additional Notes";

    var additionalNoteField = document.createElement('textarea');
    additionalNoteField.classList.add("noteInput");
    additionalNoteField.id = "additional-notes";
    additionalNoteField.rows = "3";
    additionalNoteField.oninput = function() {
        updateNotes();
    }

    document.getElementById("note-div").appendChild(additionalLabel);
    document.getElementById("note-div").appendChild(additionalNoteField);

    // EAC Reported Box ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var toggleBox = document.createElement("input");
    toggleBox.type = "checkbox";
    toggleBox.id = "eac-toggle-box";
    toggleBox.onchange = function() {
        updateNotes()
    }

    var toggleLabel = document.createElement('label');
    toggleLabel.id="eac-toggle-label";
    toggleLabel.htmlFor = 'eac-toggle-box';
    toggleLabel.innerHTML = "F7 Reported";
    toggleLabel.style.position = "absolute";
    toggleLabel.style.marginTop = "0.5px";
    toggleLabel.style.marginLeft = "7px";
    toggleLabel.style.fontSize = "14px";

    document.getElementById("note-div").appendChild(toggleBox);
    toggleBox.after(toggleLabel);

    // File Input Field ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const uploadLabel = document.createElement("span");
    uploadLabel.innerHTML = "Upload Files (8 GB Limit)";
    uploadLabel.id = "upload-label";
    document.getElementById("note-div").appendChild(uploadLabel);

    const inputField = document.createElement("input");
    inputField.type = "file";
    inputField.id = "upload-field";
    inputField.setAttribute("multiple", "");
    inputField.onchange = function() {
        if (inputField.files.length > 0) {
            document.getElementById("upload-button").style.display = "block";
        } else {
            document.getElementById("upload-button").style.display = "none";
        }
    }
    document.getElementById("note-div").appendChild(inputField);

    // Upload Button ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const uploadButtonLabel = document.createElement("span");
    uploadButtonLabel.id = "upload-button-label";
    uploadButtonLabel.innerHTML = "Upload";

    const uploadButton = document.createElement("div");
    uploadButton.id = "upload-button";
    uploadButton.onclick = function() {
        upload(inputField.files);
    }

    document.getElementById("note-div").appendChild(uploadButton);
    uploadButton.appendChild(uploadButtonLabel);

    // Progress Bar ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const progressDiv = document.createElement("div");
    progressDiv.style.paddingBottom = "10px";
    progressDiv.id = "progress-div";

    document.getElementById("note-div").appendChild(progressDiv);

    if (!getCookie("note-template")) {
        setCookie("note-template", "true", 365);
    }

    if (getCookie("note-template") == "true") {
        document.getElementById("template-toggle-box").checked = true;
    } else {
        document.getElementById("template-toggle-box").checked = false;
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
bmKey = atob("ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjBiMnRsYmlJNklqRTVaRFZrWVRSa1lqRTJPV0l6WlRVaUxDSnBZWFFpT2pFMk16QXdNVGMwTURBc0ltNWlaaUk2TVRZek1EQXhOelF3TUN3aWFYTnpJam9pYUhSMGNITTZMeTkzZDNjdVltRjBkR3hsYldWMGNtbGpjeTVqYjIwaUxDSnpkV0lpT2lKMWNtNDZkWE5sY2pvME1qZzRORGtpZlEuX2pfT0hmWXZ3V0dnaG9odm5FcVd0Vk9pUHFiR1VjVjdqbnY3QURiSXdGbw==");
steamKey = atob("RjQ3QzY1Qzg4RDA5OTdGODA1QjEyQzNEOUYxNURDNTA=");
orgKey = atob("ZDZjZWE2YTctYjQxYy00YmRjLTljZTAtMTc2NmM2ZjlkZjU5");

// Ping server, if successful, either verify tocken or prompt for password. If server unavailable, start
if (currentPage != "Steam" && source == 1) {
    if (getCookie("_jsrp")) {
        $.ajax({
            type: "POST",
            async: true,
            url: "https://rustoria.digi-safe.co/scripts/verify.php",
            data: { token : getCookie("_jsrp") },
            success: function (msg) { 
                if (msg == "approved") {
                    init();
                } else {
                    promptUser();
                }
            },
            error: function (msg) {
                init();
            }
        })
    } else {
        promptUser();
    }
} else {
    init();
}

// Prompt for password. If successful, start
function promptUser() {
    Swal.fire({
        title: "Enter Rustoria+ Password",
        icon: 'question',
        input: 'password',
        confirmButtonText: 'Verify',
        showCancelButton: true
    }).then((result) => {
        if (result.isConfirmed == true) {
            if (result.value == null || result.value == "") {
                promptUser();
            } else {
                $.ajax({
                    type: "POST",
                    async: true,
                    url: "https://rustoria.digi-safe.co/scripts/verify.php",
                    data: { pw : result.value },
                    success: function (msg) { 
                        if (msg == "incorrect") {
                            promptUser();
                        } else {
                            setCookie("_jsrp", msg, 365);
                            Swal.fire({
                                icon: 'success',
                                text: 'Verified!',
                                toast: true,
                                position: 'bottom-end',
                                timer: 2500,
                                showConfirmButton: false
                            })
                            init();
                        }
                    }
                })
            }
        }
    });
}

async function init() {
    if (currentPage == "Steam") {
        elementReady('.profile_content').then(() => {
            setBanStatus();
            setBmLink();
        })
    } else {
        setFont();
    
        // Start server alias loop
        elementReady('.server-link').then(() => {
            setInterval(function() { setAlias(); }, 3000);
        });
        refreshPage();
        // On page mutation
        var bodyList = document.querySelector("body"),
            observer = new MutationObserver(function(mutations) {
                mutations.forEach(function() {
                    // On URL Change
                    if (currentHref != window.location.href) {
                        refreshPage();
                    }
    
                    if (currentPage == "Overview" || currentPage == "Activity") {
                        colorizeActivity();
                    } else if (currentPage == "Global Activity") {
                        colorizeGlobal();
                    }
                    colorizeSteamId();
                    fixHref();
                });
            });
    
        var config = {
            childList: true,
            subtree: true
        };
        observer.observe(bodyList, config);
    }
}

function refreshPage() {
    currentHref = window.location.href;
    updatePage();

    // Wait for a critical element to exist before trying to inject our own scripts
    if (currentPage == "Overview") {
        elementReady('#note').then(() => {
            setTimeout(() => {
                handlePage();
            }, 100);
        })
    } else if (currentPage == "Ban" || currentPage == "Edit Ban" || currentPage == "Activity") {
        elementReady('select').then(() => {
            setTimeout(() => {
                handlePage();
            }, 500);
        })
    } else if (currentPage == "Global Activity") {
        elementReady('.css-11j1tsg').then(() => {
            handlePage();
        })
    } else if (currentPage == "Public Profile") {
        elementReady('.css-5ens21').then(() => {
            setTimeout(() => {
                handlePage();
            }, 500);
        })
    } else if (currentPage == "Identifiers") {
        elementReady('.css-1paipyv').then(() => {
            setTimeout(() => {
                handlePage();
            }, 500);
        })
    }
}

function handlePage() {
    if (currentPage == "Overview") {
        updateProfile();
        drawOverview();
    } else if (currentPage == "Activity") {
        updateProfile();
        createScrollToBottom();
    } else if (currentPage == "Global Activity") {
        createScrollToBottom();
    } else if (currentPage == "Public Profile") {
        CreateRustOnlyButton();
    } else if (currentPage == "Ban" || currentPage == "Edit Ban") {
        createBanButtons();
        setBanAlias();
    } else if (currentPage == "Identifiers") {
        createVpnButton();
    }
}

// Reassigns href of <a> tag elements to ensure full reload occurs when being redirected to the same URL
async function fixHref() {
    if (currentPage == "Overview" && playerInfo.playerIds !== undefined) {
        var links = document.getElementsByTagName("a");
        for (var i = 0, len = links.length; i < len; i++) {
            if (links[i].classList.contains("css-zwebxb")) {
                if (playerInfo.playerIds.includes(links[i].innerHTML) || playerInfo.playerIds.includes(links[i].innerHTML.split("] ")[1])) {
                    links[i].onclick = function() {
                        window.location = "#";
                    };
                }
            }
        }
    }
}

async function setFont() {
    WebFont.load({
        google: {
            families: ['Open Sans']
        },
        active: function() { 
            document.getElementById("root").style.fontFamily = 'Open Sans'; 
            document.getElementById("root").style.fontSize = '.95em'; 
        }
    });
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
