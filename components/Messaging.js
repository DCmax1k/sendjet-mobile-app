import { faArrowLeft, faArrowUp, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component } from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions, Animated as anim, SafeAreaView, Pressable, ScrollView, Image, TextInput, LayoutAnimation, Platform } from 'react-native';
import Animated, { ZoomIn, ZoomInEasyDown, ZoomInEasyUp, ZoomOut } from 'react-native-reanimated';

import messagingSlide from './animations/messagingSlide';
import FormatUsername from './FormatUsername';
import keyboardShiftMessages from './animations/keyboardShiftMessages';
import keyboardShift from './animations/messagingSlide';
import searchUser from './utils/searchUser';

const animationDuration = 200;


class Messaging extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            user: props.user,
            conversation: {},
            inChatUsers: [], // jsut ids of those peeking the convo
            inputText: '',
            inputTextHeight: 0,
            scrollViewRef: React.createRef(),
            slideAnimation: new messagingSlide(0, -Dimensions.get('window').width, animationDuration),
            keyboardShiftAnimation: new keyboardShiftMessages(0, 330, 200),
            messageViewAnimated: new keyboardShift(0, 350, 200),
        };

        this.setUser = this.setUser.bind(this);
        this.openConversation = this.openConversation.bind(this);
        this.closeConversation = this.closeConversation.bind(this);
        this.pushMessage = this.pushMessage.bind(this);
        this.setInputText = this.setInputText.bind(this);
        this.setTextInputHeight = this.setTextInputHeight.bind(this);
        this.sendText = this.sendText.bind(this);
        this.checkConversation = this.checkConversation.bind(this);

    }

    setUser(user) {
        this.setState({ user });
    }

    openConversation(conversation) {
        this.state.keyboardShiftAnimation.end();
        this.setState({ conversation });
        if (!this.state.conversation) return;
        this.state.slideAnimation.open();
        setTimeout(() => {
            this.state.scrollViewRef.current.scrollToEnd({ animated: false });
        }, 1);
        this.props.socketEmit('joinConversationRoom', {conversationID: conversation._id, userID: this.state.user._id, members: conversation.members});
    }
    closeConversation() {
        const conversation = this.state.conversation;
        this.setState({ conversation: {} })
        this.state.slideAnimation.close();
        setTimeout(() => {
            this.props.socketEmit('leaveConversation', {conversationID: conversation._id, userID: this.state.user._id, members: conversation.members});
        }, animationDuration);
        
    }

    pushMessage(message) {
        const conversation = { ...this.state.conversation, messages: [...this.state.conversation.messages, message] };
        this.setState({
            conversation,
        });
        this.props.updateOneConversation(conversation);
        setTimeout(() => {
            this.state.scrollViewRef.current.scrollToEnd({ animated: true });
        }, 1);
    }
    setInChatUsers(users) {
        this.setState({inChatUsers: users});
    }
    addInChatUser(userID) {
        this.setState({ inChatUsers: [...this.state.inChatUsers, userID] });
    }
    removeInChatUser(userID) {
        this.setState({ inChatUsers: this.state.inChatUsers.filter(user => user !== userID) });
    }

    setInputText(e) {
        this.setState({
            inputText: e.nativeEvent.text,
        });
    }
    setTextInputHeight(e) {
        if (e) {
           this.setState({
                inputTextHeight: e.nativeEvent.contentSize.height,
            }); 
        } else {
            if (Platform.OS === 'android') {
              this.setState({
                inputTextHeight: 55,
            });  
            }
            
        }
        
    }

    sendText() {
        this.setTextInputHeight();
        const message = {
            type: 'text',
            content: this.state.inputText,
            date: Date.now(),
            sentBy: this.state.user._id,
            edited: false,
        };
        this.pushMessage(message);
        this.setState({
            inputText: '',
        });
        this.props.socketEmit('sendMessage', {conversationID: this.state.conversation._id, message, members: this.state.conversation.members.map(guy => guy._id) }); // SERVER will update conversation in db, and send message to all users in the chat online or offline, but will just send noti to offline. const rooms = {} on server, with conversation ID as keys, and then array of the useres in that chat. 
    }

    checkConversation() {
        return this.state.conversation;
    }

    render() {
        return (
            <anim.View style={[styles.messaging, {transform: [{translateX: this.state.slideAnimation.getValue()}]}]}>
                <ImageBackground source={require('../assets/background.png')} style={styles.background}>
                    {this.state.conversation._id && (
                    <SafeAreaView style={{flex: 1, width: '100%', }}>

                        <View style={styles.header}>
                            <Pressable onPress={this.closeConversation} style={{width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 10}}>
                                <FontAwesomeIcon icon={faArrowLeft} size={25} color='white' onPress={() => this.closeConversation()} />
                            </Pressable>
                            <View>
                                {this.state.conversation.members.length === 2 && (
                                    <FormatUsername user={this.state.conversation.members.find(guy => guy._id !== this.state.user._id)} size={20} />
                                )}
                                {this.state.conversation.members.length !== 2 && (
                                    <Text>{this.state.conversation.title}</Text>
                                )}
                            </View>
                            <View style={{width: 50, height: '100%', justifyContent: 'center', alignItems: 'center'}}></View>
                        </View>

                        <anim.View style={{height: Dimensions.get('window').height, width: '100%', zIndex: 0, elevation: 0, position: 'absolute', bottom: Platform.OS === 'android' ? 0 : this.state.messageViewAnimated.getValue() , left: 0}}>
                            <ScrollView ref={this.state.scrollViewRef} style={{zIndex: 0}} contentContainerStyle={{justifyContent: 'flex-end', flexGrow: 1, paddingTop: 130, paddingBottom: 150}}>
                                
                                 {/* MAP THROUGH MESSAGES */}

                                {this.state.conversation.messages.map( (message, index) => {
                                    const sentMessage = message.sentBy === this.state.user._id;
                                    let owner = sentMessage?this.state.user:this.state.conversation.members.find(user => user._id === message.sentBy);
                                    const biConvo = this.state.conversation.members.length === 2;
                                    if (message.type === 'text') {
                                        return (
                                            <Animated.View
                                            key={index}
                                            style={[styles.message, sentMessage?styles.messageSent:styles.messageRec, !sentMessage && !biConvo?{marginTop: 25}:{}, {zIndex: 0, elevation: 0,}]}
                                            entering={sentMessage ? ZoomInEasyDown : ZoomInEasyUp}
                                            >
                                                { !sentMessage && !biConvo && <Text style={sentMessage?styles.sentName:styles.recName}><FormatUsername user={owner} size={16} /></Text>}
                                                <View style={[styles.messageTypeText, sentMessage?{backgroundColor: '#BE3331'}:{}]}>
                                                    <Text style={{color: 'white', fontSize: 16, fontWeight: '200'}}>{message.content}</Text>
                                                </View>
                                            </Animated.View>
                                        );
                                    }
                                })}
                            </ScrollView>
                        </anim.View>

                        <View pointerEvents='box-none' style={{flex: 1, zIndex: 0, elevation: 0,}}>
                           <View style={[styles.inputsCont,]}>
                                <ScrollView horizontal={true} contentContainerStyle={{flexDirection: 'row', width: '100%', justifyContent: 'flex-start', alignItems: 'flex-end', paddingBottom: 5,}}>
                                    <View style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }}>
                                        <FontAwesomeIcon icon={faEllipsis} size={25} color='white' />
                                    </View>
                                    
                                    {/* For each user in chat */}
                                    {this.state.inChatUsers.map((userID, index) => {
                                        const user = this.state.conversation.members.find(user => user._id === userID);
                                        if (user._id === this.state.user._id) return null;
                                        return (
                                            <Animated.View key={index} entering={ZoomIn} exiting={ZoomOut} style={{height: 40, width: 40, marginLeft: 5, borderRadius: 9999, borderWidth: 5, borderColor: '#BE3331', shadowColor: 'black', shadowOffset: {x: 0, y: 0}, shadowRadius: 2, shadowOpacity: 1 }}>
                                                <Image source={{uri: user.profilePicture}} style={{height: '100%', width: '100%', resizeMode: 'contain', borderRadius: 9999}} />
                                            </Animated.View>
                                        )
                                    })}
                                </ScrollView>
                                {/* KEYBOARD MAKES THIS VIEW MARGIN BOTTOM 330 from 0 */}
                                <anim.View style={{width: '100%', height: 70, justifyContent: 'center', alignItems: 'center', marginBottom: this.state.keyboardShiftAnimation.getValue()}}> 
                                    <Pressable onPress={this.sendText} style={{height: 40, width: 40, borderRadius: 999, backgroundColor: '#BD3230', position: 'absolute', right: 10, top: 25, zIndex: 3, elevation: 3, justifyContent: 'center', alignItems: 'center'}}>
                                        <FontAwesomeIcon icon={faArrowUp} size={25} color='white' />
                                    </Pressable>
                                    <TextInput value={this.state.inputText} onChange={this.setInputText} multiline={true} onContentSizeChange={this.setTextInputHeight} onFocus={() => {this.state.keyboardShiftAnimation.start(); this.state.messageViewAnimated.open();}} onEndEditing={(e) => {this.state.keyboardShiftAnimation.end(); this.state.messageViewAnimated.close(); this.setTextInputHeight()}} placeholder='Send a message' placeholderTextColor='#a4a4a4' style={[styles.textInput, {height: Platform.OS === 'android' ? this.state.inputTextHeight : this.state.inputTextHeight + 30,}]} />
                                </anim.View>
                            </View> 
                        </View>
                        



                    </SafeAreaView>
                    )}
                </ImageBackground>
            </anim.View>
        );
    }
}

