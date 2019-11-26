/* Global variables */
var comicId = 0; // ID of current comic
var latest = 0; // ID of latest comic
let controllerDiv = document.getElementById('controller'); // Controller div

/* Initializing function */
function init(currentId, latestId) {
    comicId = parseInt(currentId);
    latest = parseInt(latestId);
    createBtnFirst();
    createBtnPrev();
    createBtnRand();
    createBtnNext();
    createBtnLast();
}

/* Generating buttons */
// Create a button object with specified parameters and return it
function createBtn(value, func, id) {
    var btn = document.createElement('input');
    btn.setAttribute('type', 'button');
    btn.setAttribute('value', value);
    btn.setAttribute('onclick', func);
    btn.setAttribute('id', id);

    return btn;
}

// Switching page
function pageSwitch(mode) {
    var param = '';
    switch (mode) {
        case 'next':
            param = (comicId + 1).toString();
            break;
        case 'prev':
            param = (comicId - 1).toString();
            break;
        case 'rand':
            param = 'random';
            break;
        case 'last':
            param = latest.toString();
            break;
        case 'first':
            param = '1';
            break;
        default:
            return false;
    }

    window.location.href = '/' + param;
}

// Previous comic button
function createBtnPrev() {
    const id = 'prev';
    var btn;
    if (comicId - 1 > 0)
        btn = createBtn('<< Prev', `pageSwitch('${id}')`, id);
    else
        btn = createBtn('<< Prev', `pageSwitch('')`, id);
    controllerDiv.appendChild(btn);
}
// Next comic button
function createBtnNext() {
    const id = 'next';
    var btn;
    if (comicId + 1 > latest)
        btn = createBtn('Next >>', `pageSwitch('')`, id);
    else 
        btn = createBtn('Next >>', `pageSwitch('${id}')`, id);

    controllerDiv.appendChild(btn);
}
// Random comic button
function createBtnRand() {
    const id = 'rand';
    var btn = createBtn('Random', `pageSwitch('${id}')`, id);
    controllerDiv.appendChild(btn);
}
// Last comic button
function createBtnLast() {
    const id = 'last';
    var btn = createBtn('>|', `pageSwitch('${id}')`, id);
    controllerDiv.appendChild(btn);
}
// First comic button
function createBtnFirst() {
    const id = 'first';
    var btn = createBtn('|<', `pageSwitch('${id}')`, id);
    controllerDiv.appendChild(btn);
}