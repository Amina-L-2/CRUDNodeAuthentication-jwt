// Validation helpers for the books and magazines routes.
// Every validator receives the object that is about to be saved and returns
// an array of error messages. An empty array means the data is valid.

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// Keeps only the fields we expect, so the client cannot send its own "id"
// (or any other field) and overwrite data in the JSON file.
export const pickFields = (source, fields) => {
    const picked = {};
    for (const field of fields) {
        if (source[field] !== undefined) picked[field] = source[field];
    }
    return picked;
};

export const validateBook = (book) => {
    const errors = [];
    const currentYear = new Date().getFullYear();

    if (!isNonEmptyString(book.name)) errors.push('name is required');
    if (!isNonEmptyString(book.author)) errors.push('author is required');

    // Forms send text, so we convert the year before checking it
    const year = Number(book.year);
    if (!Number.isInteger(year) || year < 1000 || year > currentYear + 1) {
        errors.push(`year must be a whole number between 1000 and ${currentYear + 1}`);
    }
    return errors;
};

export const validateMagazine = (magazine) => {
    const errors = [];

    if (!isNonEmptyString(magazine.name)) errors.push('name is required');

    const issue = Number(magazine.issue);
    if (!Number.isInteger(issue) || issue < 1) {
        errors.push('issue must be a whole number greater than 0');
    }

    if (!isNonEmptyString(magazine.publisher)) errors.push('publisher is required');
    if (!isNonEmptyString(magazine.category)) errors.push('category is required');

    // The date must be YYYY-MM-DD and must exist (e.g. 2024-02-30 is rejected)
    const date = magazine.publication_date;
    const parsed = typeof date === 'string' ? new Date(date) : null;
    const isRealDate = parsed !== null && !Number.isNaN(parsed.getTime())
        && parsed.toISOString().slice(0, 10) === date;
    if (!isRealDate) errors.push('publication_date must be a real date in YYYY-MM-DD format');

    return errors;
};
