import React, { Component } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Dimensions, Alert, ScrollView, RefreshControl } from 'react-native';

import fadeOut from './animations/fadeOut';
import sendData from './sendData';
import FormatUsername from './FormatUsername';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGem, faJetFighterUp } from '@fortawesome/free-solid-svg-icons';

class DashProfile extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            user: props.user,
            refreshing: false,
         };

         this.logOut = this.logOut.bind(this);
         this.refreshApp = this.refreshApp.bind(this);
    }

    setUser(user) {
        this.setState({ user });
        // Child components set users

    }
    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    openSettings(user) {
        this.props.popupProfile(user);
    }

    async logOut() {
        const response = await sendData('https://sendjet-app.herokuapp.com/login/logout', {});
        if (response.status !== 'success') return alert('Error logging out');
        this.props.setPage('connecting');
    }

    async refreshApp() {
        this.setState({refreshing: true});
        const response = await sendData('https://sendjet-app.herokuapp.com/dashboard', {});
        if (response.status !== 'success') return alert('Error refreshing app');
        let conversations = response.conversations;
        if (!conversations) conversations = [];
    
        this.props.updateUser(response.user);
        this.props.updateConversations(conversations);
        this.setState({
          user: response.user,
          refreshing: false,
        });
      }

    confirmAlert(message, callback) {
        Alert.alert(
          'Confirm',
          message,
          [
            {text: 'Cancel', onPress: () => {}, style: 'cancel'},
            {text: 'OK', onPress: callback},
          ],
          { cancelable: false }
        );
    
    }

    render() {
        return (
            <View style={{width: '100%', height: Dimensions.get('window').height*0.7, flexDirection: 'column', alignItems: 'center'}}>
                <ScrollView refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this.refreshApp} />} style={{width: '100%'}} contentContainerStyle={{justifyContent: 'flex-start', alignItems: 'center'}}>
                <View style={{marginBottom: 20}}>
                    <View style={{height: 15, width: 15, backgroundColor: '#00ce52', borderRadius: 10}}></View>
                </View>
                <View style={{height: 100, width: 100, marginBottom: 20}}>
                    <Image style={{width: '100%', height: '100%', borderRadius: 50}} source={{uri: this.state.user.profilePicture}} />
                </View>

                <View style={{marginBottom: 2,}}>
                    <FormatUsername size={30} user={this.state.user} />
                </View>
                <View style={{marginBottom: 10,}}>
                    <Text style={{fontSize: 20, color: '#a4a4a4'}}>{this.state.user.firstName} {this.state.user.lastName}</Text>
                </View>
                <View style={{flexDirection: 'row'}}>
                    <FontAwesomeIcon icon={faJetFighterUp} size={16} color="white" style={{marginRight: 5}} />
                    <Text style={{fontSize: 15, color: 'white'}}>{this.numberWithCommas(this.state.user.score)}</Text>
                </View>

                <View style={[styles.premiumCont, {display: this.state.user.premium?'none':'flex'}]}>
                    <Pressable onPress={() => {alert('Sendjet Premium is currently private access only. If you would like to ask for access, please contact a developer by searching "DEV" on the search page.')}} style={{height: 60, width: 200, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center', padding: 5}}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 9, color: '#FFC700'}}>BETA - PRIVATE ACCESS</Text>
                        </View>
                        <View style={{flex: 2, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 20, color: '#FFC700'}}>Buy Premium</Text>
                        </View>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 11, color: '#FFC700'}}>$2.99</Text>
                        </View>
                        <View style={{height: 50, width: 50, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 30, left: 0, transform: [{translateX: -25}, {translateY: -25}]}}>
                            <FontAwesomeIcon icon={faGem} size={25} color="#FFC700" style={{}} />
                        </View>
                    </Pressable>

                    <View style={{marginTop: 5}}>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>{'\u2022'} </Text>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>Custom Prefix</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>{'\u2022'} </Text>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>Prefix color</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>{'\u2022'} </Text>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>Username color</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>{'\u2022'} </Text>
                            <Text style={{fontSize: 12, color: '#FFC700'}}>Change username</Text>
                        </View>
                        
                    </View>

                </View>

                <Pressable onPress={() => {this.openSettings(this.state.user)}} style={[styles.addBtn, {justifyContent: 'center', marginTop: 50}]}>
                    <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Settings</Text>
                </Pressable>
                <Pressable onPress={() => {this.confirmAlert('Are you sure you want to logout?', this.logOut)}} style={[styles.addBtn, {justifyContent: 'center', marginTop: 20}]}>
                    <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Logout</Text>
                </Pressable>
                <View style={{marginTop: 50, width: '100%'}}>
                    <Text style={{fontSize: 15, color: '#a4a4a4', width: '100%', textAlign: 'center'}}>Joined Sendjet on {new Date(this.state.user.dateJoined).toDateString()}</Text>
                </View>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    gestureCont: {
        position: 'absolute',
        top: 0,
        height: 100,
        paddingTop: 10,
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',

    },
    gestureBar: {
        width: 140,
        height: 5,
        backgroundColor: '#a4a4a4',
        borderRadius: 20,
        
    },
    addBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.22)',
    },
    premiumCont: {
        marginTop: 20,
        justifyContent: 'center', 
        alignItems: 'center',
    },
});

export default DashProfile;