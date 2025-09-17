/**
 * Returns a random item from the given array.
 * Optionally removes the selected item from the array.
 * @param {Array} arr - The array to select from.
 * @param {boolean} [remove=false] - If true, removes the selected item from the array.
 * @returns {*} A random item from the array, or undefined if the array is empty.
 */
function randomItem(arr, remove = false) {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    const idx = Math.floor(Math.random() * arr.length);
    const item = arr[idx];
    if (remove) arr.splice(idx, 1);
    return item;
}

module.exports = randomItem;