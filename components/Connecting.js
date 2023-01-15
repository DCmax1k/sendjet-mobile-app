import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, View, ImageBackground, Animated  } from 'react-native';

import fadeIn from './animations/fadeIn';
import sendData from './sendData';

export default function Connecting(props) {
    const initanimation = new fadeIn(1000);
    const [animation, setAnimation] = useState(initanimation);
    animation.start();

    useEffect(() => {
        checkLogin();
    });

    async function checkLogin() {
        const response = await sendData('/dashboard', {});
        animation.continue = false;
        animation.finish();
        setTimeout(() => {
            if (response.status === 'success') {
                props.setUser(response.user);
                let conversations = response.conversations;
                if (!conversations) conversations = [];
                props.setConversations(conversations);

                props.setPage('dashboard');
            } else {
                props.setPage('login');
            }
        }, 1000)
    }

    return (
        <View>
            <Animated.Text style={[styles.text, { opacity: animation.value }]}>
                Connecting...
            </Animated.Text>
        </View>
    )
}

const styles = StyleSheet.create({
    text: {
        fontSize: 20,
        color: 'white',
        textAlign: 'center',
    }
});
