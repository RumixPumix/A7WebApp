export default async function generateToken() {
    const randomHex = (length) => {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    };

    const token = `${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}`;

    // Optionally, you can append the userId to make the token unique per user
    return `${token}`;
}
