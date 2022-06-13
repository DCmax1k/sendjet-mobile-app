import { faBan, faCheck, faCommentMedical, faComments, faDownLeftAndUpRightToCenter, faEllipsis, faSearch, faUpRightAndDownLeftFromCenter, faUserGroup, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component } from 'react';
import { View, Text, Animated, StyleSheet, ScrollView, Image, Pressable, TextInput, Dimensions } from 'react-native';

import fadeIn from './animations/fadeIn';
import sendData from './sendData';

class DashHome extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      user: props.user,
      conversations: props.conversations,
      userDataFromConversations: [],
      focusedWidget: '',
      searchedFriends: props.user.friends,
      addConversationList: [],
    };

    this.animationSpeed = 200;
    this.fadeInAnimation = new fadeIn(this.animationSpeed);
    this.fadeInAnimation.continue = false;

    this.componentDidMount = this.componentDidMount.bind(this);
    this.fadeOutPage = this.fadeOutPage.bind(this);
    this.selectConvo = this.selectConvo.bind(this);
    this.addConversation = this.addConversation.bind(this);
    this.focusWidget = this.focusWidget.bind(this);

  }

  componentDidMount() {
    this.fadeInAnimation.start();
  }

  fadeOutPage() {
    this.fadeInAnimation.finish();
  }

  selectConvo(user) {
    console.log(user);
  }

  showFriendOptions(friendID) {

  }

  async searchUser(user) {
    const response = await sendData('https://sendjet-app.herokuapp.com/searchuser', {id: user});
    if (response.status !== 'success') return alert('Error searching user');
    return response.user;
  }

  focusWidget(widget) {
    this.fadeInAnimation.finish();
    setTimeout(() => {
      if (this.state.focusedWidget === widget) {
        this.setState({focusedWidget: ''});
        this.fadeInAnimation.start();
        return;
      }
      this.setState({focusedWidget: widget});
      this.fadeInAnimation.start();
    }, this.animationSpeed)
  }

  async addConversation(users) {
    if (users.length === 0) return;
    this.focusWidget('messages');
    let title = 'Group name';
    let subTitle = `${users.length + 1} members`;
    const members = await Promise.all(users.map( async user => {
      if (this.state.user.friends.map(fri => fri._id).includes(user)) {
        return this.state.user.friends.find(friend => friend._id === user);
      } else {
        return await this.searchUser(user);
      }
    }));
    const convoData = {
      title,
      subTitle,
      members: users,
      messages: [],
      dateCreated: Date.now(),
      lastSentBy: this.state.user._id,
      seenBy: [this.state.user._id],
    };
    const response = await sendData('https://sendjet-app.herokuapp.com/messages/createconversation', convoData);
    if (response.status !== 'success') return alert('Error creating conversation');
    convoData.members = [this.state.user, ...members];
    convoData._id = response.convo._id;
    this.setState({conversations: [...this.state.conversations, convoData]});
    this.props.updateConversations(this.state.conversations);
  }

  checkDisplay(widget) {
    return this.state.focusedWidget===widget?'flex':this.state.focusedWidget===''?'flex':'none';
  }
  checkMaxHeight(widget) {
    return this.state.focusedWidget===widget?'100%':this.state.focusedWidget===''?260:0
  }
  checkHiddenHeight(widget) {
    return this.state.focusedWidget===widget?'100%':0;
  }
  checkHiddenDisplay(widget) {
    return this.state.focusedWidget===widget?'flex':'none';
  }
  addFriendToAddConversationList(friend) {
    if (this.state.addConversationList.includes(friend)) {
      this.setState({addConversationList: this.state.addConversationList.filter(f => f._id !== friend._id)});
      return;
    }
    this.setState({addConversationList: [...this.state.addConversationList, friend]});
  }
  searchFriends(query) {

  }
  async unaddFriend(friendID) {
    const response = await sendData('https://sendjet-app.herokuapp.com/search/unadduser', { id: friendID });
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
  async acceptFriendRequest(friendID) {
    if (this.state.user.friendRequests.length === 1) this.focusWidget('');
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
  async declineFriendRequest(friendID) {
    if (this.state.user.friendRequests.length === 1) this.focusWidget('');
    const response = await sendData('https://sendjet-app.herokuapp.com/search/declinefriendrequest', {id: friendID});
    if (response.status !== 'success') return alert('Error declining friend request');
    this.props.updateUser({
      ...this.state.user,
      friendRequests: this.state.user.friendRequests.filter(f => f._id !== friendID),
    })
    this.setState({
      user: {
        ...this.state.user,
        friendRequests: this.state.user.friendRequests.filter(f => f._id !== friendID),
      }
    });
  }

  render() {
    return (
      <Animated.View style={{opacity: this.fadeInAnimation.value, flexDirection: 'column', alignItems: 'center', height: '100%'}}>
        <ScrollView scrollEnabled={this.state.focusedWidget?false:true} style={{width: '100%'}} contentContainerStyle={{justifyContent: 'flex-start', alignItems: 'center', height: '67%'}}>

          {/* FRIEND REQUESTS - Only shown if friend requests */}
          {this.state.user.friendRequests.length !== 0 && (
          <View style={[styles.friendRequestCont, {display: this.checkDisplay('friendrequest'), height: this.state.focusedWidget==='friendrequest'?'100%':50}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: this.state.focusedWidget==='friendrequest'?10:0}}>
              <Text style={{fontSize: 15, color: 'white'}}>You have {this.state.user.friendRequests.length} friend request{this.state.user.friendRequests.length===1?'':'s'}</Text>
              <Pressable onPress={() => this.focusWidget('friendrequest')} style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: '50%'}}>
                <FontAwesomeIcon icon={this.state.focusedWidget==='friendrequest'?faDownLeftAndUpRightToCenter:faUpRightAndDownLeftFromCenter} size={20} color="#fff" />
              </Pressable>
            </View>
            {this.state.focusedWidget === 'friendrequest' && (
              <ScrollView contentContainerStyle={{width: '100%'}}>
                {this.state.user.friendRequests.map((friend, i) => {
                  return (
                    <View key={i} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 10}}>
                      <Image source={{uri: friend.profilePicture}} style={{width: 40, height: 40, borderRadius: 999}} />
                      <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={{fontSize: 15, color: 'white'}}>{friend.firstName}</Text>
                        <Text style={{fontSize: 12, color: 'white'}}>{friend.lastName}</Text>
                      </View>
                      <View style={{flexDirection: 'row', width: 100, height: '100%', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Pressable onPress={() => {this.acceptFriendRequest(friend._id)}} style={{width: '45%', height: '100%', backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center', borderRadius: 999}}>
                          <FontAwesomeIcon icon={faCheck} size={20} color="#fff" />
                        </Pressable>
                        <Pressable onPress={() => {this.declineFriendRequest(friend._id)}} style={{width: '45%', height: '100%', backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center', borderRadius: 999}}>
                          <FontAwesomeIcon icon={faBan} size={20} color="#fff" />
                        </Pressable>
                      </View>

                    </View>
                  )
                })}
              </ScrollView>
            )}
          </View>
          )}

          {/* DUO WIDGET */}
          <View style={[styles.duoCont, {maxHeight: this.checkMaxHeight('duo'), display: this.checkDisplay('duo')}]}>
            <Pressable onPress={() => {this.focusWidget('addconversation')}} style={styles.duo}>
              <FontAwesomeIcon icon={faCommentMedical} size={30} color="#fff" />
              <Text style={{textAlign: 'center', color: '#fff', marginTop: 15,}}>Create{'\n'}Conversation</Text>
            </Pressable>
            <Pressable onPress={() => {this.props.animateSetDashPage('search')}} style={styles.duo}>
              <FontAwesomeIcon icon={faUserPlus} size={30} color="#fff" />
              <Text style={{textAlign: 'center', color: '#fff', marginTop: 15,}}>Add{'\n'}Friend</Text>
            </Pressable>
          </View>

          {/* ADD CONVERSATION WIDGET - ONLY VISIBLE WHEN FOCUSED*/}
          <View style={[styles.addConvoCont, {height: this.checkHiddenHeight('addconversation'), display: this.checkHiddenDisplay('addconversation')}]}>
            <View style={styles.messagesHeader}>
              <FontAwesomeIcon icon={faCommentMedical} size={25} color="#fff" />
              <Text style={{flex: 1, color: '#a4a4a4', fontSize: 15, marginLeft: 10}}>Add conversation</Text>
              <Pressable onPress={() => this.focusWidget('')} style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: '50%'}}>
                <FontAwesomeIcon icon={faDownLeftAndUpRightToCenter} size={20} color="#fff" />
              </Pressable>
            </View>
            <View style={[styles.searchInputCont, {marginBottom: 20}]}>
                <TextInput style={styles.searchInput} placeholder="Search friends" placeholderTextColor='#a4a4a4' onChange={(e) => this.searchFriends(e.nativeEvent.text)} />
                <Pressable style={styles.searchBtn}>
                    <FontAwesomeIcon icon={faSearch} size={20} color="#a4a4a4" />
                </Pressable>
            </View>
            <ScrollView>
              {this.state.searchedFriends.map((user, i) => {
                return (
                  <Pressable key={i} onPress={() => {this.addFriendToAddConversationList(user._id)}} style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 5, padding: 15, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 50}} >
                    <View style={{height: 20, width: 20, borderWidth: 2, borderColor: '#a4a4a4', borderRadius: 999, marginRight: 20, backgroundColor: this.state.addConversationList.includes(user._id)?'#3faeff':'transparent'}}></View>
                    <Image source={{uri: user.profilePicture}} style={{height: 40, width: 40, resizeMode: 'contain', borderRadius: 99999, marginRight: 10,}} />
                    <View>
                      <Text style={{color: '#a4a4a4', fontSize: 15}}>{user.firstName}</Text>
                      <Text style={{color: '#a4a4a4', fontSize: 15}}>{user.lastName}</Text>
                    </View>
                  </Pressable>
                )
              })}
            </ScrollView>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{color: '#a4a4a4', fontSize: 15, marginBottom: 2}}>{this.state.addConversationList.length} friends selected</Text>
              <Pressable onPress={() => {this.addConversation(this.state.addConversationList)}} disabled={this.state.addConversationList.length !== 0?false:true} style={{opacity:this.state.addConversationList.length !== 0?1:0.5, width: '80%', height: 50, backgroundColor: 'rgba(186,43,43,.5)', borderRadius: 999, justifyContent: 'center', alignItems: 'center', marginBottom: 2,}}>
                <Text style={{color: '#fff', fontSize: 15, fontWeight: 'bold'}}>Add conversation</Text>
              </Pressable>
            </View>
          </View>

          {/* MESSAGES WIDGET */}
          <View style={[styles.recentMessagesCont, {maxHeight: this.checkMaxHeight('messages'), display: this.checkDisplay('messages')}]}>
            <View style={styles.messagesHeader}>
              <FontAwesomeIcon icon={faComments} size={25} color="#fff" />
              <Text style={{flex: 1, color: '#a4a4a4', fontSize: 15, marginLeft: 10}}>Conversations</Text>
              <Pressable onPress={() => this.focusWidget('messages')} style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: '50%'}}>
                <FontAwesomeIcon icon={this.state.focusedWidget==='messages'?faDownLeftAndUpRightToCenter:faUpRightAndDownLeftFromCenter} size={20} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={styles.messagesScrollView}>
              {this.state.conversations.length === 0 && (
                <View style={styles.noMessages}>
                  <Text style={{color: '#a4a4a4', fontSize: 17}}>No conversations yet</Text>
                </View>
              )}
              
              {this.state.conversations.map((convo, index) => {
                return (
                  <Conversation key={index} conversation={convo} selectConvo={this.selectConvo} user={this.state.user} />
                )
              })}

            </ScrollView>
          </View>

          {/* FRIENDS WIDGET */}
          <View style={[styles.friendsCont, {maxHeight: this.checkMaxHeight('friends'), display: this.checkDisplay('friends')}]}>
            <View style={[styles.messagesHeader, {height: 30, marginTop: 10}]}>
              <FontAwesomeIcon icon={faUserGroup} size={25} color="#fff" />
              <Text style={{flex: 1, color: '#a4a4a4', fontSize: 15, marginLeft: 10}}>My friends:</Text>
              <Pressable onPress={() => this.focusWidget('friends')} style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: '50%', marginTop: 10,}}>
                <FontAwesomeIcon icon={this.state.focusedWidget==='friends'?faDownLeftAndUpRightToCenter:faUpRightAndDownLeftFromCenter} size={20} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={styles.friendsScrollView} contentContainerStyle={{justifyContent: 'flex-start', alignItems: 'flex-start',}}>
              {this.state.user.friends.length === 0 && (
                <View style={styles.noMessages}>
                  <Text style={{color: '#a4a4a4', fontSize: 17}}>No friends added yet</Text>
                </View>
              )}
              {this.state.user.friends.map((friend, index) => {
                return (
                  <View key={index} style={{height: 70, width: '100%', marginBottom: 5,}}>
                    <View style={styles.friendCont}>
                      <Image style={{height: 45, width: 45, borderRadius: 25,}} source={{uri: friend.profilePicture}} />
                      <View style={styles.friendName}>
                        <Text style={{color: '#a4a4a4', fontSize: 14, marginTop: 5,}}>{friend.firstName}</Text>
                        <Text style={{color: '#a4a4a4', fontSize: 14}}>{friend.lastName}</Text>
                      </View>
                      <View style={styles.friendBtns}>
                        <Pressable onPress={() => this.showFriendOptions(friend._id)}>
                          <FontAwesomeIcon icon={faEllipsis} size={25} color="#fff" />
                        </Pressable>
                      </View>

                    </View>
                  </View>
                  
                )
              })}
            </ScrollView>
          </View> 

        </ScrollView>

        

      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  recentMessagesCont: {
    width: '93%',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingLeft: 10,
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
    width: '60%',
  },
  messageCont3: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '20%',
  },
  messageOnlineStatus: {
    height: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageOnlineStatusOnline: {
    backgroundColor: '#00ce52',
    borderRadius: '50%',
    width: 10,
    height: 10,

  },
  conversationTitle: {
    width: '100%',
    overflow: 'hidden',
    height: 30,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  noMessages: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  friendsCont: {
    width: '93%',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  friendsScrollView: {
    width: '100%',
    borderwidth: 5,
    borderColor: '#c4c4c4',
  },
  friendCont: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
  },
  friendName: {
    height: 100,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginLeft: 10,
  },
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
  duoCont: {
    height: 150,
    width: '93%',
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  duo: {
    width: '48%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addConvoCont: {
    width: '93%',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
    paddingTop: 10,
  },
  friendRequestCont: {
    width: '93%',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingLeft: 20,
    paddingRight: 10,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',

  }

});

function Conversation({conversation, selectConvo, user}) {
  let biConvo = conversation.members.length===2?true:false;
  let otherPerson = null;
  if (biConvo) {
    otherPerson = conversation.members.find(member => member._id !== user._id);
  }

  return (
    <Pressable onPress={() => selectConvo(conversation._id)} style={styles.messageCont}>
      <View style={styles.messageCont1}>
        <Image source={ biConvo?{uri: otherPerson.profilePicture}:require('../assets/roundIcon.png')} style={{height: 40, width: 40, resizeMode: 'contain', borderRadius: 20}} />
        <View style={[styles.messageOnlineStatus]}>
          <View style={styles.messageOnlineStatusOnline}></View>
        </View>
      </View>
      <View style={styles.messageCont2}>
        <View style={styles.conversationTitle}>
          <FormatUsername user={otherPerson} />
        </View>
        <Text style={{color: '#838383'}}>{otherPerson.firstName + ' ' + otherPerson.lastName}</Text>
      </View>
      <View style={styles.messageCont3}>

      </View>
    </Pressable>
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

export default DashHome;