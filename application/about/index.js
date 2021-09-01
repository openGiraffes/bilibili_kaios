$(function () {
  document.activeElement.addEventListener("keydown", handleKeydown);
});

function handleKeydown(e) {
  $.clearEvent(e);
  switch (e.key) {
    case "Enter":
    case "Backspace":
      window.location.href = "../index.html";
      break;
  }
}