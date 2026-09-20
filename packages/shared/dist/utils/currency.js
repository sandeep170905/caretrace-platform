"use strict";
/**
 * Indian Numbering System Currency & Words Utilities
 * Supports lakhs and crores representation (e.g., ₹1,00,000 / "One Lakh Rupees Only")
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToIndianWords = numberToIndianWords;
exports.formatIndianCurrency = formatIndianCurrency;
const ONES = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
];
const TENS = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];
function convertTwoDigits(n) {
    if (n < 20)
        return ONES[n];
    const unit = n % 10;
    return TENS[Math.floor(n / 10)] + (unit ? ' ' + ONES[unit] : '');
}
function convertThreeDigits(n) {
    let str = '';
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    if (hundred) {
        str += ONES[hundred] + ' Hundred';
        if (rem)
            str += ' and ';
    }
    if (rem) {
        str += convertTwoDigits(rem);
    }
    return str.trim();
}
/**
 * Converts a positive number into Indian words following lakhs and crores format.
 * Example: 100000 -> "One Lakh Rupees Only"
 * Example: 125000 -> "One Lakh Twenty Five Thousand Rupees Only"
 * Example: 2500000 -> "Twenty Five Lakh Rupees Only"
 */
function numberToIndianWords(num) {
    const rounded = Math.floor(Math.abs(num));
    if (rounded === 0)
        return 'Zero Rupees Only';
    const crore = Math.floor(rounded / 10000000);
    let remainder = rounded % 10000000;
    const lakh = Math.floor(remainder / 100000);
    remainder = remainder % 100000;
    const thousand = Math.floor(remainder / 1000);
    remainder = remainder % 1000;
    const parts = [];
    if (crore) {
        const croreText = crore >= 100 ? convertThreeDigits(crore) : convertTwoDigits(crore);
        parts.push(croreText + ' Crore');
    }
    if (lakh) {
        parts.push(convertTwoDigits(lakh) + ' Lakh');
    }
    if (thousand) {
        parts.push(convertTwoDigits(thousand) + ' Thousand');
    }
    if (remainder) {
        parts.push(convertThreeDigits(remainder));
    }
    return parts.join(' ') + ' Rupees Only';
}
/**
 * Formats a number with Indian rupee comma grouping.
 * Example: 100000 -> "₹1,00,000"
 */
function formatIndianCurrency(amount, includeSymbol = true) {
    const formatted = Math.floor(amount).toLocaleString('en-IN');
    return includeSymbol ? `₹${formatted}` : formatted;
}
//# sourceMappingURL=currency.js.map