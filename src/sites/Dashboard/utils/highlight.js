export function highlight(text, term = '') {
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return text;
    return (
        <>
            {text.slice(0, index)}
            <mark>{text.slice(index, index + term.length)}</mark>
            {text.slice(index + term.length)}
        </>
    );
}
