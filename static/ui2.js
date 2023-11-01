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

function findAssignment(id, t) {
  t = t || assignments;
  for (let i=0; i<t.length; i++) {
    if (t[i].id == id) {
      return (t[i]);
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
    practiced = JSON.parse(resp);
    rebuildPracticedList();
  });
}

// ui stuff
// main page
const searchbar = document.getElementById("searchfield");
const listselector = document.getElementById("set");
const listbody = document.getElementById("listbody");
const practicedList = document.getElementById("practiced");

function formatTime(timer) {
  hours = parseInt(timer / 3600, 10);
  minutes = parseInt((timer / 60) % 60, 10);
  seconds = parseInt(timer % 60, 10);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}

function buildAssignmentButton(assignment, time) {
  let button = "".concat(
    "<td colspan=\"2\"><button class=\"practice\" onclick=\"practice(", assignment.id,
    ");\">", assignment.name, "</button></td>");
  if (!time) {
    button = button.concat(
      "<td><button class=\"edit\" onclick=\"editAssignment(", assignment.id,
      ");\">Edit</button></td>");
  } else {
    button = button.concat("<td class=\"notbutton\">",formatTime(time),"</td>")
  };
  return button;
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
    if (assignments[i].name.toLowerCase().match(filter.toLowerCase()) != null &&
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

function rebuildPracticedList() {
  let html = "";
  let processed = 0;

  for (let i = 0; i < practiced.length; i++) {
    let assignment = findAssignment(practiced[i].id);
    if (!assignment) {
      assignment = {
        name: "Removed: " + practiced[i].id,
        id: practiced[i].id
      }
    }
    html = html.concat("<tr>",
      buildAssignmentButton(assignment, practiced[i].time), "</tr>");
    processed++;
  }

  if (processed == 0) {
    html = "<tr><td>Nothing practiced yet</td></tr>";
  }

  replaceHTML(practicedList, "practiced", html);
}

function rebuildListSelector(e, c) {
  let html = "<option value=\"all\">All Assignments</option>";
  for (name in lists) {
    html = html.concat("<option>", name, "</option>");
  }
  
  replaceHTML(listselector, "set", html);
}

listselector.onchange = (e) => {
  currentList=e.target.value;
  rebuildAssignmentList();
};

searchbar.oninput = () => {
  rebuildAssignmentList();
};

// assignment edit dialog
const editAssignmentDialog = document.getElementById("assignmentEditDialog");
const editAssignmentCancel = document.getElementById("assignmentEditCancel");
const editAssignmentConfirm = document.getElementById("assignmentEditConfirm");
const editAssignmentRemove = document.getElementById("assignmentEditRemove");
const editAssignmentName = document.getElementById("assignmentEditName");

function editAssignment(id) {
  // another terrible misuse of an HTML feature
  editAssignmentDialog.firstChild.id = id;
  editAssignmentDialog.firstChild
      .firstChild.textContent = "Edit Assignment " + id;
  editAssignmentName.value = findAssignment(id).name;
  editAssignmentDialog.showModal();
}

editAssignmentCancel.onclick = () => {
  editAssignmentDialog.close();
}

editAssignmentRemove.onclick = () => {
  confirmRemoval(parseInt(editAssignmentDialog.firstChild.id));
  editAssignmentDialog.close();
}

editAssignmentConfirm.onclick = () => {
  post(
    "/api/create", "assignmentName=".concat(
      encodeURI(editAssignmentName.value),
      "&id=", editAssignmentDialog.firstChild.id),
    (text) => { updateAssignments(); })
  assignmentName.value = "";
  editAssignmentDialog.close();
}

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
  assignmentName.value = "";
};

createAssignmentForm.onsubmit = (e) => {
  e.preventDefault();
  createAssignmentDialog.close();
  post(
    "/api/create", "assignmentName=".concat(encodeURI(assignmentName.value)),
    (text) => { updateAssignments(); })
  assignmentName.value = "";
};

// list creation dialog
const createList = document.getElementById("showCreateList");
const createListButton = document.getElementById("addList");
const removeListButton = document.getElementById("removeList");
const createListDialog = document.getElementById("listCreationDialog");
const createListForm = document.getElementById("listCreationForm");
const cancelCreateList = document.getElementById("closeCreateList");
const listOptions = document.getElementById("listName");
const listMembers = document.getElementById("listMembers");

const addListDialog = document.getElementById("addListDialog");
const finishAddList = document.getElementById("finishAddList");
const closeAddList = document.getElementById("closeAddList");
const addListName = document.getElementById("addListName");
const addListForm = document.getElementById("addListForm");

const removeListDialog = document.getElementById("confirmListRemovalDialog");
const yesRemoveList = document.getElementById("yesRemoveList");
const noRemoveList = document.getElementById("noRemoveList");

let editingList;

function rebuildListOptions(add) {
  let html = "";

  if (add) {
    html = html.concat("<option selected>", add, "</option>");
  }
  for (name in lists) {
    html = html.concat("<option>", name, "</option>");
  }

  replaceHTML(listOptions, "listName", html);
}

listOptions.onchange = (e) => {
  editingList=e.target.value;
  rebuildListMemberOptions();
};

function rebuildListMemberOptions(list) {
  list = editingList || "";
  let html = "";
  for (let i = 0; i < assignments.length; i++) {
    let assignment = assignments[i];
    let member = lists[list] && lists[list].indexOf(assignments[i].id) != -1
    member = member || false;
    html = html.concat("<button class=\"multiselect\" type=\"button\" value=",assignment.id," onclick=\"toggleButton(this);\"; name=\"", member.toString(), "\">", assignment.name, "</button><br>");
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

let getFirstListValue = () => {
  if (listOptions.firstChild) {
    return listOptions.firstChild.value;
  }
};

createList.onclick = () => {
  rebuildListOptions();
  editingList = currentList != "all" && currentList ||
    getFirstListValue() || "";
  rebuildListMemberOptions();
  createListDialog.showModal();
};

createListButton.onclick = () => {
  addListDialog.showModal();
};

removeListButton.onclick = () => {
  removeListDialog.showModal();
};

noRemoveList.onclick = () => {
  removeListDialog.close();
};

yesRemoveList.onclick = () => {
  removeListDialog.close();
  delete lists[editingList];
  post(
    "/api/updatelist", "listName=".concat(editingList,
      "&listMembers="),
    (r) => { updateLists(); updateAssignments(); }
  );
  editingList = currentList != "all" && currentList || 
    getFirstListValue() || "";
  rebuildListOptions();
  rebuildListMemberOptions();
};

closeAddList.onclick = () => {
  addListDialog.close();
  addListName.value = "";
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
    "/api/updatelist", "listName=".concat(encodeURI(editingList),
      "&listMembers=", encodeURI(members)),
    (r) => { updateLists(); updateAssignments(); }
  );
}

addListForm.onsubmit = (e) => {
  e.preventDefault();
  addListDialog.close();
  editingList = addListName.value;
  rebuildListOptions(editingList);
  rebuildListMemberOptions();
  addListName.value = "";
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
  let practiceEntry = findAssignment(id, practiced) || {time:0};
  practiceDialog.showModal();
  practiceText.firstChild.textContent = "Practicing " + assignment.name + " ";
  practiceTimer.textContent = "--:--:--";

  let timer = practiceEntry.time, hours, minutes, seconds;
  let timerID = setInterval(function() {
    timer++;
    practiceTimer.textContent = formatTime(timer);
  }, 1000)

  practiceCancel.onclick = () => {
    practiceDialog.close();
    clearInterval(timerID);
  };

  practiceDone.onclick = () => {
    practiceDialog.close();
    clearInterval(timerID);

    post("/api/practice", "id=" + assignment.id + "&time=" + timer,
      (r) => { updatePracticed(); });
  };
}

// initialization
updateLists();
updateAssignments();
updatePracticed();
