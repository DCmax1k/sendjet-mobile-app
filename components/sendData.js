 const DOMAIN = 'https://sendjet-server.glitch.me';
//const DOMAIN = 'http://192.168.40.179:3001';

export default async function sendData(route, data) {
    try {
        const response = await fetch(DOMAIN + route, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)

        });
        if (response.status !== 200) return { status: response.status || 'error', message: response.message || 'Error sending/receiving data' };
        const json = await response.json();
        return json;
    } catch(err) {
        console.error(err);
    }
}