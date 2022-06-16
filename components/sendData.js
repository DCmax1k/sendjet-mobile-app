export default async function sendData(route, data) {
    try {
        const response = await fetch(route, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)

        });
        if (response.status !== 200) return { status: 'error', message: 'Error sending data' };
        const json = await response.json();
        return json;
    } catch(err) {
        console.error(err);
    }
}