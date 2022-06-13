import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';

import Connecting from './Connecting';
import Login from './Login';
import Dashboard from './Dashboard';

class Organize extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 'connecting',
            connected: false,
            user: {},
            conversations: [],
        };

        this.setPage = this.setPage.bind(this);
        this.setUser = this.setUser.bind(this);
        this.setConversations = this.setConversations.bind(this);
    }

    setPage(page) {
        this.setState({ page });
    }
    setUser(user) {
        this.setState({ user });
    }
    setConversations(conversations) {
        this.setState({ conversations });
    }

  render() {
    return (
        <ImageBackground source={require('../assets/background.png')} style={styles.background}>
            {this.state.page === 'connecting' &&
            <Connecting
            setPage={this.setPage} setUser={this.setUser}
            setConversations={this.setConversations}
            />}

            {this.state.page === 'login' &&
            <Login
            setPage={this.setPage} />}

            {this.state.page === 'dashboard' &&
            <Dashboard
            setPage={this.setPage}
            user={this.state.user}
            setUser={this.setUser}
            conversations={this.state.conversations}
            setConversations={this.setConversations}
            
            />}

        </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',

    }
});


export default Organize;