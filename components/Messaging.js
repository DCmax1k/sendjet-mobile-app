import { faArrowLeft, faArrowUp, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component } from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions, Animated, SafeAreaView, Pressable, ScrollView, Image, TextInput, LayoutAnimation, Platform, AppState, Alert } from 'react-native';
import anima, { ZoomIn, ZoomInEasyDown, ZoomInEasyUp, ZoomOut, FadeInLeft, FadeOutLeft, Layout, FadeIn, FadeOut, SlideInUp, SlideOutDown, SlideInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';

import messagingSlide from './animations/messagingSlide';
import FormatUsername from './FormatUsername';
import keyboardShiftMessages from './animations/keyboardShiftMessages';
import keyboardShift from './animations/messagingSlide';
import searchUser from './utils/searchUser';
import APressable from './APressable';
import messageHoldAnimation from './animations/messageHoldAnimation';
import ConversationMenu from './ConversationMenu';

const animationDuration = 200;


class Messaging extends Component {
    constructor(props) {
        super(props);
        this.conversationMenu = React.createRef();
        this.state = { 
            user: props.user,
            conversation: {},
            inChatUsers: [], // jsut ids of those peeking the convo
            usersTyping: [],
            inputText: '',
            inputTextHeight: 0,
            scrollViewRef: React.createRef(),
            slideAnimation: new messagingSlide(0, -Dimensions.get('window').width, animationDuration),
            keyboardShiftAnimation: new keyboardShiftMessages(0, 330, 200),
            messageViewAnimated: new keyboardShift(0, 330, 200),
            appState: AppState.currentState,
            messageOptions: false,
            messageOptionsData: null,
            conversationMenuOpen: false,
        };

        this.componentDidMount = this.componentDidMount.bind(this);

        this.setUser = this.setUser.bind(this);
        this.openConversation = this.openConversation.bind(this);
        this.closeConversation = this.closeConversation.bind(this);
        this.pushMessage = this.pushMessage.bind(this);
        this.setInputText = this.setInputText.bind(this);
        this.setTextInputHeight = this.setTextInputHeight.bind(this);
        this.sendText = this.sendText.bind(this);
        this.checkConversation = this.checkConversation.bind(this);
        this.setUsersTyping = this.setUsersTyping.bind(this);
        this.openMessageOptions = this.openMessageOptions.bind(this);
        this.changeEditMessage = this.changeEditMessage.bind(this);
        this.saveEdit = this.saveEdit.bind(this);
        this.deleteText = this.deleteText.bind(this);
        this.toggleConversationMenu = this.toggleConversationMenu.bind(this);
        this.updateOneConversation = this.updateOneConversation.bind(this);

    }

    componentDidMount() {
        this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background') this.closeConversation();
            this.setState({appState: nextAppState});
        });
        this.state.messageViewAnimated.close();
    }

    componentWillUnmount() {
        this.appStateSubscription.remove();
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
            if (this.state.scrollViewRef.current) {
                this.state.scrollViewRef.current.scrollToEnd({ animated: false });
            }
            
        }, 1);
        this.props.socketEmit('joinConversationRoom', {conversationID: conversation._id, userID: this.state.user._id, members: conversation.members});
    }
    closeConversation() {
        if (this.state.conversationMenuOpen) return this.toggleConversationMenu();
        const conversation = this.state.conversation;
        this.setState({
            conversation: {},
            inChatUsers: [],
            messageOptions: false,

        });
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
        return conversation;
    }
    setInChatUsers(users) {
        this.setState({inChatUsers: users.filter((item, index) => users.indexOf(item) === index) });
    }
    addInChatUser(userID) {
        const newList = [...this.state.inChatUsers, userID];
        this.setState({ inChatUsers: newList.filter((item, index) => newList.indexOf(item) === index) });
    }
    removeInChatUser(userID) {
        this.setState({ inChatUsers: this.state.inChatUsers.filter(user => user !== userID) });
    }

    setInputText(e) {
        this.setState({
            inputText: e.nativeEvent.text,
        });
        // send socket is typing function
        this.props.socketEmit('isTyping', {conversationID: this.state.conversation._id, userID: this.state.user._id, text: e.nativeEvent.text});
    }

    setUsersTyping(userTyping, text) {
        if (text) {
            const newUsers = [...this.state.usersTyping, userTyping];
            this.setState({
                usersTyping: newUsers.filter((user, index) => newUsers.indexOf(user) === index),
            });
        } else {
            this.setState({
                usersTyping: this.state.usersTyping.filter(user => user!== userTyping),
            });
        }
        
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
        const newConversation = this.pushMessage(message);
        this.setState({
            inputText: '',
        });
        this.props.socketEmit('isTyping', {conversationID: this.state.conversation._id, userID: this.state.user._id, text:''});
        this.props.socketEmit('sendMessage', {conversationID: this.state.conversation._id, message, members: this.state.conversation.members.map(guy => guy._id) }); // SERVER will update conversation in db, and send message to all users in the chat online or offline, but will just send noti to offline. const rooms = {} on server, with conversation ID as keys, and then array of the useres in that chat. 
        // Update conversation dateActive and seenby locally
        this.props.updateOneConversation({...newConversation, seenBy: [this.state.user._id, ...this.state.inChatUsers], dateActive: new Date()})
    }
    formatTime(date) {
        date = new Date(date);
        const day = date.toDateString();
        const localTime = date.toLocaleTimeString();
        const time = `, ${localTime.split(':').splice(0,2).join(':')} ${localTime.split(' ').splice(1, 1).join('').toLowerCase()}`;
        return day + time;
    }
    checkConversation() {
        return this.state.conversation;
    }

    openMessageOptions(message) {
        this.setState({
            messageOptions: true,
            messageOptionsData: message,
        });
    }
    changeEditMessage(e)  {
        if (this.state.messageOptionsData.sentBy === this.state.user._id) {
            this.setState({
                messageOptionsData: {...this.state.messageOptionsData, content: e.nativeEvent.text}
            });
        }
        
    }
    async copyText(text) {
        await Clipboard.setStringAsync(text);
        this.alertCopied();
        this.setState({
            messageOptions: false,
            messageOptionsData: null,
        });
    }

    alertCopied() {
        Alert.alert(
            'Text copied to clipboard!',
            '',
            [{text: 'OK'}]
        )
    }

    confirmAlert(msg, callback) {
        Alert.alert(
            'Warning!',
            msg,
            [
                { text: 'Cancel', style: 'cancel', },
                {
                    text: 'YES', onPress: callback,
                }
            ]
        )
    }

    saveEdit() {
        const allMessages = this.state.conversation.messages;
        const newMessage = this.state.messageOptionsData;
        newMessage.edited = true;
        this.setState({
            messageOptions: false,
            messageOptionsData: null,
        });
        this.editMessageUpload(newMessage);
        const oldMessage = allMessages.find(mes => mes.date === newMessage.date);
        const indexOfMessage = allMessages.indexOf(oldMessage);
        allMessages.splice(indexOfMessage,1,newMessage);
        const updatedConversation = {...this.state.conversation, messages: allMessages, dateActive: new Date()}
        this.setState({
            conversation: updatedConversation,
        });
        // update throughout app
        this.props.updateOneConversation(updatedConversation);
    }
    deleteText() {
        const allMessages = this.state.conversation.messages;
        const newMessage = this.state.messageOptionsData;
        newMessage.type = 'deleted';
        newMessage.content = '';
        this.setState({
            messageOptions: false,
            messageOptionsData: null,
        });
        this.editMessageUpload(newMessage);
        const oldMessage = allMessages.find(mes => mes.date === newMessage.date);
        const indexOfMessage = allMessages.indexOf(oldMessage);
        allMessages.splice(indexOfMessage,1,newMessage);
        const updatedConversation = {...this.state.conversation, messages: allMessages, dateActive: new Date()}
        this.setState({
            conversation: updatedConversation,
        });
        // update throughout app
        this.props.updateOneConversation(updatedConversation);
    }
    editMessageUpload(message) {
        this.props.socketEmit('messagesEditMessage', {conversationID: this.state.conversation._id, newMessage: message, members: this.state.conversation.members.map(guy => guy._id)});
    }
    editMessageFromSocket(newMessage) {
        const allMessages = this.state.conversation.messages;
        newMessage.edited = true;
        const oldMessage = allMessages.find(mes => mes.date === newMessage.date);
        const indexOfMessage = allMessages.indexOf(oldMessage);
        allMessages.splice(indexOfMessage,1,newMessage);
        const updatedConversation = {...this.state.conversation, messages: allMessages, dateActive: new Date()}
        this.setState({
            conversation: updatedConversation,
        });
        // update throughout app
        this.props.updateOneConversation(updatedConversation);
    }

    toggleConversationMenu() {
        if (this.conversationMenu.current.state.isOpen) {
            this.conversationMenu.current.closeMenu()
        } else {
            this.conversationMenu.current.openMenu()
        }
    }

    updateOneConversation(conversation) {
        this.setState({conversation});
        this.props.updateOneConversation(conversation)
    }

    render() {
        const messages = this.state.conversation.messages;
        let stateMessages;
        if (messages) {
            stateMessages = messages.filter(msg => messages.indexOf(msg) > messages.length - 20);
        }
        
        return (
            <Animated.View style={[styles.messaging, {transform: [{translateX: this.state.slideAnimation.getValue()}]}]}>
                <ImageBackground source={require('../assets/background.png')} style={styles.background}>
                    {this.state.conversation._id && (
                    <SafeAreaView style={{flex: 1, width: '100%', }}>

                        {/* Messages */}
                        <Animated.View style={{height: Dimensions.get('window').height, width: '100%', zIndex: 0, elevation: 0, position: 'absolute', bottom: Platform.OS === 'android' ? 0 : this.state.messageViewAnimated.getValue() , left: 0}}>
                            <ScrollView ref={this.state.scrollViewRef} style={{zIndex: 0}} contentContainerStyle={{justifyContent: 'flex-end', flexGrow: 1, paddingTop: 130, paddingBottom: 150}}>
                                
                                 {/* MAP THROUGH MESSAGES HERE */}

                                {stateMessages.sort((a,b) => a.date - b.date).map( (message, index) => {
                                    const messages = stateMessages.sort((a,b) => a.date - b.date);
                                    const sentMessage = message.sentBy === this.state.user._id;
                                    let owner = sentMessage?this.state.user:this.state.conversation.members.find(user => user._id === message.sentBy);
                                    const biConvo = this.state.conversation.members.length === 2;
                                    const showUsernameAboveMessage = !sentMessage && !biConvo && ( index===0 || (index>0?messages[index-1].sentBy !== message.sentBy : false ));
                                    const showDateAboveMessage = index===0 || ((message.date - messages[index-1].date) > 3600000);

                                    const interactAnim = new messageHoldAnimation();
                                    if (message.type === 'text') {
                                        return (
                                            <anima.View
                                            key={index}
                                            style={[styles.message, sentMessage?styles.messageSent:styles.messageRec,  {marginTop: showUsernameAboveMessage ? 35 : showDateAboveMessage ? 50 : 10}, {zIndex: 0, elevation: 0,}]}
                                            entering={sentMessage ? ZoomInEasyDown : ZoomInEasyUp}
                                            >
                                                { showUsernameAboveMessage && <Text style={styles.recName}><FormatUsername user={owner} size={13} /></Text>}
                                                { showDateAboveMessage && <Text style={{ position: 'absolute', width: '100%', textAlign: 'center', top: -35, left: 0, color: '#a4a4a4', fontSize: 15}}>{this.formatTime(message.date)}</Text>}
                                                
                                                <Pressable onPressIn={interactAnim.startHolding} onPressOut={interactAnim.stoppedHolding} onLongPress={() => {interactAnim.finishedHolding(); this.openMessageOptions(message)}} style={{maxWidth: '70%', marginBottom: message.type === 'deleted'?0:message.edited?10:0}}>
                                                    <Animated.View style={[styles.messageTypeText, {transform: [{scale: interactAnim.getValue()}]}, sentMessage?{backgroundColor: '#BE3331'}:{}]}>
                                                        <Text style={{color: 'white', fontSize: 16, fontWeight: '200'}}>{message.content}</Text>
                                                        { message.edited && <Text style={{ textAlign: 'right', position: 'absolute', bottom: -13, right: 5, color: '#a4a4a4', width: 50, fontSize: 9}}>Edited</Text>}
                                                    </Animated.View>
                                                    
                                                </Pressable>
                                            </anima.View>
                                        );
                                    } else if (message.type === 'deleted') {
                                        return (
                                        <anima.View
                                            key={index}
                                            style={[styles.message, sentMessage?styles.messageSent:styles.messageRec,  {marginTop: showUsernameAboveMessage ? 35 : showDateAboveMessage ? 50 : 10}, {zIndex: 0, elevation: 0,}]}
                                            entering={sentMessage ? ZoomInEasyDown : ZoomInEasyUp}
                                            >
                                                { showDateAboveMessage && <Text style={{ position: 'absolute', width: '100%', textAlign: 'center', top: -35, left: 0, color: '#a4a4a4', fontSize: 15}}>{this.formatTime(message.date)}</Text>}
                                                
                                                <Pressable onPressIn={interactAnim.startHolding} onPressOut={interactAnim.stoppedHolding} onLongPress={() => {interactAnim.finishedHolding();}} style={{maxWidth: '70%', marginBottom: message.edited?10:0}}>
                                                    <Animated.View style={[styles.messageTypeText, {transform: [{scale: interactAnim.getValue()}]}, sentMessage?{backgroundColor: '#BE3331'}:{}, {backgroundColor: 'transparent', flexDirection: 'row', }]}>
                                                        <FormatUsername user={owner} size={13} />
                                                        <Text style={{color: 'white', fontSize: 13, fontWeight: '200', marginLeft: 5}}>deleted a message</Text>
                                                    </Animated.View>
                                                    
                                                </Pressable>
                                            </anima.View>
                                        )
                                    } else if (message.type === 'changedgroupname') {
                                        return (
                                            <anima.View
                                                key={index}
                                                style={[{marginTop: showUsernameAboveMessage ? 35 : showDateAboveMessage ? 50 : 10}]}
                                                entering={sentMessage ? ZoomInEasyDown : ZoomInEasyUp}
                                                >
                                                    { showDateAboveMessage && <Text style={{ position: 'absolute', width: '100%', textAlign: 'center', top: -35, left: 0, color: '#a4a4a4', fontSize: 15}}>{this.formatTime(message.date)}</Text>}
                                                    
                                                    <Pressable onPressIn={interactAnim.startHolding} onPressOut={interactAnim.stoppedHolding} onLongPress={() => {interactAnim.finishedHolding();}} style={{display: 'flex', alignItems: 'center',  maxWidth: '100%', marginBottom: message.edited?10:0, minHeight: 1}}>
                                                        <Animated.View style={{display: 'flex', justifyContent: 'center', alignItems: 'center', transform: [{scale: interactAnim.getValue()}]}}>
                                                            <FormatUsername user={owner} size={13} />
                                                            <Text style={{ maxWidth: Dimensions.get('screen').width, color: 'white', fontSize: 13, fontWeight: '200', paddingLeft: 10, paddingRight: 10, minHeight: 1,}}>changed the group name to <Text style={{fontWeight: '900'}}>{message.content}</Text></Text>
                                                        </Animated.View>
                                                        
                                                    </Pressable>
                                                </anima.View>
                                            )
                                    }
                                })}
                            </ScrollView>
                        </Animated.View>

                        

                        {/* Header */}
                        <View style={styles.header}>
                            <APressable onPress={this.closeConversation} style={{width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 10}}>
                                <FontAwesomeIcon icon={faArrowLeft} size={25} color='white' onPress={() => this.closeConversation()} />
                            </APressable>
                            <APressable onPress={this.toggleConversationMenu} style={{backgroundColor: 'rgb(50, 50, 50)', borderRadius: 9999, paddingHorizontal: 40, maxHeight: 50, maxWidth: Dimensions.get('screen').width*0.8, minWidth: 40}}>
                                {this.state.conversation.members.length === 2 && (
                                    <FormatUsername user={this.state.conversation.members.find(guy => guy._id !== this.state.user._id)} size={20} />
                                )}
                                {this.state.conversation.members.length !== 2 && (
                                    <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>{this.state.conversation.title}</Text>
                                )}
                            </APressable>
                            <View style={{width: 50, height: '100%', justifyContent: 'center', alignItems: 'center'}}></View>
                        </View>

                        {/* Input and show users in chat here */}
                        <View pointerEvents='box-none' style={{flex: 1, zIndex: 0, elevation: 0,}}>
                           <View style={[styles.inputsCont,]}>
                                <ScrollView horizontal={true} style={{transform: [{translateY: 15}]}} contentContainerStyle={{flexDirection: 'row', width: '100%', justifyContent: 'flex-start', alignItems: 'flex-end', paddingBottom: 5,}}>
                                    <View style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }}>
                                        <FontAwesomeIcon icon={faEllipsis} size={25} color='white' />
                                    </View>
                                    
                                    {/* For each user in chat */}
                                    {this.state.inChatUsers.map((userID, index) => {
                                        const user = this.state.conversation.members.find(user => user._id === userID);
                                        if (user._id === this.state.user._id) return null;
                                        return (
                                            <anima.View key={index} layout={Layout} entering={ZoomIn} exiting={ZoomOut} style={{marginRight: this.state.usersTyping.includes(user._id)?65:0, height: 40, width: 40, marginLeft: 5, borderRadius: 9999, borderWidth: 5, borderColor: '#BE3331', shadowColor: 'black', shadowOffset: {x: 0, y: 0}, shadowRadius: 2, shadowOpacity: 1 }}>
                                                <APressable onPress={() => {this.props.popupProfile(user)}}>
                                                    <Image source={{uri: user.profilePicture}} style={{height: '100%', width: '100%', resizeMode: 'contain', borderRadius: 9999}} />
                                                </APressable>
                                                {this.state.usersTyping.includes(user._id) && (
                                                <anima.View entering={FadeInLeft} exiting={FadeOutLeft} style={{position: 'absolute', height: 40, width: 60, top: -5, left: 40, justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style={{color: '#a4a4a4', fontSize: 13, }}>typing...</Text>
                                                </anima.View>
                                                )}
                                                
                                            </anima.View>
                                        )
                                    })}
                                </ScrollView>
                                {/* KEYBOARD MAKES THIS VIEW MARGIN BOTTOM 330 from 0 */}
                                <Animated.View style={{width: '100%', height: 70, justifyContent: 'center', alignItems: 'center', marginBottom: this.state.keyboardShiftAnimation.getValue()}}> 
                                    <APressable value={0.50} onPress={this.sendText} style={{height: 40, width: 40, borderRadius: 999, backgroundColor: '#BD3230', position: 'absolute', right: 10, top: 25, zIndex: 3, elevation: 3, justifyContent: 'center', alignItems: 'center'}}>
                                        <FontAwesomeIcon icon={faArrowUp} size={25} color='white' />
                                    </APressable>
                                    <TextInput value={this.state.inputText} onChange={this.setInputText} multiline={true} onContentSizeChange={this.setTextInputHeight} onFocus={() => {this.state.keyboardShiftAnimation.start(); this.state.messageViewAnimated.open();}} onEndEditing={(e) => {this.state.keyboardShiftAnimation.end(); this.state.messageViewAnimated.close(); this.setTextInputHeight()}} placeholder='Send a message' placeholderTextColor='#a4a4a4' style={[styles.textInput, {height: Platform.OS === 'android' ? this.state.inputTextHeight : this.state.inputTextHeight + 30,}]} />
                                </Animated.View>
                            </View> 
                        </View>

                        {/* Editing message menu w/ dark background to press to get out of it */}
                        { this.state.messageOptions && (
                            <anima.View entering={FadeIn} exiting={FadeOut} style={{position: 'absolute', top: 0, left: 0, zIndex: 11, height: Dimensions.get('window').height, width: Dimensions.get('window').width, justifyContent: 'center', alignItems: 'center'}}>
                                {/* Background */}
                                <Pressable onPress={() => {this.setState({messageOptions: false})}} style={{width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.5)'}}></Pressable>
                                {/* Save button for editing message */}
                                {this.state.messageOptionsData.sentBy === this.state.user._id && (
                                    <anima.View entering={ZoomIn} exiting={ZoomOut} style={{width: Dimensions.get('window').width*0.8, height: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                        <APressable onPress={this.saveEdit} style={{paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#4C5287', borderRadius: 25, marginBottom: 5 }}>
                                            <Text style={{color: 'white', fontSize: 15}}>Save edit</Text>
                                        </APressable>
                                    </anima.View>
                                )}
                                
                                {/* Message Preview */}
                                <anima.View entering={ZoomIn} exiting={ZoomOut} style={{zIndex: 1, shadowColor: 'black', shadowRadius: 5, shadowOffset: {width: 2, height: 2}, shadowOpacity: 0.5, marginBottom: -10, maxHeight: Dimensions.get('window').height*0.4, maxWidth: Dimensions.get('window').width*0.8, backgroundColor: this.state.messageOptionsData.sentBy === this.state.user._id ? '#BE3331':'#5F5F5F', borderRadius: 25, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 10}}>
                                    {this.state.messageOptionsData.type === 'text' && (
                                        <TextInput onEndEditing={() => {}} ref={(input) => this.editMessageInput = input} value={this.state.messageOptionsData.content} onChange={this.changeEditMessage} multiline={true} style={{color: 'white', fontSize: 15}}></TextInput>
                                    )}
                                </anima.View>
                                {/* Actual menu bo */}
                                <anima.View entering={ZoomIn} exiting={ZoomOut} style={{zIndex: 0, shadowColor: 'black', shadowRadius: 5, shadowOffset: {width: 2, height: 2}, shadowOpacity: 0.5, height: Dimensions.get('window').height*0.4, width: Dimensions.get('window').width*0.8, backgroundColor: '#323232', borderRadius: 25, alignItems: 'center', justifyContent: 'space-around', padding: 20}}>
                                    <Text style={{color: 'white', fontSize: 20}}>Message Options:</Text>
                                    <APressable onPress={() => this.copyText(this.state.messageOptionsData.content)} style={{width: '80%', height: 50, justifyContent: 'center', alignItems: 'center', shadowColor: 'black', shadowRadius: 5, shadowOffset: {width: 2, height: 2}, shadowOpacity: 0.5, backgroundColor: '#434343', borderRadius: 25}}>
                                        <Text style={{color: 'white', fontSize: 13}}>Copy</Text>
                                    </APressable>
                                    {this.state.messageOptionsData.sentBy === this.state.user._id && (
                                    <APressable onPress={() => {this.editMessageInput.focus()}} style={{width: '80%', height: 50, justifyContent: 'center', alignItems: 'center', shadowColor: 'black', shadowRadius: 5, shadowOffset: {width: 2, height: 2}, shadowOpacity: 0.5, backgroundColor: '#4C5287', borderRadius: 25}}>
                                        <Text style={{color: 'white', fontSize: 13}}>Edit</Text>
                                    </APressable>
                                    )}
                                    {this.state.messageOptionsData.sentBy === this.state.user._id && (
                                    <APressable onPress={() => this.confirmAlert('Are you sure you would like to delete this message?', this.deleteText)} style={{width: '80%', height: 50, justifyContent: 'center', alignItems: 'center', shadowColor: 'black', shadowRadius: 5, shadowOffset: {width: 2, height: 2}, shadowOpacity: 0.5, backgroundColor: '#572A2A', borderRadius: 25}}>
                                        <Text style={{color: 'white', fontSize: 13}}>Delete</Text>
                                    </APressable>
                                    )}
                                    <APressable onPress={() => {this.setState({messageOptions: false})}}  style={{width: '80%', height: 50, justifyContent: 'center', alignItems: 'center',}}>
                                        <Text style={{color: 'white', fontSize: 9}}>Cancel</Text>
                                    </APressable>
                                </anima.View>
                            </anima.View>
                        )}
                        <ConversationMenu
                                ref={this.conversationMenu}
                                conversation={this.state.conversation}
                                user={this.state.user}
                                popupProfile={this.props.popupProfile}
                                updateUser={this.props.updateUser}
                                updateOneConversation={this.updateOneConversation}
                                socketEmit={this.props.socketEmit}
                                />


                    </SafeAreaView>
                    )}
                </ImageBackground>
            </Animated.View>
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
        elevation: 1,
        zIndex: 1,

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
        maxWidth: '100%', // max 70% on pressable parent
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
        position: 'absolute', top: -15, left: 20, color: '#a4a4a4',
    },
});

export default Messaging;