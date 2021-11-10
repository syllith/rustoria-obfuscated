// Private variables
var bmKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6IjE5ZDVkYTRkYjE2OWIzZTUiLCJpYXQiOjE2MzAwMTc0MDAsIm5iZiI6MTYzMDAxNzQwMCwiaXNzIjoiaHR0cHM6Ly93d3cuYmF0dGxlbWV0cmljcy5jb20iLCJzdWIiOiJ1cm46dXNlcjo0Mjg4NDkifQ._j_OHfYvwWGghohvnEqWtVOiPqbGUcV7jnv7ADbIwFo";
var steamKey = "F47C65C88D0997F805B12C3D9F15DC50";
var orgKey = "d6cea6a7-b41c-4bdc-9ce0-1766c6f9df59";

// User authentication
var verified = false;
var pinged = false;

// Prompt or verify user based on existence of _jsrp cookie
var http = new XMLHttpRequest();
http.open("GET", "https://rustoria.digi-safe.co/scripts/verify.php", true);
http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
        pinged = true;
        if (!window.location.href.includes("steamcommunity.com")) {
            if (getCookie("_jsrp")) {
                verifyToken();
            } else {
                promptUser();
            }
        }
    }
};
http.send();

console.log("MARKER")

// Verify existing token is valid
function verifyToken() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "https://rustoria.digi-safe.co/scripts/verify.php", false);
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            if (xmlHttp.responseText == "approved" && parseInt(getCookie("_jsrp")) % 7 === 0) {
                verified = true;
                start();
            } else {
                promptUser();
            }
        }
    }
    xmlHttp.send('token=' + getCookie("_jsrp"));
}

// Prompt for password. If successful, start
function promptUser() {
    Swal.fire({
        title: "Enter Rustoria+ Password",
        icon: 'question',
        input: 'text',
        confirmButtonText: 'Verify',
        showCancelButton: true
    }).then((result) => {
        if (result.isConfirmed == true) {
            if (result.value == null || result.value == "") {
                promptUser();
                return;
            } else {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open("POST", "https://rustoria.digi-safe.co/scripts/verify.php", false);
                xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xmlHttp.onreadystatechange = function() {
                    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                        if (xmlHttp.responseText == "incorrect") {
                            promptUser();
                            return;
                        } else {
                            verified = true;
                            setCookie("_jsrp", xmlHttp.responseText, 365);
                            Swal.fire({
                                icon: 'success',
                                text: 'Verified!',
                                toast: true,
                                position: 'bottom-end',
                                timer: 2300,
                                showConfirmButton: false
                            })
                            start();
                        }
                    }
                }
                xmlHttp.send('pw=' + result.value);
            }
        }
    });
}



// Server is online, but failed verification
if (verified == false && pinged == true) {
    Swal.fire({
        icon: 'error',
        text: 'Failed Verification!',
        toast: true,
        position: 'bottom-end',
        timer: 2300,
        showConfirmButton: false
    })
}

// Start Rustoria+
var currentHref, currentPage, bmIdentifier, steamId, identifiers, steamJson;
var noteAccounts, noteTotalHours, noteAtHours, noteOrgHours, noteReports, noteReportsToday, noteKills, noteDeaths, notekd = 0;
var noteFiles = [];

updatePage();

function start() {
    elementReady('.server-link').then(() => {
        setTimeout(function() {
            setAlias();
        }, 1000);
        setInterval(function() {
            setAlias();
        }, 10000);
    });

    // On page mutation
    var bodyList = document.querySelector("body"),
        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function() {
                // On URL Change
                if (currentHref != window.location.href) {
                    currentHref = window.location.href;
                    updatePage();

                    // Wait for a critical element to exist before trying to inject our own scripts
                    if (currentPage == "Overview") {
                        elementReady('.dl-horizontal').then(() => {
                            handlePage();
                        })
                    } else if (currentPage == "Ban" || currentPage == "Edit Ban" || currentPage == "Activity") {
                        elementReady('#RCONContainer').then(() => {
                            handlePage();
                        })
                    } else if (currentPage == "Global Activity") {
                        elementReady('.css-11j1tsg').then(() => {
                            handlePage();
                        })
                    } else if (currentPage == "Public Profile") {
                        elementReady('.css-5ens21').then(() => {
                            handlePage();
                        })
                    } else if (currentPage == "Identifiers") {
                        elementReady('.css-1paipyv').then(() => {
                            handlePage();
                        })
                    }
                }

                // Reassigns href of <a> tag elements to ensure full reload occurs when being redirected to the same URL
                if (currentPage == "Overview" && identifiers !== undefined) {
                    var links = document.getElementsByTagName("a");
                    for (var i = 0, len = links.length; i < len; i++) {
                        if (links[i].classList.contains("css-zwebxb")) {
                            if (identifiers.includes(links[i].innerHTML) || identifiers.includes(links[i].innerHTML.split("] ")[1])) {
                                links[i].onclick = function() {
                                    window.location = "#";
                                };
                            }
                        }
                    }
                }

                colorizeActivity();
                colorizeGlobal();
                colorizeSteamId();
            });
        });

    var config = {
        childList: true,
        subtree: true
    };
    observer.observe(bodyList, config);
}

function handlePage() {
    if (currentPage == "Overview") {
        updateProfile();
        elementReady('.dl-horizontal').then(() => {
            setTimeout(function() {
                drawOverview();
            }, 500);
        });
        elementReady('#note').then(() => {
            document.getElementById("note").rows = "13";
        });
    } else if (currentPage == "Activity") {
        updateProfile();
        createScrollToBottom();
    } else if (currentPage == "Global Activity") {
        createScrollToBottom();
    } else if (currentPage == "Public Profile") {
        CreateRustOnlyButton();
    } else if (currentPage == "Ban" || currentPage == "Edit Ban") {
        setTimeout(function() {
            createBanButtons();
        }, 500);
        setTimeout(function() {
            setBanAlias();
        }, 100);
    } else if (currentPage == "Identifiers") {
        setTimeout(function() {
            createVpnButton();
        }, 500);
    }
}
