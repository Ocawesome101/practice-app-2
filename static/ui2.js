// This feels much cleaner than the first time around

// api calls
function request(method, url, params, handler) {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      if (xhr.status == 200) {
        handler(xhr.responseText);
      } else {
        alert("Request failed.");
      }
    }
  };
  xhr.open(method, url);
  if (method == "POST") {
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(params);
  } else {
    xhr.send();
  }
}

function get(url, handler) {
  request("GET", url, "", handler);
}

function post(url, params, handler) {
  request("POST", url, params, handler);
}

// state
let assignments = [];
let lists = [];
let currentList = "all";

function findAssignment(id) {
  for (let i=0; i<assignments.length; i++) {
    if (assignments[i].id == id) {
      return (assignments[i])
    }
  }
}

// update things
function updateAssignments() {
  get("/api/assignments", (resp) => {
    assignments = JSON.parse(resp);
    rebuildAssignmentList();
  });
}

function updateLists() {
  get("/api/lists", (resp) => {
    lists = JSON.parse(resp);
    rebuildListSelector();
  });
}

function updatePracticed() {
  get("/api/practiced", (resp) => {
  });
}

// ui stuff
// main page
const searchbar = document.getElementById("searchfield");
const listselector = document.getElementById("set");
const listbody = document.getElementById("listbody");

function buildAssignmentButton(assignment) {
  return "".concat(
    "<td colspan=\"2\"><button class=\"practice\" onclick=\"practice(", assignment.id,
    ");\">", assignment.name, "</button>",
    "<td><button class=\"remove\" onclick=\"confirmRemoval(", assignment.id,
    ");\">Remove</button></td>");
}

//https://stackoverflow.com/questions/814564/inserting-html-elements-with-javascript

function replaceHTML(element, id, html) {
  let frag = document.createDocumentFragment(),
      temp = document.createElement("tbody");

  temp.id = id;
  temp.innerHTML = html;

  while (temp.firstChild) {
    frag.appendChild(temp.firstChild);
  }

  element.replaceChildren(frag);
}

function rebuildAssignmentList(filter) {
  filter = filter || searchbar.value || "";

  let html = "";
  let processed = 0;

  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i].name.match(filter) != null &&
        (currentList == "all" || lists[currentList].indexOf(assignments[i].id) != -1)) {
      html = html.concat(
        "<tr>", buildAssignmentButton(assignments[i]), "</tr>");
      processed++;
    }
  }

  if (processed == 0) {
    html = "<tr><td>No assignments</td></tr>";
  }

  replaceHTML(listbody, "listbody", html);
}

function rebuildListSelector() {
  let html = "<option onclick=\"currentList='all';rebuildAssignmentList();\">All Assignments</option>";
  for (name in lists) {
    html = html.concat("<option onclick=\"currentList='", name,
      "';rebuildAssignmentList();\">", name, "</option>");
  }
  
  replaceHTML(listselector, "set", html);
}

searchbar.oninput = () => {
  rebuildAssignmentList();
};

// assignment creation dialog
const createAssignment = document.getElementById("showCreate");
const createAssignmentDialog = document.getElementById("creationDialog");
const createAssignmentForm = document.getElementById("creationForm");
const cancelCreateAssignment = document.getElementById("closeCreate");
const assignmentName = document.getElementById("assignmentName");

createAssignment.onclick = () => {
  createAssignmentDialog.showModal();
};

cancelCreateAssignment.onclick = () => {
  createAssignmentDialog.close();
};

createAssignmentForm.onsubmit = (e) => {
  e.preventDefault();
  createAssignmentDialog.close();
  post(
    "/api/create", "assignmentName=".concat(encodeURI(assignmentName.value)),
    (text) => { updateAssignments(); })
};

// list creation dialog
const createList = document.getElementById("showCreateList");
const createListDialog = document.getElementById("listCreationDialog");
const createListForm = document.getElementById("listCreationForm");
const cancelCreateList = document.getElementById("closeCreateList");
const listMembers = document.getElementById("listMembers");
const listName = document.getElementById("listName");

function rebuildListMemberOptions() {
  let html = "";
  for (let i = 0; i < assignments.length; i++) {
    let assignment = assignments[i];
    html = html.concat("<button class=\"multiselect\" type=\"button\" value=",assignment.id," onclick=\"toggleButton(this);\">", assignment.name, "</button><br>");
  }
  replaceHTML(listMembers, "listMembers", html);
}

// this is a HORRIBLE misuse of this attribute.  TODO: kill it with fire.
function toggleButton(thing) {
  if (!thing.name || thing.name == "false") {
    thing.name = "true"
  } else {
    thing.name = "false"
  }
}

createList.onclick = () => {
  createListDialog.showModal();
  rebuildListMemberOptions();
};

cancelCreateList.onclick = () => {
  createListDialog.close();
};

createListForm.onsubmit = (e) => {
  e.preventDefault();
  createListDialog.close();
  let members = [];
  for (let i = 0; i < listMembers.children.length; i += 2) {
    let btn = listMembers.children[i];
    if (btn.name == "true") {
      members.push(btn.value);
    }
  }

  post(
    "/api/updatelist", "listName=".concat(listName.value,
      "&listMembers=", encodeURI(members)),
    (r) => { updateLists(); updateAssignments(); }
  );
}

const removalDialog = document.getElementById("confirmRemovalDialog");
const yesRemoveButton = document.getElementById("yesRemove");
const noRemoveButton = document.getElementById("noRemove");

noRemoveButton.onclick = () => {
  removalDialog.close();
};

// called by 'remove' and 'practice' buttons
function confirmRemoval(id) {
  removalDialog.showModal();
  yesRemoveButton.onclick = () => {
    removalDialog.close();
    post("/api/remove", "id=".concat(id), (r) => {
      updateLists(); updateAssignments();
    });
  };
}


// practice dialog
const practiceDialog = document.getElementById("practiceDialog");
const practiceDone = document.getElementById("donePractice");
const practiceCancel = document.getElementById("cancelPractice");
const practiceText = document.getElementById("practiceText");
const practiceTimer = document.getElementById("practiceTimer");

function practice(id) {
  let assignment = findAssignment(id);
  practiceDialog.showModal();
  practiceText.firstChild.textContent = "Practicing " + assignment.name + " ";
  practiceTimer.textContent = "00:00:00";

  let timer = 0, hours, minutes, seconds;
  let timerID = setInterval(function() {
    timer++;

    hours = parseInt(timer / 3600, 10);
    minutes = parseInt((timer / 60) % 60, 10);
    seconds = parseInt(timer % 60, 10);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    practiceTimer.textContent = hours + ":" + minutes + ":" + seconds;
  }, 1000)

  practiceCancel.onclick = () => {
    practiceDialog.close();
    clearInterval(timerID);
  };

  practiceDone.onclick = () => {
    practiceDialog.close();

    post("/api/practice", "id=" + assignment.id + "&time=" + timer,
      (r) => { updatePracticed(); });
  };
}

// initialization
updateLists();
updateAssignments();
updatePracticed();
