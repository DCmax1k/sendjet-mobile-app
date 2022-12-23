import { faBan, faCheck, faCommentMedical, faComments, faDownLeftAndUpRightToCenter, faEllipsis, faHandPointer, faSearch, faThumbtack, faTimes, faUpRightAndDownLeftFromCenter, faUserGroup, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component } from 'react';
import { View, Text, Animated, StyleSheet, ScrollView, Image, Pressable, TextInput, RefreshControl, Alert, Dimensions, AppState } from 'react-native';

import fadeIn from './animations/fadeIn';
import sendData from './sendData';
import FormatUsername from './FormatUsername';
import formatLastOnline from './utils/formatLastOnline';
import searchUser from './utils/searchUser';
import APressable from './APressable';
import ConversationMenu from './ConversationMenu';

class DashHome extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      appState: 'active',
      user: props.user,
      conversations: props.conversations,
      userDataFromConversations: [],
      focusedWidget: '',
      searchedFriends: props.user.friends,
      addConversationList: [],
      refreshing: false,
      conversationRefs: [],
    };

    this.animationSpeed = 200;
    this.fadeInAnimation = new fadeIn(this.animationSpeed);
    this.fadeInAnimation.continue = false;

    this.componentDidMount = this.componentDidMount.bind(this);
    this.fadeOutPage = this.fadeOutPage.bind(this);
    this.selectConvo = this.selectConvo.bind(this);
    this.addConversation = this.addConversation.bind(this);
    this.focusWidget = this.focusWidget.bind(this);
    this.handleAppState = this.handleAppState.bind(this);

    this.refreshApp = this.refreshApp.bind(this);

  }

  componentDidMount() {
    this.fadeInAnimation.start();
    // Listen for app status changes to refresh the app when reopened.
    AppState.addEventListener('change', this.handleAppState);
  }
  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppState);
  }

  handleAppState(state) {
    if ((this.state.appState === 'background' || 'inactive') && state === 'active') {
      this.refreshApp();
    }
    this.setState({
      appState: state,
    });
  }

  setUser(user) {
    this.setState({ user });
  }
  setConversations(conversations) {
    this.setState({conversations});
  }

  fadeOutPage() {
    this.fadeInAnimation.finish();
  }

  selectConvo(convo) {
    this.props.openConversation(convo);
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
        return await searchUser(user);
      }
    }));
    const convoData = {
      _id: null,
      title,
      subTitle,
      members: users,
      messages: [],
      dateCreated: Date.now(),
      lastSentBy: this.state.user._id,
      seenBy: [this.state.user._id],
    };
    const response = await sendData('https://sendjet-server.glitch.me/messages/createconversation', convoData);
    if (response.status !== 'success') return alert('Error creating conversation');
    convoData.members = [this.state.user, ...members];
    convoData._id = response.convo._id;
    if (response.message === 'Conversation already exists') return;
    this.setState({conversations: [...this.state.conversations, convoData]});
    this.props.updateConversations(this.state.conversations);
    this.props.socketEmit('addConversation', { convoData, userID: this.state.user._id });

  }

  checkDisplay(widget) {
    return this.state.focusedWidget===widget?'flex':this.state.focusedWidget===''?'flex':'none';
  }
  checkMaxHeight(widget) {
    return this.state.focusedWidget===widget?'100%':this.state.focusedWidget===''?210:0
  }
  checkHiddenHeight(widget) {
    return this.state.focusedWidget===widget?'100%':0;
  }
  checkHiddenDisplay(widget) {
    return this.state.focusedWidget===widget?'flex':'none';
  }
  addFriendToAddConversationList(friendID) {
    if (this.state.addConversationList.includes(friendID)) {
      this.setState({addConversationList: this.state.addConversationList.filter(f => f !== friendID)});
      return;
    }
    this.setState({addConversationList: [...this.state.addConversationList, friendID]});
  }
  searchFriends(query) {
    if (query.length === 0) {
      this.setState({searchedFriends: this.state.user.friends});
      return;
    } else {
      const searchedFriendsByUsername = this.state.user.friends.filter(friend => friend.username.toLowerCase().includes(query.toLowerCase()));
      const searchedFriendsByfirstName = this.state.user.friends.filter(friend => friend.firstName.toLowerCase().includes(query.toLowerCase()));
      const searchedFriendsBylastName = this.state.user.friends.filter(friend => friend.lastName.toLowerCase().includes(query.toLowerCase()));
      const searchedFriends = [...searchedFriendsByUsername, ...searchedFriendsByfirstName, ...searchedFriendsBylastName];
      const searchedFriendsNoDuplicates = [];
      searchedFriends.forEach(friend => {
        if (!searchedFriendsNoDuplicates.map(guy => guy._id).includes(friend._id)) {
          searchedFriendsNoDuplicates.push(friend);
        }
      }
      );

      this.setState({searchedFriends: searchedFriendsNoDuplicates});
    }
  }
  async unaddFriend(friend) {
    this.setState({
      user: {
          ...this.state.user,
          addRequests: this.state.user.addRequests.filter(u => u._id !== friend._id),
          friends: this.state.user.friends.filter(u => u._id !== friend._id),
      },
  });
    const response = await sendData('https://sendjet-server.glitch.me/search/unadduser', { id: friend._id });
    if (response.status !== 'success') return alert('Error removing user');
    this.props.socketEmit('unadduser', { user: this.state.user, unadding: user });
    this.props.updateUser({
        ...this.state.user,
        addRequests: this.state.user.addRequests,
        friends: this.state.user.friends,
    });
  }
  async acceptFriendRequest(friend) {
    const conversationAlready = this.state.conversations.map(c => c.members.map(m => m._id).includes(friend._id)).includes(true);
    this.setState({
      user: {
        ...this.state.user,
        friendRequests: this.state.user.friendRequests.filter(f => f._id !== friend._id),
        friends: [...this.state.user.friends, friend],
      },
    });
    
    if (this.state.user.friendRequests.length === 1) this.focusWidget('');
    const response = await sendData('https://sendjet-server.glitch.me/search/acceptfriendrequest', {id: friend._id});
    if (response.status !== 'success') return alert('Error accepting friend request');
    this.props.updateUser({
      ...this.state.user,
      friendRequests: this.state.user.friendRequests,
      friends: this.state.user.friends,
    });
    let convoData = {_id: null};
    if (!conversationAlready) {
      convoData = {
        _id: response.convo._id,
        title: friend.username,
        subTitle: friend.firstName + ' ' + friend.lastName,
        members: [this.state.user, friend],
        messages: [],
        dateCreated: Date.now(),
        lastSentBy: this.state.user._id,
        seenBy: [this.state.user._id],
      };

      this.props.updateConversations([...this.state.conversations, convoData]);
    }
    this.props.socketEmit('acceptfriendrequest', { user: this.state.user, friend, convoID:  convoData._id});
  }
  async declineFriendRequest(friend) {
    this.setState({
      user: {
        ...this.state.user,
        friendRequests: this.state.user.friendRequests.filter(f => f._id !== friend._id),
      }
    });
    if (this.state.user.friendRequests.length === 1) this.focusWidget('');
    const response = await sendData('https://sendjet-server.glitch.me/search/declinefriendrequest', {id: friend._id});
    if (response.status !== 'success') return alert('Error declining friend request');
    this.props.socketEmit('declinefriendrequest', { user: this.state.user, friend, });
    this.props.updateUser({
      ...this.state.user,
      friendRequests: this.state.user.friendRequests,
    })
  }

  async refreshApp() {
    this.setState({refreshing: true});
    const response = await sendData('https://sendjet-server.glitch.me/dashboard', {});
    if (response.status !== 'success') return alert('Error refreshing app');
    let conversations = response.conversations;
    if (!conversations) conversations = [];

    this.props.updateUser(response.user);
    this.props.updateConversations(conversations);
    this.setState({
      user: response.user,
      conversations: conversations,
      userDataFromConversations: [],
      focusedWidget: '',
      searchedFriends: response.user.friends,
      addConversationList: [],
      refreshing: false,
    });
    this.props.socketEmit('joinUserRoom', {...this.state.user});
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

  openConvoMenu(convo) {
    this.props.openConversationMenu(convo);
  }

  render() {
    //const pinnedConversations = this.state.conversations.filter(conversation => this.state.user.pinnedConversations.includes(conversation._id)).sort((a, b) => this.state.conversations.indexOf(a._id) - this.state.conversations.indexOf(b._id));
    const pinnedConversations = this.state.user.pinnedConversations.map(id => this.state.conversations.find(conversation => conversation._id === id));
    const notPinnedConversations = this.state.conversations.filter(conversation => !this.state.user.pinnedConversations.includes(conversation._id)).sort((a, b) => new Date(b.dateActive).getTime() - new Date(a.dateActive).getTime());
    const sortedConversations = [...pinnedConversations, ...notPinnedConversations];
    return (
      <Animated.View style={{opacity: this.fadeInAnimation.value, flexDirection: 'column', alignItems: 'center', height: Dimensions.get('window').height*.7}}>
        <ScrollView refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this.refreshApp} />} scrollEnabled={this.state.focusedWidget?false:true} style={{width: '100%'}} contentContainerStyle={{justifyContent: 'flex-start', alignItems: 'center'}}>

          {/* FRIEND REQUESTS - Only shown if friend requests */}
          {this.state.user.friendRequests.length !== 0 && (
          <APressable onPress={() => this.focusWidget('friendrequest')} style={[styles.friendRequestCont, {display: this.checkDisplay('friendrequest'), height: this.state.focusedWidget==='friendrequest'?'100%':50}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: this.state.focusedWidget==='friendrequest'?10:0}}>
              <Text style={{fontSize: 15, color: 'white'}}>You have {this.state.user.friendRequests.length} friend request{this.state.user.friendRequests.length===1?'':'s'}</Text>
              <View style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 99999}}>
                <FontAwesomeIcon icon={this.state.focusedWidget==='friendrequest'?faTimes:faHandPointer} size={20} color="#fff" />
              </View>
            </View>
            {this.state.focusedWidget === 'friendrequest' && (
              <ScrollView contentContainerStyle={{width: '100%'}}>
                {this.state.user.friendRequests.map((friend, i) => {
                  return (
                    <APressable onPress={() => this.props.popupProfile(friend)} key={i} style={{width: '100%', padding: 10}}>
                      <View style={{width: '100%', height: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                      <Image source={{uri: friend.profilePicture}} style={{width: 40, height: 40, borderRadius: 999}} />
                      <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={{fontSize: 15, color: 'white'}}>{friend.firstName}</Text>
                        <Text style={{fontSize: 12, color: 'white'}}>{friend.lastName}</Text>
                      </View>
                      <View style={{flexDirection: 'row', width: 100, height: '100%', justifyContent: 'space-between', alignItems: 'center'}}>
                        <APressable onPress={() => {this.acceptFriendRequest(friend)}} style={{width: '45%', height: '100%', backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center', borderRadius: 999}}>
                          <FontAwesomeIcon icon={faCheck} size={20} color="#fff" />
                        </APressable>
                        <APressable onPress={() => {this.declineFriendRequest(friend)}} style={{width: '45%', height: '100%', backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center', borderRadius: 999}}>
                          <FontAwesomeIcon icon={faBan} size={20} color="#fff" />
                        </APressable>
                      </View>
                      </View>
                    </APressable>
                  )
                })}
              </ScrollView>
            )}
          </APressable>
          )}

          {/* DUO WIDGET */}
          <View style={[styles.duoCont, {maxHeight: this.checkMaxHeight('duo'), display: this.checkDisplay('duo')}]}>
            <APressable onPress={() => {this.focusWidget('addconversation')}} style={styles.duo}>
              <FontAwesomeIcon icon={faCommentMedical} size={30} color="#fff" />
              <Text style={{textAlign: 'center', color: '#fff', marginTop: 15,}}>Create{'\n'}Conversation</Text>
            </APressable>
            <APressable onPress={() => {this.props.animateSetDashPage('search')}} style={styles.duo}>
              <FontAwesomeIcon icon={faUserPlus} size={30} color="#fff" />
              <Text style={{textAlign: 'center', color: '#fff', marginTop: 15,}}>Add{'\n'}Friend</Text>
            </APressable>
          </View>

          {/* ADD CONVERSATION WIDGET - ONLY VISIBLE WHEN FOCUSED*/}
          <View style={[styles.addConvoCont, {height: this.checkHiddenHeight('addconversation'), display: this.checkHiddenDisplay('addconversation')}]}>
            <View style={styles.messagesHeader}>
              <FontAwesomeIcon icon={faCommentMedical} size={25} color="#fff" />
              <Text style={{flex: 1, color: '#a4a4a4', fontSize: 15, marginLeft: 10}}>Add conversation</Text>
              <APressable onPress={() => this.focusWidget('')} style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 999999,}}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#fff" />
              </APressable>
            </View>
            <View style={[styles.searchInputCont, {marginBottom: 20}]}>
                <TextInput style={styles.searchInput} placeholder="Search friends" placeholderTextColor='#a4a4a4' onChange={(e) => this.searchFriends(e.nativeEvent.text)} />
                <APressable style={styles.searchBtn}>
                    <FontAwesomeIcon icon={faSearch} size={20} color="#a4a4a4" />
                </APressable>
            </View>
            <ScrollView>
              {this.state.searchedFriends.map((user, i) => {
                return (
                  <APressable key={i} onPress={() => {this.addFriendToAddConversationList(user._id)}} style={{height: 70, marginBottom: 5, padding: 15, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 50}} >
                    <View style={{height: '100%', width: '100%', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
                      <View style={{height: 20, width: 20, borderWidth: 2, borderColor: '#a4a4a4', borderRadius: 999, marginRight: 20, backgroundColor: this.state.addConversationList.includes(user._id)?'#3faeff':'transparent'}}></View>
                      <Image source={{uri: user.profilePicture}} style={{height: 40, width: 40, resizeMode: 'contain', borderRadius: 99999, marginRight: 10,}} />
                      <View>
                        <Text style={{color: '#a4a4a4', fontSize: 15}}>{user.firstName}</Text>
                        <Text style={{color: '#a4a4a4', fontSize: 15}}>{user.lastName}</Text>
                      </View>
                    </View>
                  </APressable>
                )
              })}
            </ScrollView>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{color: '#a4a4a4', fontSize: 15, marginBottom: 2}}>{this.state.addConversationList.length} friends selected</Text>
              <APressable onPress={() => {this.addConversation(this.state.addConversationList)}} disabled={this.state.addConversationList.length !== 0?false:true} style={{opacity:this.state.addConversationList.length !== 0?1:0.5, width: '80%', height: 50, backgroundColor: 'rgba(186,43,43,.5)', borderRadius: 999, justifyContent: 'center', alignItems: 'center', marginBottom: 2,}}>
                <Text style={{color: '#fff', fontSize: 15, fontWeight: 'bold'}}>Add conversation</Text>
              </APressable>
            </View>
          </View>

          {/* MESSAGES WIDGET */}
          <APressable onPress={() => this.focusWidget('messages')} style={[styles.recentMessagesCont, {maxHeight: this.checkMaxHeight('messages'), display: this.checkDisplay('messages')}]}>
            <View style={styles.messagesHeader}>
              <FontAwesomeIcon icon={faComments} size={25} color="#fff" />
              <Text style={{flex: 1, color: '#a4a4a4', fontSize: 15, marginLeft: 10}}>Conversations</Text>
              <View style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 999999,}}>
                <FontAwesomeIcon icon={this.state.focusedWidget==='messages'?faTimes:faHandPointer} size={20} color="#fff" />
              </View>
            </View>
            <ScrollView scrollEnabled={this.state.focusedWidget === 'messages'?true:false} style={styles.messagesScrollView}>
              {this.state.conversations.length === 0 && (
                <View style={styles.noMessages}>
                  <Text style={{color: '#a4a4a4', fontSize: 17}}>No conversations yet</Text>
                </View>
              )}
              
              { sortedConversations.map((conversation, index) => {
                let biConvo = conversation.members.length===2?true:false;
                let otherPerson = null;
                if (biConvo) {
                  otherPerson = conversation.members.find(member => member._id !== this.state.user._id);
                }
              
                return (
                  <APressable key={index} onLongPress={() => {this.openConvoMenu(conversation)}} onPress={() => this.selectConvo(conversation)} style={styles.messageContCont}>
                    <View style={styles.messageCont}>
                      <APressable style={styles.messageCont1} onPress={() => {this.openConvoMenu(conversation)}}>
                        <View style={{height: 40, width: 40}}>
                          <Image source={ biConvo?{uri: otherPerson.profilePicture}:require('../assets/groupChat.png')} style={{height: '100%', width: '100%', resizeMode: 'contain', borderRadius: 20}} />
                          {this.state.user.pinnedConversations.includes(conversation._id) ? <FontAwesomeIcon icon={faThumbtack} style={{position: 'absolute', top: -20, left: -5, height: 15, width: 15, fontSize: 10, color: 'rgb(150, 0, 2)', transform: [{ rotate: '-45deg' }]}} /> : null}
                        </View>
                        
                      </APressable>
                      <View style={styles.messageCont2}>
                        <View style={styles.conversationTitle}>
                          {biConvo ? (
                            <FormatUsername size={20} user={otherPerson} />
                          ) : (
                            <Text style={{color: 'white', fontSize: 20}}>{conversation.title}</Text>
                          )}
                          
                        </View>
                        {biConvo ? (
                          <Text style={{color: '#838383'}}>{otherPerson.firstName + ' ' + otherPerson.lastName}</Text>
                        ) : (
                          <Text style={{color: '#838383'}}>{conversation.members.length} members</Text>
                        )}
                        
                      </View>
                      
                      <View style={styles.messageCont3}>
                          <View>
                            { conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1].sentBy === this.state.user._id ? conversation.seenBy.filter(u => u !== this.state.user._id).length > 0 ? (
                              <Image source={require('../assets/conversationSeenStatus/sentOpened.png')} style={styles.convoSeenStatusStyle} />
                            ) : (<Image source={require('../assets/conversationSeenStatus/sent.png')} style={styles.convoSeenStatusStyle} />) : conversation.seenBy.includes(this.state.user._id) ? (
                              <Image source={require('../assets/conversationSeenStatus/receivedOpened.png')} style={styles.convoSeenStatusStyle} />
                            ) : (
                              <Image source={require('../assets/conversationSeenStatus/received.png')} style={styles.convoSeenStatusStyle} />
                            ) : null}
                          </View>
                          <View>
                              <Text style={{fontSize: 15, color: '#BE3331', fontWeight: 'bold'}}>{formatLastOnline(conversation.dateActive)}</Text>
                          </View>
                      </View>
                    </View>
                  </APressable>
                );
              })}

            </ScrollView>
          </APressable>

          {/* FRIENDS WIDGET */}
          <APressable onPress={() => this.focusWidget('friends')} style={[styles.friendsCont, {maxHeight: this.checkMaxHeight('friends'), display: this.checkDisplay('friends')}]}>
            <View style={[styles.messagesHeader, {height: 30, marginTop: 10}]}>
              <FontAwesomeIcon icon={faUserGroup} size={25} color="#fff" />
              <Text style={{flex: 1, color: '#a4a4a4', fontSize: 15, marginLeft: 10}}>My friends:</Text>
              <View style={{height: 40, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 999999, marginTop: 10,}}>
                <FontAwesomeIcon icon={this.state.focusedWidget==='friends'?faTimes:faHandPointer} size={20} color="#fff" />
              </View>
            </View>
            <ScrollView scrollEnabled={this.state.focusedWidget === 'friends'?true:false} style={[styles.friendsScrollView]} contentContainerStyle={{justifyContent: 'flex-start', alignItems: 'flex-start',}}>
              {this.state.user.friends.length === 0 && (
                <View style={styles.noMessages}>
                  <Text style={{color: '#a4a4a4', fontSize: 17}}>No friends added yet</Text>
                </View>
              )}
              {this.state.user.friends.sort((a, b) => new Date(b.lastOnline).getTime() - new Date(a.lastOnline).getTime()).map((friend, index) => {
                return (
                  <APressable onPress={() => this.props.popupProfile(friend)} key={index} style={{height: 70, width: '100%', marginBottom: 5,}}>
                    <View style={styles.friendCont}>
                    {this.props.getCurrentlyOnline(friend._id)? (
                          <View style={styles.messageOnlineStatusOnline}></View>
                      ):(
                          <View style={{}}>
                              <Text style={{width: '100%', textAlign: 'center', color: '#a4a4a4'}}>{formatLastOnline(friend.lastOnline)}</Text>
                              <Text style={{width: '100%', textAlign: 'center', color: '#a4a4a4'}}>ago</Text>
                              
                          </View>
                      )}
                      <Image style={{height: 45, width: 45, borderRadius: 25,marginLeft: 10}} source={{uri: friend.profilePicture}} />
                      <View style={styles.friendName}>
                        <Text style={{color: '#a4a4a4', fontSize: 14, marginTop: 5,}}>{friend.firstName}</Text>
                        <Text style={{color: '#a4a4a4', fontSize: 14}}>{friend.lastName}</Text>
                      </View>
                      <View style={styles.friendBtns}>
                        <View>
                          <FontAwesomeIcon icon={faEllipsis} size={25} color="#fff" />
                        </View>
                      </View>

                    </View>
                  </APressable>
                  
                )
              })}
            </ScrollView>
          </APressable> 

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
  messageContCont: {
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 100,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 25,
    marginBottom: 10,
  },
  messageCont: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    width: '100%',
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
    borderRadius: 999999,
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

  },
  convoSeenStatusStyle: {
    width: 30,
    height: 30,
  }

});

export default DashHome;