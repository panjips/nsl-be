export function getFormattedStartTime() {
    const now = new Date();

    const pad = (num: number) => String(num).padStart(2, "0");

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes <= 0 ? "+" : "-";
    const timezone = `${sign}${pad(offsetHours)}${pad(offsetMins)}`;

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezone}`;
}
