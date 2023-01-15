
import sendData from "../sendData";

export default async function searchUser(user) {
    const response = await sendData('/searchuser', {id: user});
    if (response.status !== 'success') return alert('Error searching user');
    return response.user;
}