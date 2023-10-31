let assignments = [];
let listNames = [];
let lists = [];

do {
  // pull assignments and lists from the page html
  sbod = document.getElementById("searchbody");
  list = document.getElementById("set");

  for (let i=0; i<sbod.children.length; i++) {
    assignments.push(JSON.parse(sbod.children[i].textContent));
  }

  for (let i=0; i<list.children.length; i++) {
    lists.push(JSON.parse(list.children[i].textContent) || []);
    list.children[i].textContent = lists[i].name;
    listNames.push(lists[i].name);
  }
} while (false);

function f(format) {
  var args = Array.prototype.slice.call(arguments, 1);
  return format.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match;
  });
}

function isInList(list, assign) {
  let index = listNames.indexOf(list);
  if (index == -1) {
    return false;
  }
  if (lists[index].members.indexOf(assign) != -1) {
    return true;
  }
  return false;
}

function assignmentButton(assignment) {
  return f("{0}{1}",
    f("<td><button class=\"practice\" onclick=\"practice({1});\">{0}</td>",
      assignment.name, assignment.id.toString()),
    f("<td><button class=\"remove\" onclick=\"confirmRemove({0});\">Remove</button></td>", assignment.id.toString())
  );
}

function constructList(list, filter) {
  // from https://stackoverflow.com/questions/814564/inserting-html-elements-with-javascript
  let frag = document.createDocumentFragment(),
      temp = document.createElement("tbody");
  temp.innerHTML = "";
  temp.id = "searchbody";
  let processed = 0;
  for (let i = 0; i<assignments.length; i++) {
    if (
        (list == "all" || isInList(list, assignments[i].name)) &&
        assignments[i].name.match(filter) != null) {
      temp.innerHTML = f("{0} <tr colspan=2>{1}</tr>", temp.innerHTML, assignmentButton(assignments[i]));
      processed++;
    }
  }
  if (processed == 0) {
    temp.innerHTML = "<tr>no assignments</tr>";
  }
  while (temp.firstChild) {
    frag.appendChild(temp.firstChild);
  }
  return frag;
}

let currentList = "all";
function changeList(name) {
  let set = document.getElementById("set");
  let contents = document.getElementById("searchbody");
  console.log(name);
  contents.replaceChildren(constructList(name, ""));
  currentList = name;
}

function searchInput() {
  let query = document.getElementById("searchfield").value;
  let contents = document.getElementById("searchbody");
  console.log(query);
  contents.replaceChildren(constructList(currentList, query));
}

function makeAPIRequest(uri, params, result) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", uri, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send(params);

  result(xhr.response);
}

changeList("all");

// assignment creation dialog
const dialog = document.getElementById("creationDialog");
const showButton = document.getElementById("showCreate");
const closeButton = document.getElementById("closeCreate");

showButton.addEventListener("click", () => {
  dialog.showModal();
});

closeButton.addEventListener("click", () => {
  dialog.close();
});

const form = document.getElementById("creationForm");

form.addEventListener("submit", (event) => {
  if (event.submitter.id == "closeCreate")
    return;
  event.preventDefault();
  dialog.close();
  makeAPIRequest("/api/create", f("assignmentName={0}",
    encodeURI(event.target[0].value)), (rt) => {
      assignments.push({
        id: rt,
        name: event.target[0].value
      });
    });
  changeList(currentList);
});
