import { faGem, faJetFighter, faJetFighterUp, faRocket, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Image, Animated, Pressable, SafeAreaView } from 'react-native';

import sendData from './sendData';

const positionFromBottom = -(Dimensions.get('window').height/3);
const negHeight = -(Dimensions.get('window').height);

class PopupProfile extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            user: props.user,
            profile: null,
            //profile: props.user, // TESTING
            touch: new Animated.Value(negHeight),
            //touch: new Animated.Value(positionFromBottom), // TESTING


        };

        this.popupProfile = this.popupProfile.bind(this);
        this.checkIfFriends = this.checkIfFriends.bind(this);
        this.addFriend = this.addFriend.bind(this);
        this.unaddFriend = this.unaddFriend.bind(this);
        this.acceptFriend = this.acceptFriend.bind(this);
    }
    setUser(user) {
        this.setState({ user: user });
    }

    popupProfile(profile) {
        this.setState({ profile: profile });
        Animated.spring(this.state.touch, {
            toValue: positionFromBottom,
            useNativeDriver: false,
        }).start();
    }

    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    checkIfFriends() {
        return this.state.user.friends.map(fri => fri._id).includes(this.state.profile._id)?1:0;
    }

    async addFriend(user) {
        this.setState({
            user: {
                ...this.state.user,
                addRequests: [...this.state.user.addRequests, user]
            }
        });
        const response = await sendData('https://sendjet-app.herokuapp.com/search/adduser', { id: user._id });
        if (response.status !== 'success') return alert('Error adding user');
        this.props.updateUser({...this.state.user, addRequests: this.state.user.addRequests});
    }
    async unaddFriend(user) {
        this.setState({
            user: {
                ...this.state.user,
                addRequests: this.state.user.addRequests.filter(u => u._id !== user._id),
                friends: this.state.user.friends.filter(u => u._id !== user._id),
            },
        });
        const response = await sendData('https://sendjet-app.herokuapp.com/search/unadduser', { id: user._id });
        if (response.status !== 'success') return alert('Error removing user');
        this.props.updateUser({
            ...this.state.user,
            addRequests: this.state.user.addRequests,
            friends: this.state.user.friends,
        });
    }
    async acceptFriend(friend) {
        this.setState({
            user: {
                ...this.state.user,
                friendRequests: this.state.user.friendRequests.filter(f => f._id !== friend._id),
                friends: [...this.state.user.friends, friend],
            }
        });
        const response = await sendData('https://sendjet-app.herokuapp.com/search/acceptfriendrequest', {id: friend._id});
        if (response.status !== 'success') return alert('Error accepting friend request');
        this.props.updateUser({
            ...this.state.user,
            friendRequests: this.state.user.friendRequests,
            friends: [...this.state.user.friends],
        })
    }

    render() {
        if (!this.state.profile) {
            return (
                <View></View>
            )
        } else {
        return (
            <Animated.View style={[styles.pop, {bottom: this.state.touch}]}>

                <View style={styles.gestureCont}
                onStartShouldSetResponder={() => true}
                onResponderMove={(e) => {
                    this.state.touch.setValue(-e.nativeEvent.pageY);
                }}
                onResponderRelease={(e) => {
                    if (e.nativeEvent.pageY > Dimensions.get('window').height*0.5) {
                        Animated.spring(this.state.touch, {
                            toValue: negHeight,
                            useNativeDriver: false,
                        }).start();
                    }else {
                        Animated.spring(this.state.touch, {
                            toValue: positionFromBottom,
                            useNativeDriver: false,
                        }).start();
                    }
                }}
                ><View style={styles.gestureBar}></View>
                </View>

                <View style={{marginBottom: 20, opacity: this.checkIfFriends()?1:0}}>
                    <View style={{height: 15, width: 15, backgroundColor: '#00ce52', borderRadius: 10}}></View>
                </View>
                <View style={{height: 100, width: 100, marginBottom: 20}}>
                    <Image style={{width: '100%', height: '100%', borderRadius: 50}} source={{uri: this.state.profile.profilePicture}} />
                </View>

                <View style={{marginBottom: 2,}}>
                    <Text style={{fontSize: 27, color: 'white', letterSpacing: 3}}>{this.state.profile.firstName} {this.state.profile.lastName}</Text>
                </View>
                <View style={{marginBottom: 10,}}>
                    <Text style={{fontSize: 18, fontWeight: 'bold', color: '#a4a4a4'}}>@{this.state.profile.username}</Text>
                </View>
                <View style={{flexDirection: 'row', opacity: this.checkIfFriends()?1:0}}>
                    <FontAwesomeIcon icon={faJetFighterUp} size={16} color="white" style={{marginRight: 5}} />
                    <Text style={{fontSize: 15, color: 'white'}}>{this.numberWithCommas(this.state.profile.score)}</Text>
                </View>
                { this.state.user.friendRequests.map(guy => guy._id).includes(this.state.profile._id) ? (
                    <Pressable onPress={() => {this.acceptFriend(this.state.profile)}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                        <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Accept</Text>
                    </Pressable>
                ): this.state.user.friends.map(guy => guy._id).includes(this.state.profile._id) ? (
                    <Pressable onPress={() => {this.unaddFriend(this.state.profile)}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                        <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Friends</Text>
                    </Pressable>
                ): this.state.user.addRequests.map(guy => guy._id).includes(this.state.profile._id) ?  (
                    <Pressable onPress={() => {this.unaddFriend(this.state.profile)}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                        <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Added</Text>
                    </Pressable>
                ): (
                    <Pressable style={styles.addBtn} onPress={() => this.addFriend(this.state.profile)}>
                        <FontAwesomeIcon icon={faPlus} size={16} color="#a4a4a4" />
                        <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Add</Text>
                    </Pressable>
                )}
                <View style={{marginTop: 100, opacity: this.checkIfFriends()?1:0}}>
                    <Text style={{fontSize: 15, color: '#a4a4a4', marginBottom: 10}}>{this.state.profile.firstName} joined Sendjet on {new Date(this.state.profile.dateJoined).toDateString()}</Text>
                </View>

                

            </Animated.View>
        );
                }
    }
}

const styles = StyleSheet.create({
    pop: {
        position: 'absolute',
        left: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: '#832434',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        shadowColor: 'black',
        shadowOffset: {width: 0, height: -5},
        shadowRadius: 50,
        shadowOpacity: 1,
        padding: 20,
        paddingTop: 70,
    },
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
});

export default PopupProfile;