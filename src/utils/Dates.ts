import { round } from '@/utils/Numbers';

const Milliseconds = 1;
const Seconds = 1000 * Milliseconds;
const Minutes = 60 * Seconds;
const Hours = 60 * Minutes;
const Days = 24 * Hours;
const Weeks = 7 * Days;
const Years = 52 * Weeks;


export const TimeInMillis = {
    Milliseconds,
    Seconds,
    Minutes,
    Hours,
    Days,
    Weeks,
    Years,
};


export type DayMonthFormatOptionTypes = NonNullable<Intl.DateTimeFormatOptions['weekday']>;

export interface DayMonthFormatOptionsEntry {
    /**
     * Month name for the given month index [0-11].
     *
     * e.g. 0 = January | Jan | J
     */
    months: string[];
    /**
     * Weekday name for the given day index [0-6].
     *
     * What day starts the week (Sunday vs Monday vs other) depends on the user's locale.
     *
     * e.g. 0 = Monday | Mon | M
     */
    days: string[];
}

export type DayMonthFormatsType = {
    [K in DayMonthFormatOptionTypes as string]: DayMonthFormatOptionsEntry;
}

export const DayMonthFormatOptions: Record<Uppercase<DayMonthFormatOptionTypes>, DayMonthFormatOptionTypes> = {
    NARROW: 'narrow',
    SHORT: 'short',
    LONG: 'long',
};

/**
 * Day and month names in `long`, `short`, and `narrow` formats according to the user's language/locale setting.
 *
 * @see [`new Intl.DateTimeFormat()` MDN docs]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat}
 * @see [Related StackOverflow post]{@link }https://stackoverflow.com/questions/24998624/day-name-from-date-in-js}
 */
export const DayMonthFormats: DayMonthFormatsType = ([ 'long', 'short', 'narrow' ] as DayMonthFormatOptionTypes[])
    .reduce((names, nameType) => {
        const monthFormatter = new Intl.DateTimeFormat(undefined, {
            month: nameType,
        });
        const dayFormatter = new Intl.DateTimeFormat(undefined, {
            weekday: nameType,
        });

        const monthNames = Array.from({ length: 12 })
            .map((nul, monthIndex) => monthFormatter.format(new Date(2000, monthIndex)));
        const dayNames = Array.from({ length: 7 })
            .map((nul, dayIndex) => dayFormatter.format(new Date(2000, 1, dayIndex)));

        names[nameType] = {
            months: monthNames,
            days: dayNames,
        };

        return names;
    }, {} as DayMonthFormatsType);



export function getNumDaysBetween(earlierDateStr: string | number | Date, laterDateStr: string | number | Date, asDate = true) {
    const earlierDate = new Date(earlierDateStr);
    const laterDate = new Date(laterDateStr);

    return (laterDate.valueOf() - earlierDate.valueOf()) / TimeInMillis.Days;
}



export interface DateToStringOptions {
    /**
     * If UTC date/time should be used instead of local date/time.
     */
    utc?: boolean;
    /**
     * Display length to use for month-name strings.
     *
     * Alternatively, use `b` or `B` between 1-3 times to set narrow/short/long display names.
     */
    monthDisplay?: string;
    /**
     * Display length to use for day-name strings.
     *
     * Alternatively, use `D` between 1-3 times to set narrow/short/long display names.
     */
    dayDisplay?: string;
}

/**
 * Formats a date in the desired string format.
 *
 * @param date - Date to format.
 * @param format - The desired format for the date.
 * @param options - Options for formatting.
 *
 * @see [SO question 1]{@link https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd}
 * @see [SO question 2]{@link https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date}
 * @see [Example solution from `formateDate.js`]{@link https://github.com/mikebaldry/formatDate-js/blob/master/formatDate.js}
 * @see [Related `formatToParts()` function]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts}
 */
