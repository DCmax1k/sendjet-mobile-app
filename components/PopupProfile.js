import { faGem, faJetFighter, faJetFighterUp, faRocket, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Image, Animated, Pressable, SafeAreaView, Alert, TextInput, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


import sendData from './sendData';
import FormatUsername from './FormatUsername';
import keyboardShift from './animations/settingsKeyboardShift';
import formatLastOnline from './utils/formatLastOnline';
import APressable from './APressable';
import firebaseConfig from '../firebaseConfig.js';

import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
initializeApp(firebaseConfig);

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
            selectingColor: '', // prefix or username
            keyboardAnimation: new keyboardShift(),
            isActive: false,
            changedProfileImage: null,
        };

        this.popupProfile = this.popupProfile.bind(this);
        this.checkIfFriends = this.checkIfFriends.bind(this);
        this.addFriend = this.addFriend.bind(this);
        this.unaddFriend = this.unaddFriend.bind(this);
        this.acceptFriend = this.acceptFriend.bind(this);
        this.closePopup = this.closePopup.bind(this);
        this.changeProfileImage = this.changeProfileImage.bind(this);
    }

    setUser(user) {
        this.setState({ user: user });
    }

    popupProfile(profile) {
        this.setState({ profile: profile, isActive: true, changedProfileImage: null });
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
        this.props.socketEmit('adduser', { user: this.state.user, adding: user });
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
        this.props.socketEmit('unadduser', { user: this.state.user, unadding: user });
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
        this.props.socketEmit('acceptfriendrequest', { user: this.state.user, friend, });
        this.props.updateUser({
            ...this.state.user,
            friendRequests: this.state.user.friendRequests,
            friends: [...this.state.user.friends],
        })
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

    setFirstName(firstName) {
        this.setState({profile: {...this.state.profile, firstName, }});

    }
    setLastName(lastName) {
        this.setState({profile: {...this.state.profile, lastName, }});
        
    }
    setEmail(text) {
        this.setState({profile: {...this.state.profile, email: text, }});
        
    }
    setPrefix(text) {
        this.setState({profile: {...this.state.profile, prefix: {...this.state.profile.prefix, title: text}, }});
    }
    setUsername(text) {
        this.setState({profile: {...this.state.profile, username: text, }});
    }
    async submitFirstName(name) {
        const response = await sendData('https://sendjet-app.herokuapp.com/profile/changefirstname', {name,});
        if (response.status !== 'success') return alert('Error changing first name');
        this.props.updateUser({...this.state.user, firstName: name,});
    }
    async submitLastName(name) {
        const response = await sendData('https://sendjet-app.herokuapp.com/profile/changelastname', {name,});
        if (response.status !== 'success') return alert('Error changing last name');
        this.props.updateUser({...this.state.user, lastName: name,});
    }
    async submitEmail(email) {
        const response = await sendData('https://sendjet-app.herokuapp.com/profile/changeemail', {email,});
        if (response.status !== 'success') return alert('Error changing email');
        this.props.updateUser({...this.state.user, email,});
    }
    async submitPrefix(prefix) {
        const response = await sendData('https://sendjet-app.herokuapp.com/profile/changeprefix', {prefix,});
        if (response.status !== 'success') return alert('Error changing prefix');
        this.props.updateUser({...this.state.user, prefix: {...this.state.user.prefix, title: prefix},});
    }
    async submitUsername(username) {
        const response = await sendData('https://sendjet-app.herokuapp.com/profile/changeusername', {username,});
        if (response.status === 'Username already exists') return alert('Username already exists');
        if (response.status !== 'success') return alert('Error changing username');
        this.props.updateUser({...this.state.user, username,});
    }
    async submitPrefixColor(color) {
        const response = await sendData('https://sendjet-app.herokuapp.com/profile/changeprefixcolor', {color,});
        if (response.status !== 'success') return alert('Error changing prefix color');
    }
    async submitUsernameColor(color) {
        const response = await sendData('https://sendjet-app.herokuapp.com/profile/changeusernamecolor', {color,});
        if (response.status !== 'success') return alert('Error changing username color');
    }

    selectColor(color) {
        if (this.state.selectingColor === 'prefix') {
            this.setState({
                profile: { ...this.state.profile, prefix: {...this.state.profile.prefix, color, } },
            });
            this.props.updateUser({ ...this.state.user, prefix: {...this.state.user.prefix, color, } });
            this.submitPrefixColor(color);
        } else if (this.state.selectingColor === 'username') {
            this.setState({
                profile: { ...this.state.profile, usernameColor: color, },
            });
            this.props.updateUser({ ...this.state.user, usernameColor: color, });
            this.submitUsernameColor(color);
        }
    }

    closePopup() {
        Animated.spring(this.state.touch, {
            toValue: negHeight,
            useNativeDriver: false,
        }).start();
        this.setState({
            isActive: false,
        })
    }

    async changeProfileImage() {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            maxWidth: 1024,
            maxHeight: 1024,
        });

        if (!result.cancelled) {
            this.setState({
                changedProfileImage: result.uri,
            });
            // update user - emit set to false because it cant send private file://
            this.props.updateUser({...this.state.user, profilePicture: result.uri}, false)

            // Upload photo
            const blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function() {
                  resolve(xhr.response);
                };
                xhr.onerror = function(e) {
                  console.log(e);
                  reject(new TypeError('Network request failed'));
                };
                xhr.responseType = 'blob';
                xhr.open('GET', result.uri, true);
                xhr.send(null);
            });
            
            const storage = getStorage();
            const profileImgRef = ref(storage, this.state.user._id + '/profileImg');
            const fileRef = ref(profileImgRef, 'image.jpg');

            await uploadBytes(fileRef, blob);
            const downloadURL = await getDownloadURL(fileRef);
            
            blob.close();

            // Send download url to db to set profilePicture
            const response = await sendData('https://sendjet-app.herokuapp.com/profile/updateprofilepicture', { url: downloadURL });
            if (response.status !== 'success') {
                alert('Error changing picture');
            }
            
        }
    }

    render() {
        if (!this.state.profile) {
            return (
                <View></View>
            )
        } else {
        return (
            <Animated.View style={[styles.pop, {bottom: this.state.touch, transform: [{translateY: this.state.keyboardAnimation.value}]}]}>
                {/* Invisible hat to close if tapped */}
                { this.state.isActive ? <Pressable onPress={this.closePopup} style={{ position: 'absolute', height: Dimensions.get('window').height, width: Dimensions.get('window').width, top: 0, left: 0, transform: [{translateY: -Dimensions.get('window').height}]}}></Pressable> : null}
                <View style={[styles.gestureCont]}
                onStartShouldSetResponder={() => true}
                onResponderMove={(e) => {
                    this.state.touch.setValue(-e.nativeEvent.pageY);
                }}
                onResponderRelease={(e) => {
                    if (e.nativeEvent.pageY > Dimensions.get('window').height*0.5) {
                        this.closePopup();
                    }else {
                        Animated.spring(this.state.touch, {
                            toValue: positionFromBottom,
                            useNativeDriver: false,
                        }).start();
                    }
                }}
                ><View style={styles.gestureBar}></View>
                </View>


                {this.state.profile._id !== this.state.user._id && (
                <View style={{width: '100%', flexDirection: 'column', alignItems: 'center'}}>
                    <View style={{marginBottom: 20, opacity: this.checkIfFriends()?1:0}}>
                        {this.props.getCurrentlyOnline(this.state.profile._id)? (
                            <View style={{height: 15, width: 15, backgroundColor: '#00ce52', borderRadius: 10}}></View>
                        ):(
                            <View style={{height: 15, width: '100%'}}>
                                <Text style={{width: '100%', textAlign: 'center', color: 'white'}}>{formatLastOnline(this.state.profile.lastOnline)}</Text>
                            </View>
                        )}
                        
                    </View>
                    <View style={{height: 100, width: 100, marginBottom: 20}}>
                        <Image style={{width: '100%', height: '100%', borderRadius: 50}} source={{uri: this.state.profile.profilePicture}} />
                    </View>

                    <View style={{marginBottom: 2,}}>
                        <FormatUsername size={30} user={this.state.profile} />
                    </View>
                    <View style={{marginBottom: 10,}}>
                        <Text style={{fontSize: 20, color: '#a4a4a4'}}>{this.state.profile.firstName} {this.state.profile.lastName}</Text>
                    </View>
                    <View style={{flexDirection: 'row', opacity: this.checkIfFriends()?1:0}}>
                        <FontAwesomeIcon icon={faJetFighterUp} size={16} color="white" style={{marginRight: 5}} />
                        <Text style={{fontSize: 15, color: 'white'}}>{this.numberWithCommas(this.state.profile.score)}</Text>
                    </View>
                    { this.state.user.friendRequests.map(guy => guy._id).includes(this.state.profile._id) ? (
                        <APressable onPress={() => {this.acceptFriend(this.state.profile)}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                            <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Accept</Text>
                        </APressable>
                    ): this.state.user.friends.map(guy => guy._id).includes(this.state.profile._id) ? (
                        <APressable onPress={() => {this.confirmAlert(`Are you sure you would like to unadd ${this.state.profile.username}?`, () => {this.unaddFriend(this.state.profile)})}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                            <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Friends</Text>
                        </APressable>
                    ): this.state.user.addRequests.map(guy => guy._id).includes(this.state.profile._id) ?  (
                        <APressable onPress={() => {this.confirmAlert(`Are you sure you would like to unadd ${this.state.profile.username}?`, () => {this.unaddFriend(this.state.profile)})}} style={[styles.addBtn, {justifyContent: 'center'}]}>
                            <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Added</Text>
                        </APressable>
                    ): (
                        <APressable style={styles.addBtn} onPress={() => this.addFriend(this.state.profile)}>
                            <View style={{height: '100%', width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <FontAwesomeIcon icon={faPlus} size={16} color="#a4a4a4" />
                                <Text style={{color: '#a4a4a4', fontSize: 13, marginLeft: 5}}>Add</Text>
                            </View>
                        </APressable>
                    )}
                    <View style={{marginTop: 100, opacity: this.checkIfFriends()?1:0}}>
                        <Text style={{fontSize: 15, color: '#a4a4a4', marginBottom: 10}}>{this.state.profile.firstName} joined Sendjet on {new Date(this.state.profile.dateJoined).toDateString()}</Text>
                    </View>
                </View>
                )}

                {/* Settings popup for profile */}
                {this.state.profile._id === this.state.user._id && (
                <ScrollView style={{width: '100%', height: '66%', position: 'absolute', top: 30}} contentContainerStyle={{alignItems: 'center'}}>
                    <View style={{justifyContent: 'flex-start', flexDirection: 'row', marginTop: 25, height: 100}}>
                        <APressable onPress={this.changeProfileImage} style={{borderRadius: 50, overflow: 'hidden', height: '100%', width: 100, marginRight: 10}}>
                            <Image style={styles.profileImage} source={{uri: this.state.changedProfileImage || this.state.profile.profilePicture}} />
                            <View style={{width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                                <Text style={{fontSize: 12, color: 'white', textAlign: 'center'}}>Change{'\n'}Image</Text>
                            </View>
                        </APressable>
                        <View style={{flex: 1, height: '100%', justifyContent: 'space-between'}}>
                            <View style={{height: '48%', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 10}}>
                                <TextInput placeholderTextColor={'#a4a4a4'} style={{height: '100%',color: 'white', fontSize: 15, padding: 10, paddingLeft: 20, paddingRight: 20}} placeholder="First Name" value={this.state.profile.firstName} onChangeText={(text) => {this.setFirstName(text)}} onEndEditing={(e) => {this.submitFirstName(e.nativeEvent.text)}} />
                            </View>
                            <View style={{height: '48%', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 10}}>
                                <TextInput placeholderTextColor={'#a4a4a4'} style={{height: '100%',color: 'white', fontSize: 15, padding: 10, paddingLeft: 20, paddingRight: 20}} placeholder="Last Name" value={this.state.profile.lastName} onChangeText={(text) => {this.setLastName(text)}} onEndEditing={(e) => {this.submitLastName(e.nativeEvent.text)}} />
                            </View>
                        </View>
                    </View>
                    <View style={{height: 48, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 10, marginTop: 10, width: '100%'}}>
                        <TextInput placeholderTextColor={'#a4a4a4'} style={{height: '100%',color: 'white', fontSize: 15, padding: 10, paddingLeft: 20, paddingRight: 20}} placeholder="Email" value={this.state.profile.email} onChangeText={(text) => {this.setEmail(text)}} onEndEditing={(e) => {this.submitEmail(e.nativeEvent.text)}} />
                    </View>
                    <FontAwesomeIcon icon={faGem} size={30} color="#FFC700" style={{marginTop: 20}} />
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
                        <View style={{height: 48, flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 10, marginRight: 5}}>
                            <View style={{width: '100%', height: '100%', position: 'absolute', top: 48, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 5}}>
                                <Text style={{fontSize: 15, color: this.state.profile.prefix.color, fontWeight: 'bold'}}>[{this.state.profile.prefix.title}]</Text>
                            </View>
                            <View style={{position: 'absolute', height: '100%', top: 0, justifyContent: 'center', alignItems: 'center', left: 5}}>
                                <Text style={{color: '#FFC700', fontSize: 20}}>[</Text>
                            </View>
                            <View style={{position: 'absolute', height: '100%', top: 0, justifyContent: 'center', alignItems: 'center', right: 5}}>
                                <Text style={{color: '#FFC700', fontSize: 20}}>]</Text>
                            </View>
                            <TextInput onFocus={() => {this.state.keyboardAnimation.start(150)}} pointerEvents={this.state.profile.premium?'auto':'none'} placeholderTextColor={'#6a5300'} style={{height: '100%',color: '#FFC700', fontSize: 15, padding: 10, paddingLeft: 20, paddingRight: 20, textAlign: 'center'}} placeholder="PREFIX" value={this.state.profile.prefix.title} onChangeText={(text) => {this.setPrefix(text)}} onEndEditing={(e) => {this.submitPrefix(e.nativeEvent.text); this.state.keyboardAnimation.end()}} />
                        </View>
                        <View style={{height: 48, flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 10}}>
                            <View style={{width: '100%', height: '100%', position: 'absolute', top: 48, justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: 5}}>
                                <Text style={{fontSize: 15, color: this.state.profile.usernameColor?this.state.profile.usernameColor:'#fff', marginRight: 5,}}>{this.state.profile.username}</Text>
                            </View>
                            <TextInput onFocus={() => {this.state.keyboardAnimation.start(150)}} pointerEvents={this.state.profile.premium?'auto':'none'} placeholderTextColor={'#6a5300'} style={{height: '100%', color: '#FFC700', fontSize: 15, padding: 10, paddingLeft: 20, paddingRight: 20, textAlign: 'center'}} placeholder="username" value={this.state.profile.username} onChangeText={(text) => {this.setUsername(text)}} onEndEditing={(e) => {this.submitUsername(e.nativeEvent.text); this.state.keyboardAnimation.end()}} />
                        </View>
                    </View>
                    <View style={{width: '100%', flexDirection: 'row', marginTop: 35}}>
                        <APressable pointerEvents={this.state.profile.premium?'auto':'none'} onPress={() => {this.setState({selectingColor: 'prefix'})}} style={{flex: 1, justifyContent: 'center', alignItems: 'center', height: 25}}>
                            <View style={{borderWidth: this.state.selectingColor==='prefix'?4:0,  borderColor: '#0066ff', flex: 1, height: '100%', width: 25, borderRadius: 50, backgroundColor: this.state.profile.prefix.color}}></View>
                        </APressable>
                        <APressable pointerEvents={this.state.profile.premium?'auto':'none'} onPress={() => {this.setState({selectingColor: 'username'})}} style={{flex: 1, justifyContent: 'center', alignItems: 'center', height: 25}}>
                            <View style={{borderWidth: this.state.selectingColor==='username'?4:0,  borderColor: '#0066ff', flex: 1, height: '100%', width: 25, borderRadius: 50, backgroundColor: this.state.profile.usernameColor, }}></View>
                        </APressable>
                    </View>
                    <View pointerEvents={this.state.selectingColor?'auto':'none'} style={{flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'center', marginTop: 30, opacity: this.state.selectingColor?1:0}}>
                        <APressable value={0.50} onPress={() => {this.selectColor('#fe0000')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#fe0000',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#ff9000')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#ff9000',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#e1d51f')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#e1d51f',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#318154')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#318154',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#8d27a7')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#8d27a7',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#ffc0cb')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#ffc0cb',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#2a60c9')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#2a61c8',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#a4a4a4')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#a4a4a4',}}></APressable>
                        <APressable value={0.50} onPress={() => {this.selectColor('#fff')}} style={{height: 25, width: 25, borderRadius: 50, backgroundColor: '#fff',   }}></APressable>

                    </View>
                </ScrollView>
                
                )}
                

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
        width: 150, 
        height: 50,
    },
    profileImage: {width: '100%', height: '100%', position: 'absolute', top: 0, left: 0},

});

export default PopupProfile;