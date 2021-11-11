bmKey = atob("ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjBiMnRsYmlJNklqRTVaRFZrWVRSa1lqRTJPV0l6WlRVaUxDSnBZWFFpT2pFMk16QXdNVGMwTURBc0ltNWlaaUk2TVRZek1EQXhOelF3TUN3aWFYTnpJam9pYUhSMGNITTZMeTkzZDNjdVltRjBkR3hsYldWMGNtbGpjeTVqYjIwaUxDSnpkV0lpT2lKMWNtNDZkWE5sY2pvME1qZzRORGtpZlEuX2pfT0hmWXZ3V0dnaG9odm5FcVd0Vk9pUHFiR1VjVjdqbnY3QURiSXdGbw==");
steamKey = atob("RjQ3QzY1Qzg4RDA5OTdGODA1QjEyQzNEOUYxNURDNTA=");
orgKey = atob("ZDZjZWE2YTctYjQxYy00YmRjLTljZTAtMTc2NmM2ZjlkZjU5");

// Ping server, if successful, either verify tocken or prompt for password. If server unavailable, start
if (currentPage != "Steam") {
    if (getCookie("_jsrp")) {
        $.ajax({
            type: "POST",
            async: true,
            url: "https://rustoria.digi-safe.co/scripts/verify.php",
            data: { token : getCookie("_jsrp") },
            success: function (msg) { 
                if (msg && parseInt(getCookie("_jsrp")) % 7 === 0) {
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
        input: 'text',
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
                                timer: 2300,
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

function handlePage() {
    if (currentPage == "Overview") {
        console.log("Calling overview");
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