const styles = StyleSheet.create({
    messaging: {
        position: 'absolute',
        top: 0,
        left: Dimensions.get('window').width,
        //left: 0,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    },
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    header : {
        width: '100%',
        height: 80,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 1, zIndex: 1,

    },
    inputsCont: {
        minHeight: 130,
        width: '100%',
        elevation: 1, zIndex: 1,
        position: 'absolute',
        left: 0,
        bottom: 0,
    },
    message: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 0,
        paddingRight: 0,
        marginTop: 10,
    },
    messageTypeText: {
        backgroundColor: '#5f5f5f',
        maxWidth: '70%',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginHorizontal: 10,
    },
    messageRec: {
        justifyContent: 'flex-start',
    },
    messageSent: {
        justifyContent: 'flex-end',
    },
    textInput: {
        fontSize: 20,
        fontWeight: '200',
        color: '#C5C5C5',
        width: '98%',
        maxHeight: 200,
        paddingTop: 15,
        paddingBottom: 15,
        paddingHorizontal: 20,
        paddingRight: 60,
        position: 'absolute',
        bottom: 0,
        zIndex: 2, elevation: 2,
        backgroundColor: '#ba5d60',
        borderRadius: 25
    },
    sentName: {
        position: 'absolute', top: -20, right: 30, color: '#a4a4a4',
    },
    recName: {
        position: 'absolute', top: -20, left: 30, color: '#a4a4a4',
    },
});

export default Messaging;