import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component } from 'react';
import { View, Text, Animated, StyleSheet, TextInput, Pressable, Image, ScrollView } from 'react-native';

import sendData from './sendData';

class DashSearch extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            user: props.user,
            searchResults: [],
         };

        this.addFriend = this.addFriend.bind(this);
        this.searchUser = this.searchUser.bind(this);
        this.unaddFriend = this.unaddFriend.bind(this);
        this.acceptFriend = this.acceptFriend.bind(this);
    }

    async addFriend(user) {
        const response = await sendData('https://sendjet-app.herokuapp.com/search/adduser', { id: user._id });
        if (response.status !== 'success') return alert('Error adding user');
        this.props.updateUser({...this.state.user, addRequests: [...this.state.user.addRequests, user]});
        this.setState({
            user: {
                ...this.state.user,
                addRequests: [...this.state.user.addRequests, user]
            }
        });
    }
    async unaddFriend(user) {
        const response = await sendData('https://sendjet-app.herokuapp.com/search/unadduser', { id: user._id });
        if (response.status !== 'success') return alert('Error removing user');
        this.props.updateUser({
            ...this.state.user,
            addRequests: this.state.user.addRequests.filter(u => u._id !== user._id),
            friends: this.state.user.friends.filter(u => u._id !== user._id),
        });
        this.setState({
            user: {
                ...this.state.user,
                addRequests: this.state.user.addRequests.filter(u => u._id !== user._id),
                friends: this.state.user.friends.filter(u => u._id !== user._id),
            },
        });
    }
    async searchUser(query) {
        if (query.length === 0) return this.setState({ searchResults: [] });
        const response = await sendData('https://sendjet-app.herokuapp.com/search', { query });
        if (response.status !== 'success') return alert('Error searching user');
        this.setState({ searchResults: response.users });
    }
    async acceptFriend(friendID) {
        const response = await sendData('https://sendjet-app.herokuapp.com/search/acceptfriendrequest', {id: friendID});
        if (response.status !== 'success') return alert('Error accepting friend request');
        this.props.updateUser({
            ...this.state.user,
            friendRequests: this.state.user.friendRequests.filter(f => f._id !== friendID),
            friends: [...this.state.user.friends, response.friend],
        })
        this.setState({
        user: {
            ...this.state.user,
            friendRequests: this.state.user.friendRequests.filter(f => f._id !== friendID),
            friends: [...this.state.user.friends, response.friend],
        }
        });
    }

    render() {
        return (
            <Animated.View style={{flexDirection: 'column', alignItems: 'center', height: '100%'}}>
                <View style={styles.searchCont}>
                    <View style={styles.searchInputCont}>
                        <TextInput style={styles.searchInput} placeholder="Search profiles" placeholderTextColor='#a4a4a4' onChange={(e) => this.searchUser(e.nativeEvent.text)} />
                        <Pressable style={styles.searchBtn}>
                            <FontAwesomeIcon icon={faSearch} size={20} color="#a4a4a4" />
                        </Pressable>
                    </View>
                    {this.state.searchResults.length > 0 && (
                        <ScrollView>
                           {this.state.searchResults.map((user, i) => (
                                <SearchedUser key={i} user={this.state.user} friend={user} acceptFriend={this.acceptFriend} addFriend={this.addFriend} unaddFriend={this.unaddFriend} friends={this.state.user.friends} />
                            ))} 
                        </ScrollView>
                    )}
                    
                    {this.state.searchResults.length === 0 && (
                        <View style={styles.noResults}>
                            <Image source={require('../assets/emptySearchImg.png')} style={styles.noResultsImg} />
                        </View>
                    )}

                </View>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    searchCont: {
        width: '93%',
        height: '69%',
        backgroundColor: 'rgba(0, 0, 0, 0.22)',
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 30,
        overflow: 'hidden',
        marginBottom: 10,
        paddingTop: 10,
    },
    searchInputCont: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 45,
        backgroundColor: 'rgba(134,134,134,0.22)',
        borderRadius: 9999,
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        borderRadius: 25,
        paddingLeft: 10,
        paddingRight: 10,
        fontSize: 16,
        color: '#a4a4a4',
    },
    searchBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.22)',
        marginRight: 5,
    },
    messageCont: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 100,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.22)',
        borderRadius: 25,
        marginBottom: 10,
    },
    messageCont1: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '20%',
    },
    messageCont2: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        height: '100%',
        width: '50%',
    },
    messageCont3: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '30%',
    },
    addBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: 'center',
        height: 40,
        width: 80,
        borderRadius: 25,
        backgroundColor: 'rgba(164, 164, 164, 0.22)',
    },
    noResults: {
        width: '100%', 
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',

    },
    noResultsImg: {
        width: '80%',
        height: '100%',
        resizeMode: 'contain',
    }
});

function SearchedUser({user, friend, addFriend, unaddFriend, friends, acceptFriend}) {

    let alreadyAdded = false;
    if (user.friendRequests.map(guy => guy._id).includes(friend._id)) alreadyAdded = true;
    const isFriend = friends.find(guy => guy._id === friend._id);
    let added = false;
    if (!isFriend) {
        if (user.addRequests.map(guy => guy._id).includes(friend._id)) added = true;
    }

    return (
        <View style={styles.messageCont}>
            <View style={styles.messageCont1}>
                <Image source={{ uri: friend.profilePicture }} style={{height: 40, width: 40, resizeMode: 'contain', borderRadius: 20}} />
            </View>
            <View style={styles.messageCont2}>
                <View style={styles.conversationTitle}>
                <FormatUsername user={friend} />
                </View>
                <Text style={{color: '#838383'}}>{friend.firstName + ' ' + friend.lastName}</Text>
            </View>
            <View style={styles.messageCont3}>
                {alreadyAdded? (
                    <Pressable onPress={() => {acceptFriend(friend._id)}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                        <Text style={{color: '#a4a4a4', fontSize: 13}}>Accept</Text>
                    </Pressable>
                ): isFriend? (
                    <Pressable onPress={() => {unaddFriend(friend)}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                        <Text style={{color: '#a4a4a4', fontSize: 13}}>Friends</Text>
                    </Pressable>
                ): added?  (
                    <Pressable onPress={() => {unaddFriend(friend)}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                        <Text style={{color: '#a4a4a4', fontSize: 13}}>Added</Text>
                    </Pressable>
                ): (
                    <Pressable style={styles.addBtn} onPress={() => addFriend(friend)}>
                        <FontAwesomeIcon icon={faPlus} size={16} color="#a4a4a4" />
                        <Text style={{color: '#a4a4a4', fontSize: 13}}>Add</Text>
                    </Pressable>
                )}

            </View>
        </View>
    );
}

function FormatUsername({user}) {
    return (
        <View style={{flexDirection: 'row'}}>
            { user.prefix.title? (<Text style={{fontSize: 20, color: user.prefix.color, fontWeight: 'bold', marginRight: 5,}}>{user.prefix.title}</Text>):null}
            <Text style={{fontSize: 20, color: '#aaaaaa'}}>{user.username}</Text>
        </View>
    )
}

export default DashSearch;