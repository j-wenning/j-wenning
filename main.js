const form = document.querySelector("#mailForm");
const antiScrape = ["2.", "1wenning", "5gmail", "7com", "3justin", "6.", "4@"]
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(item => item.substr(1))
                      .join('');
form.setAttribute("action", form.getAttribute("action") + antiScrape);
