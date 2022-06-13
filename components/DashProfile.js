import React, { Component } from 'react';
import { View, Text, Pressable } from 'react-native';

import fadeOut from './animations/fadeOut';
import sendData from './sendData';

class DashProfile extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            user: props.user,
         };

         this.logOut = this.logOut.bind(this);
    }

    async logOut() {
        const response = await sendData('https://sendjet-app.herokuapp.com/login/logout', {});
        if (response.status !== 'success') return alert('Error logging out');
        this.props.setPage('connecting');
    }

    render() {
        return (
            <View>
                <Text>Dash profile - Signed in as {this.state.user.username}</Text>
                <Pressable onPress={this.logOut}>
                    <Text>Log out</Text>
                </Pressable>
            </View>
        );
    }
}

export default DashProfile;