export function dateToString(date: Date = new Date(), format?: string, {
    utc = false,
    monthDisplay,
    dayDisplay,
}: DateToStringOptions = {}) {
    if (!format) {
        return date.toString();
    }

    const yearNumber = date[`get${utc ? 'UTC' : ''}FullYear`]();
    const monthNumber = date[`get${utc ? 'UTC' : ''}Month`]();
    const dateNumber = date[`get${utc ? 'UTC' : ''}Date`]();
    const dayOfWeekNumber = date[`get${utc ? 'UTC' : ''}Day`]();
    const hourNumber = date[`get${utc ? 'UTC' : ''}Hours`](); // 24-hour clock
    const minuteNumber = date[`get${utc ? 'UTC' : ''}Minutes`]();
    const secondNumber = date[`get${utc ? 'UTC' : ''}Seconds`]();
    const millisecondNumber = date[`get${utc ? 'UTC' : ''}Milliseconds`]();
    const timezoneOffsetHours = date.getTimezoneOffset() / 60; // Offset is in minutes - Positive is behind (later than) UTC; Negative is ahead of (earlier than) UTC

    let useAmPm = false;

    // It's easier to use a match group to get the exact length of the requested date-time formatter substring
    // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_a_parameter
    let dateTimeStringFormatted = format
        .replace(/(y+)/ig, (fullRegexStrMatch, matchGroup) => {
            // return `${yearNumber}`.substr(-1 * `${yearNumber}`.length, matchGroup.length);
            return `${yearNumber}`.substr(-1 * matchGroup.length, `${yearNumber}`.length);
        })
        .replace(/(M+)/g, (fullRegexStrMatch, matchGroup) => {
            // Months start at 0 so add 1 to make it a readable month, i.e. January === 0
            return `${monthNumber + 1}`.padStart(matchGroup.length, '0');
        })
        .replace(/(d+)/g, (fullRegexStrMatch, matchGroup) => {
            return `${dateNumber}`.padStart(matchGroup.length, '0');
        })
        .replace(/(h+)/ig, (fullRegexStrMatch, matchGroup) => {
            useAmPm = !!matchGroup.match(/H/);

            const hourNumberToUse = (useAmPm && hourNumber > 12)
                ? hourNumber - 12
                : hourNumber;

            return `${hourNumberToUse}`.padStart(matchGroup.length, '0');
        })
        .replace(/(m+)/g, (fullRegexStrMatch, matchGroup) => {
            return `${minuteNumber}`.padStart(matchGroup.length, '0');
        })
        .replace(/(s+)/g, (fullRegexStrMatch, matchGroup) => {
            return `${secondNumber}`.padStart(matchGroup.length, '0');
        })
        .replace(/(l+)/g, (fullRegexStrMatch, matchGroup) => {
            // Milliseconds are always <= 3 digits, so pad the beginning with zeros to make it a proper decimal number
            // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMilliseconds
            const millisecondsTo3SignificantFigures = `${millisecondNumber}`.padStart(3, '0');
            // Convert integer to decimal place
            const millisecondsDecimal = `0.${millisecondsTo3SignificantFigures}`;
            // Round the milliseconds to the desired length
            const millisecondsDecimalRounded = round(millisecondsDecimal, matchGroup.length);
            // Remove leading `0.` from `0.xxx` number
            const millisecondNumberRounded = `${millisecondsDecimalRounded}`.replace(/^0\./, '');

            return `${millisecondNumberRounded}`.padStart(matchGroup.length, '0');
        })
        // String replacements must go after number replacements and after string replacements using
        // the same letters to avoid conflicts
        .replace(/(D+)/g, (fullRegexStrMatch, matchGroup) => {
            if (dayDisplay) {
                return DayMonthFormats[dayDisplay].days[dayOfWeekNumber];
            }

            switch (matchGroup.length) {
                case 1:
                    return DayMonthFormats[DayMonthFormatOptions.NARROW].days[dayOfWeekNumber];
                case 2:
                    return DayMonthFormats[DayMonthFormatOptions.SHORT].days[dayOfWeekNumber];
                case 3:
                    return DayMonthFormats[DayMonthFormatOptions.LONG].days[dayOfWeekNumber];
                default:
                    return '';
            }
        })
        .replace(/(b+)/ig, (fullRegexStrMatch, matchGroup) => {
            if (monthDisplay) {
                return DayMonthFormats[monthDisplay].months[monthNumber];
            }

            switch (matchGroup.length) {
                case 1:
                    return DayMonthFormats[DayMonthFormatOptions.NARROW].months[monthNumber];
                case 2:
                    return DayMonthFormats[DayMonthFormatOptions.SHORT].months[monthNumber];
                case 3:
                    return DayMonthFormats[DayMonthFormatOptions.LONG].months[monthNumber];
                default:
                    return '';
            }
        })
        .replace(/(z+)/ig, (fullRegexStrMatch, matchGroup) => {
            // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
            const timezoneOffsetHoursPositiveNegativeString = (timezoneOffsetHours < 1)
                ? '+'
                : (timezoneOffsetHours > 1)
                    ? '-'
                    : '';

            if (!timezoneOffsetHoursPositiveNegativeString) {
                return 'UTC';
            }

            const useFullTimezoneOffsetString = !!matchGroup.match(/Z/);
            const fullTimezoneOffsetString = `${`${timezoneOffsetHours}`.padStart(2, '0')}00`;

            if (useFullTimezoneOffsetString) {
                return 'GMT' + timezoneOffsetHoursPositiveNegativeString + fullTimezoneOffsetString;
            }

            return matchGroup.length === 1
                ? `${timezoneOffsetHours}`
                : fullTimezoneOffsetString.substr(0, matchGroup.length);
        });

    if (useAmPm) {
        dateTimeStringFormatted += ` ${hourNumber > 12 ? 'PM' : 'AM'}`;
    }

    return dateTimeStringFormatted;
}
