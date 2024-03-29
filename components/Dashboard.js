import { faHome, faPerson, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { StyleSheet, Text, View, Animated, Image, SafeAreaView } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import io from 'socket.io-client';


import DashHome from './DashHome';
import DashProfile from './DashProfile';
import DashSearch from './DashSearch';
import DashDock from './DashDock';
import PopupProfile from './PopupProfile';
import fadeIn from './animations/fadeIn';
import fadeOut from './animations/fadeOut';
import Messaging from './Messaging';
import ConversationMenu from './ConversationMenu';
import sendData from './sendData';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dashPage: 'home',
            user: props.user,
            conversations: props.conversations,
            currentlyOnline: [],
            dashDock: React.createRef(),
            popupProfile: React.createRef(),
            dashHome: React.createRef(),
            dashSearch: React.createRef(),
            dashProfile: React.createRef(),
            messaging: React.createRef(),
            conversationMenu: React.createRef(),

        }

        this.animation = new fadeIn(500);
        this.animation.continue = false;
        this.animation.start();

        this.dashAnimation = new fadeOut(300);
        this.dashAnimation.continue = false;

        this.componentDidMount = this.componentDidMount.bind(this);
        this.setDashPage = this.setDashPage.bind(this);
        this.fadeOutCurrentPage = this.fadeOutCurrentPage.bind(this);
        this.fadeInNewPage = this.fadeInNewPage.bind(this);
        this.updateConversations = this.updateConversations.bind(this);
        this.animateSetDashPage = this.animateSetDashPage.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.popupProfile = this.popupProfile.bind(this);
        this.getCurrentlyOnline = this.getCurrentlyOnline.bind(this);
        this.socketEmit = this.socketEmit.bind(this);
        this.openConversation = this.openConversation.bind(this);
        this.updateOneConversation = this.updateOneConversation.bind(this);
        this.checkConversation = this.checkConversation.bind(this);
        this.openConversationMenu = this.openConversationMenu.bind(this);
        this.removeConversation = this.removeConversation.bind(this);

    }

    registerForPushNotificationsAsync = async () => {
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
          }
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          console.log(token);
          this.setState({
            user: {
                ...this.state.user,
                expoPushToken: token
            }
          });
          sendData('/profile/setpushtoken', {token})
        } else {
          //alert('Must use physical device for Push Notifications');
        }
      
        if (Platform.OS === 'android') {
          Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      };

    componentDidMount() {
        this.socket = io('https://sendjet-server.glitch.me');

        this.socket.on('connect', () => {
            console.log('connected');
            this.socket.emit('joinUserRoom', {...this.state.user});
        });
        this.socket.on('disconnect', () => {
            console.log('disconnected');
            // Leave a conversation room if in one
            this.state.messaging.current.closeConversation();
        });

        this.socket.on('currentlyOnline', data => {
            console.log('online', data);
            this.setState({ currentlyOnline: data });
        });

        this.socket.on('updateUser', (friend) => {
            const usersFriends = this.state.user.friends.map(fri => {
                if (fri._id === friend._id) {
                    return friend;
                } else {
                    return fri;
                }
            });
            this.updateUser({ ...this.state.user, friends: usersFriends }, false);
        });

        this.socket.on('adduser', user => {
            this.updateUser({ ...this.state.user, friendRequests: [...this.state.user.friendRequests, user] }, false);
        });

        this.socket.on('unadduser', user => {
            this.updateUser({
                ...this.state.user,
                friends: this.state.user.friends.filter(fri => fri._id !== user._id),
                friendRequests: this.state.user.friendRequests.filter(fri => fri._id !== user._id)
            }, false);
        });

        this.socket.on('acceptfriendrequest', ({user, convoID}) => {
            this.updateUser({
                ...this.state.user,
                friends: [...this.state.user.friends, user],
                addRequests: this.state.user.addRequests.filter(fri => fri._id !== user._id)
            }, false);
            if (!this.state.conversations.map(c => c.members.map(m => m._id).includes(user._id)).includes(true)) {
                this.updateConversations([...this.state.conversations, {
                    _id: convoID,
                    title: user.username,
                    subTitle: user.firstName + ' ' + user.lastName,
                    members: [this.state.user, user],
                    messages: [],
                    dateCreated: Date.now(),
                    lastSentBy: this.state.user._id,
                    seenBy: [this.state.user._id],
                  }]);
              }
        });

        this.socket.on('declinefriendrequest', user => {
            this.updateUser({
                ...this.state.user,
                addRequests: this.state.user.addRequests.filter(fri => fri._id !== user._id)
            }, false);
        });

        this.socket.on('addConversation', convoData => {
            this.updateConversations([...this.state.conversations, convoData]);
        });

        // SOCKET MESSAGES HERE
        this.socket.on('sendMessage', ({conversationID, message}) => {
            const checkConversation = this.checkConversation();
            if (checkConversation._id) {
                if (checkConversation._id === conversationID) {
                    this.state.messaging.current.pushMessage(message);
                    const conversation = this.state.conversations.find(c => c._id === conversationID);
                    const seenBy = [...conversation.seenBy, this.state.user._id];
                    conversation.dateActive = new Date();
                    conversation.seenBy = seenBy;
                    message.type == 'changedgroupname' ? conversation.title = message.content : null;
                    this.updateOneConversation(conversation);
                    return;
                }
            }
            // Update conversation even if not open so it is loaded when user does open it
            const conversation = this.state.conversations.find(c => c._id === conversationID);
            const seenBy = [];
            if (conversation) {
                conversation.messages.push(message);
                conversation.dateActive = new Date();
                conversation.seenBy = seenBy;
                message.type == 'changedgroupname' ? conversation.title = message.content : null;
                this.updateOneConversation(conversation);
            }
        });
        this.socket.on('messageEditMessage', ({conversationID, newMessage}) => {
            const checkConversation = this.checkConversation();
            if (checkConversation._id) {
                if (checkConversation._id === conversationID) {
                    this.state.messaging.current.editMessageFromSocket(newMessage);
                    return;
                }
            }
            // Update conversation even if not open so it is loaded when user does open it
            const conversation = this.state.conversations.find(c => c._id === conversationID);

            if (conversation) {
                const allMessages = conversation.messages;
                newMessage.edited = true;
                const oldMessage = allMessages.find(mes => mes.date === newMessage.date);
                const indexOfMessage = allMessages.indexOf(oldMessage);
                allMessages.splice(indexOfMessage,1,newMessage);
                conversation.messages = allMessages;
                conversation.dateActive = new Date();
                this.updateOneConversation(conversation);
            }
        })

        this.socket.on('joinConversationRoom', ({conversationID, userID, inChatUsers}) => {
            if (userID === this.state.user._id) {
                // You joined room, set the users already in room
                this.state.messaging.current.setInChatUsers(inChatUsers);
                const conversation = this.state.conversations.find(c => c._id === conversationID);
                conversation.seenBy = [...conversation.seenBy, this.state.user._id];
                this.updateOneConversation(conversation);
            } else {
                // Someone else joined the room

                // Add them in chat to see they are in chat
                const checkConversation = this.checkConversation();
                if (checkConversation._id) {
                    if (checkConversation._id === conversationID) {
                        this.state.messaging.current.addInChatUser(userID);
                    }
                }

                // Update seen by status
                const conversation = this.state.conversations.find(c => c._id === conversationID);
                if (!conversation) return;
                conversation.seenBy = [userID];
                this.updateOneConversation(conversation);
            }
        });

        this.socket.on('leaveConversation', ({conversationID, userID}) => {
            this.state.messaging.current.removeUserFromConvo({conversationID, userID});

        });

        this.socket.on('isTyping', ({conversationID, userID, text}) => {
            if (this.state.messaging.current.checkConversation()._id === conversationID) {
                this.state.messaging.current.setUsersTyping(userID, text);
            }
        });

        // Ask for push notis permission
        this.registerForPushNotificationsAsync();

        // Handle received push notis
        Notifications.addNotificationReceivedListener(this._handleNotification);
        Notifications.addNotificationResponseReceivedListener(this._handleNotificationResponse);
    }

    // Handle received notification when app is in foreground immidiately
    _handleNotification = notification => {
        this.setState({ notification: notification });
        console.log(notification)
      };
    
      // Handle with push noti is clicked on no matter app status
    _handleNotificationResponse = response => {
        console.log(response);
    };

    componentWillUnmount() {
        console.log('unmounting');
        this.socket.disconnect();
    }

    checkConversation() {
        return this.state.messaging.current.checkConversation();
    }

    getCurrentlyOnline(userID = '') {
        if (userID) return this.state.currentlyOnline.find(user => user.userID === userID)?true:false;
        return this.state.currentlyOnline;
    }


    setDashPage(page) {
        // If at dashPage = home and pressed home, unfocus any widget
        if (page === 'home' && this.state.dashPage === 'home') {
            this.state.dashHome.current.focusWidget('');
        }
        // If alr at the same page, return
        if (page === this.state.dashPage) return;
        this.fadeOutCurrentPage();
        setTimeout(() => {
            this.setState({ dashPage: page });
            this.fadeInNewPage();
        },300);
    }
    animateSetDashPage(page) {
        this.state.dashDock.current.setDashPage(page);
    }

    fadeOutCurrentPage() {
        this.dashAnimation.start();
    }

    fadeInNewPage() {
        this.dashAnimation.finish();
    }

    updateConversations(conversations) {
        this.props.setConversations(conversations);
        this.setState({ conversations });

        if (this.state.dashPage === 'home') {
            this.state.dashHome.current.setConversations(conversations);
        }
    }
    updateOneConversation(conversation) {
        this.updateConversations([...this.state.conversations.filter(c => c._id !== conversation._id), conversation]);
    }
    removeConversation(conversationID) {
        this.updateConversations([...this.state.conversations.filter(c => c._id !== conversationID)]);
    }
    updateUser(user, emit = true) {
        if (emit) this.socketEmit('updateUser', user);
        this.props.setUser(user);
        this.setState({ user });

        //Update state of user on all dashboard childs
        switch(this.state.dashPage) {
            case 'home':
                this.state.dashHome.current.setUser(user);
                break;
            case 'search':
                this.state.dashSearch.current.setUser(user);
                break;
            case 'profile':
                this.state.dashProfile.current.setUser(user);
                break;
        }
        this.state.popupProfile.current.setUser(user);
        this.state.messaging.current.setUser(user);
        this.state.dashDock.current.setUser(user);
    }

    popupProfile(profile) {
        this.state.popupProfile.current.popupProfile(profile);
    }
    socketEmit(event, data) {
        this.socket.emit(event, data);
    }
    openConversation(conversation) { // Can be an id or a conversation
        if (typeof conversation === 'string') {
            conversation = this.state.conversations.find(c => c._id === conversation);
        } else {
            conversation = this.state.conversations.find(c => c._id === conversation._id);
        }
        this.state.messaging.current.openConversation(conversation);
    }

    openConversationMenu(convo) {
        this.state.conversationMenu.current.setConvo(convo);
        this.state.conversationMenu.current.openMenu();
    }

    render() {
        return (
            <Animated.View style={[{opacity: this.animation.value, height: '100%', width: '100%'}]}>

                <SafeAreaView>
                    <View style={styles.headerCont}>
                        <View style={styles.headerTitle}>
                            <Image source={require('../assets/title.png')} style={styles.logo} />
                        </View>
                        <Animated.View style={[styles.headerInfo, {opacity: this.dashAnimation.value}]}>
                            <FontAwesomeIcon icon={this.state.dashPage==='search'?faSearch:this.state.dashPage==='home'?faHome:faPerson} size={25} color="#a4a4a4" />
                            <Text style={styles.headerInfoText}>{this.state.dashPage === 'home'?'Home':this.state.dashPage === 'search'?'Search':'Profile'}</Text>
                        </Animated.View>
                    </View>
                </SafeAreaView>

                {this.state.dashPage === 'home' && (
                <Animated.View style={{opacity: this.dashAnimation.value, height: '100%'}}>
                    <DashHome
                    ref={this.state.dashHome}
                    user={this.state.user}
                    conversations={this.state.conversations}
                    updateUser={this.updateUser}
                    updateConversations={this.updateConversations}
                    animateSetDashPage={this.animateSetDashPage}
                    popupProfile={this.popupProfile}
                    getCurrentlyOnline={this.getCurrentlyOnline}
                    socketEmit={this.socketEmit}
                    openConversation={this.openConversation}
                    openConversationMenu={this.openConversationMenu}

                    />
                </Animated.View>
                )}
                {this.state.dashPage === 'search' && (

                <Animated.View style={{opacity: this.dashAnimation.value}}>
                    <DashSearch
                    ref={this.state.dashSearch}
                    popupProfile={this.popupProfile}
                    user={this.state.user}
                    updateUser={this.updateUser}
                    getCurrentlyOnline={this.getCurrentlyOnline}
                    socketEmit={this.socketEmit}
                    />
                </Animated.View>
                )}
                {this.state.dashPage === 'profile' && (
                <Animated.View style={{opacity: this.dashAnimation.value}}>
                    <DashProfile
                    user={this.state.user}
                    setPage={this.props.setPage}
                    ref={this.state.dashProfile}
                    popupProfile={this.popupProfile}
                    updateUser={this.updateUser}
                    updateConversations={this.updateConversations}
                    getCurrentlyOnline={this.getCurrentlyOnline}
                    socketEmit={this.socketEmit}
                    />
                </Animated.View>
                )}
                <DashDock
                ref={this.state.dashDock}
                user={this.state.user}
                setDashPage={this.setDashPage}
                dashPage={this.state.dashPage}
                fadeOutCurrentPage={this.fadeOutCurrentPage}
                dashAnimationValue={this.dashAnimation.value}
                />

                {/* MESSAGING VIEW */}
                <Messaging 
                ref={this.state.messaging}
                user={this.state.user}
                updateUser={this.updateUser}
                updateOneConversation={this.updateOneConversation}
                getCurrentlyOnline={this.getCurrentlyOnline}
                socketEmit={this.socketEmit}
                popupProfile={this.popupProfile}
                removeConversation={this.removeConversation}
                />

                <ConversationMenu
                    ref={this.state.conversationMenu}
                    user={this.state.user}
                    popupProfile={this.popupProfile}
                    updateUser={this.updateUser}
                    updateOneConversation={this.updateOneConversation}
                    socketEmit={this.socketEmit}
                    removeConversation={this.removeConversation}
                    // conversation={this.state.conversation}
                    />

                    {/* PROFILE POP UP WIDGET */}
                <PopupProfile
                ref={this.state.popupProfile}
                user={this.state.user}
                updateUser={this.updateUser}
                getCurrentlyOnline={this.getCurrentlyOnline}
                socketEmit={this.socketEmit}
                />

            </Animated.View>
        )
    }
}

const styles = StyleSheet.create({
    headerCont: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 100,
        padding: 20,
    },
    headerTitle: {
        height: '100%',
        width: '50%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: '100%',
        width: '100%',
        resizeMode: 'contain',
    },
    headerInfo: {
        height: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    headerInfoText: {
        fontSize: 15,
        color: '#a4a4a4',
    },
});

export default Dashboard;