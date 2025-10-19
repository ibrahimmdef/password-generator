function updateLength(slider) {
  const output = document.getElementById("lengthOutput");
  output.value = slider.value;

  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const value = parseFloat(slider.value);
  const percent = ((value - min) / (max - min)) * 100;

  slider.style.background = `linear-gradient(to right, #b794f6 ${percent}%, #3a3a3a ${percent}%)`;
}

function copyPassword() {
  const copyText = document.querySelector("#passwordText");

  const password = copyText.textContent;

  navigator.clipboard.writeText(password);
}

function generatePassword() {
  const length = document.querySelector("#length").value;
  const useUpper = document.querySelector("#upperCase").checked;
  const useLower = document.querySelector("#lowerCase").checked;
  const useNumbers = document.querySelector("#numbers").checked;
  const useSymbols = document.querySelector("#symbols").checked;

  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const lowerCase = "abcdefghijklmnopqrstuvwxyz".split("");
  const numbers = "0123456789".split("");
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?/".split("");

  let chars = [];

  if (useUpper) chars = chars.concat(upperCase);
  if (useLower) chars = chars.concat(lowerCase);
  if (useNumbers) chars = chars.concat(numbers);
  if (useSymbols) chars = chars.concat(symbols);

  if (chars.length === 0) {
    alert("Please select at least one option!");
    return;
  }

  let passwordArray = [];

  for (let i = 0; i < length; i++) {
    seed = Math.floor(Math.random() * chars.length);
    passwordArray.push(chars[seed]);
  }

  const passwordstring = passwordArray.join("");

  document.querySelector("#passwordText").textContent = passwordstring;
}
