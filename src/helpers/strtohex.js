function stringToHex(str) {
  let hexString = '';
  for (let i = 0; i < str.length; i++) {
    // Get the Unicode code point of the character
    const charCode = str.charCodeAt(i);
    // Convert the code point to a hexadecimal string
    let hexChar = charCode.toString(16);

    // Pad with a leading zero if the hex representation is a single digit
    if (hexChar.length < 2) {
      hexChar = '0' + hexChar;
    }
    hexString += hexChar;
  }
  return hexString;
}

module.exports = stringToHex