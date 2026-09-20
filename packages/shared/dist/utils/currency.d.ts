/**
 * Indian Numbering System Currency & Words Utilities
 * Supports lakhs and crores representation (e.g., ₹1,00,000 / "One Lakh Rupees Only")
 */
/**
 * Converts a positive number into Indian words following lakhs and crores format.
 * Example: 100000 -> "One Lakh Rupees Only"
 * Example: 125000 -> "One Lakh Twenty Five Thousand Rupees Only"
 * Example: 2500000 -> "Twenty Five Lakh Rupees Only"
 */
export declare function numberToIndianWords(num: number): string;
/**
 * Formats a number with Indian rupee comma grouping.
 * Example: 100000 -> "₹1,00,000"
 */
export declare function formatIndianCurrency(amount: number, includeSymbol?: boolean): string;
//# sourceMappingURL=currency.d.ts.map