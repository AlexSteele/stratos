
// num must be positive and contains no more than 8 digits.
function numDigitsIn(num) {
    const abs = Math.abs(num);
    if (abs < 10) return 1;
    if (abs < 100) return 2;
    if (abs < 1000) return 3;
    if (abs < 10000) return 4;
    if (abs < 100000) return 5;
    if (abs < 1000000) return 6;
    if (abs < 10000000) return 7;
    if (abs < 100000000) return 8;
    
    throw new Error('utils: Given num is too big: ' + num);
};

module.exports = {
    numDigitsIn
};
