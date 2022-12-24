import { faArrowLeft, faArrowUp, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component } from 'react';
import {View, Text, SafeAreaView, Platform, Image, Dimensions, StyleSheet, ScrollView, Animated, Alert, TextInput} from 'react-native';
import anim, {SlideOutDown, SlideInDown } from 'react-native-reanimated';

import APressable from './APressable';
import FormatUsername from './FormatUsername';
import OptionsMenu from './OptionsMenu';
import sendData from './sendData';

class OptionButton {
    constructor(title, color, cb) {
        this.title = title;
        this.color = color;
        this.cb = cb;
    }
}

class ConversationMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            user: this.props.user || {},
            conversation: this.props.conversation || {},
            optionsMenu: false,
            pinTitle: 'Pin Conversation',
        };

        this.closeMenu = this.closeMenu.bind(this);
        this.setConvo = this.setConvo.bind(this);
        this.threeEllipse = this.threeEllipse.bind(this);
        this.selectGroupName = this.selectGroupName.bind(this);
        this.addUser = this.addUser.bind(this);
        this.changeGroupName = this.changeGroupName.bind(this);
        this.pinConversation = this.pinConversation.bind(this);
        this.leaveConversation = this.leaveConversation.bind(this);
        this.reportUser = this.reportUser.bind(this);
        this.blockUser = this.blockUser.bind(this);

        this.groupNameInputRef = React.createRef();
        

    }
    // OptionsMenuFunctions
    addUser() {
        console.log('add user');
    }
    async changeGroupName(newTitle) {
        try {
            const message = {
                type: 'changedgroupname',
                content: newTitle,
                date: Date.now(),
                sentBy: this.state.user._id,
                edited: false,
            };
            const conversation = this.state.conversation;
            conversation.title = newTitle;
            conversation.messages.push(message);
            this.setState({conversation});
            this.props.updateOneConversation(conversation);
            await sendData('https://sendjet-server.glitch.me/messages/changegroupname', {conversationID: this.state.conversation._id, newTitle});
            this.props.socketEmit('sendMessage', {conversationID: this.state.conversation._id, message, members: this.state.conversation.members.map(guy => guy._id)});
        } catch(err) {
            console.error(err);
        }
        
    }
    selectGroupName() {
        this.threeEllipse();
        this.groupNameInputRef.current.focus();
    }
    pinConversation() {
        const user = this.state.user;
        const conversation = this.state.conversation;
        if (!user.pinnedConversations.includes(conversation._id)) {
            user.pinnedConversations.push(conversation._id);
            this.setState({user})
            this.props.updateUser(user, false);
            sendData('https://sendjet-server.glitch.me/messages/pinconversation', {conversationID: conversation._id});
        } else {
            user.pinnedConversations.splice(user.pinnedConversations.indexOf(conversation._id), 1);
            this.setState({user})
            this.props.updateUser(user, false);
            sendData('https://sendjet-server.glitch.me/messages/unpinconversation', {conversationID: conversation._id});
        }
    }
    leaveConversation() {
        console.log('leave converastion');
    }
    reportUser() {
        console.log('reporting user');
    }
    blockUser() {
        console.log('blocking');
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

    setConvo(convo) {
        this.setState({
            conversation: convo,
        })
    }

    openMenu() {
        this.setState({
            isOpen: true,

        })
    }

    closeMenu() {
        this.setState({
            isOpen: false,
            positionFromTop: 0,
        })
    }

    threeEllipse() {
        this.checkPinTitle();
        this.setState({
            optionsMenu: !this.state.optionsMenu,
        });
    }
    checkPinTitle() {
        if (this.state.user.pinnedConversations.includes(this.state.conversation._id) && this.state.pinTitle != 'Unpin Conversation') {
            this.setState({
                pinTitle: 'Unpin Conversation',
            });
        } else if (!this.state.user.pinnedConversations.includes(this.state.conversation._id) && this.state.pinTitle != 'Pin Conversation') {
            this.setState({
                pinTitle: 'Pin Conversation',
            });
        }
    }
    

    render() {
        if (!this.state.isOpen) return <View></View>;
        // Group message options
        const button1 = new OptionButton('Add User', '#ECECEC', this.addUser); 
        const button2 = new OptionButton('Change Group Name', '#ECECEC', this.selectGroupName); 
        const button3 = new OptionButton(this.state.pinTitle, '#ECECEC', this.pinConversation); 
        const button4 = new OptionButton('Leave Conversation', '#C11D1D', this.leaveConversation); 
        const groupMessageOptions = [button1, button2, button3, button4];
        // Private message options
        const button01 = new OptionButton(this.state.pinTitle, '#ECECEC', this.pinConversation);
        const button02 = new OptionButton('Report', '#C11D1D', this.reportUser); 
        const button03 = new OptionButton('Block', '#C11D1D', this.blockUser); 
        const privateMessageOptions = [button01, button02, button03];
        
        const biConvo = this.state.conversation.members.length==2;
        const otherPerson = this.state.conversation.members.find(u => u._id !== this.state.user._id);
        return (
            <anim.View entering={SlideInDown} exiting={SlideOutDown} style={{zIndex: 12, height: Dimensions.get('window').height, width: Dimensions.get('window').width, position: 'absolute', top: 0, left: 0}}>
                <View style={{height: '100%', width: '100%', backgroundColor: '#270E23', flexDirection: 'column', alignItems: 'center', paddingTop: Platform.OS === 'ios'?50:0}}>
                        {/* Absolute pos top buttons */}
                        <View style={{width: '100%', height: 50}}>
                            <APressable onPress={this.closeMenu} style={{backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 9999, height: 50, width: 50, position: 'absolute', top: 0, left: 20, justifyContent: 'center', alignItems: 'center'}}>
                                <FontAwesomeIcon icon={faArrowLeft} size={20} color='#a4a4a4' />
                            </APressable>
                            <APressable onPress={this.threeEllipse} style={{backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 9999, height: 50, width: 50, position: 'absolute', top: 0, right: 20, justifyContent: 'center', alignItems: 'center'}}>
                                <FontAwesomeIcon icon={faEllipsis} size={20} color='#a4a4a4' />
                            </APressable>
                        </View>

                        <View style={{position: 'absolute', top: 100, left: 0, width: Dimensions.get('window').width, zIndex: 10, alignItems: 'center'}} pointerEvents='box-none'>
                            {this.state.optionsMenu ? <OptionsMenu closeMenu={this.threeEllipse} buttons={ biConvo ? privateMessageOptions : groupMessageOptions} /> : null} 
                        </View>

                            {/* Main content in scroll view */}
                            <ScrollView>
                                {/* Group name/photo */}
                            <View style={{alignItems: 'center'}}>
                                <Image source={ biConvo?{uri: otherPerson.profilePicture}:require('../assets/groupChat.png')} style={{marginBottom: 20, height: Dimensions.get('window').width/3, width: Dimensions.get('window').width/3, resizeMode: 'contain', borderRadius: 999999}} />
                                    {!biConvo ? (
                                        <TextInput ref={this.groupNameInputRef} onChangeText={(e) => { this.setState({conversation: {...this.state.conversation, title: e}}) }} onEndEditing={(e) => {this.changeGroupName(e.nativeEvent.text)}} style={{color: 'white', fontSize: 20}} value={this.state.conversation.title} />

                                    ) : (
                                        <FormatUsername size={25} user={otherPerson} />
                                    )}
                            </View>

                            {/* WIDGETS BELOW */}

                            {/* Members widget if group chat */}
                            {!biConvo && (
                            <View style={[styles.widget, {flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'}]} >
                                <Text style={{color: '#B9B9B9'}}>{this.state.conversation.members.length} member{this.state.conversation.members.length!== 1?'s':''}</Text>
                                {/* Loop through members here */}
                                {this.state.conversation.members.map((member, i) => {
                                    return (
                                        <APressable key={i} style={{height: 60, width: '100%'}} value={0.95} onPress={() => {member._id != this.state.user._id ? this.props.popupProfile(member):null}}>
                                            <View style={{height: '100%', width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                                                <Image source={{uri: member.profilePicture}} style={{height: 40, width: 40, marginRight: 15, borderRadius: 50}} />
                                                <FormatUsername size={15} user={member} />
                                            </View>
                                        </APressable>
                                    )
                                })}
                            </View> 
                            )}

                                {/* Photos */}
                            <View style={[styles.widget, {}]}>
                                <Text style={{color: '#FFFFFF'}}>Photos</Text>
                            </View>

                            {/* Attachments */}
                            <View style={[styles.widget, {}]}>
                                <Text style={{color: '#FFFFFF'}}>Attachments</Text>
                            </View>
                        
                        </ScrollView>
                        
                </View>
            </anim.View>
        )
    }
}

const styles = StyleSheet.create({
    widget: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 30,
        width: Dimensions.get('window').width*0.8,
        marginTop: 25,
        padding: 10,
    }
});

export default ConversationMenu;