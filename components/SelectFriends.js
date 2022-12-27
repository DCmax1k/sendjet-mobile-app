import React, {Component} from 'react';
import {Dimensions, ScrollView, Text, View, Image} from 'react-native';
import anim, { FadeOut, FadeInDown} from 'react-native-reanimated';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import APressable from './APressable';
import FormatUsername from './FormatUsername';

class SelectFriends extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: this.props.user,
            friendsSelected: [], // just id's of friends selected
            members: this.props.members, // ids of users alr in conversation

        }

        this.selectUser = this.selectUser.bind(this);
        this.done = this.done.bind(this);

    }

    done() {
        if (this.state.friendsSelected.length == 0) return this.props.closeMenu(); 
        // Call parent function to add users
        this.props.addUsersReturn(this.state.friendsSelected);
        
    }

    selectUser(id) {
        if (!this.state.friendsSelected.includes(id)) {
            // Select user
            const friendsSelected = this.state.friendsSelected;
            friendsSelected.push(id);
            this.setState({
                friendsSelected,
            });
        } else {
            // Unselect user
            let friendsSelected = this.state.friendsSelected;
        friendsSelected = friendsSelected.filter(userid => userid != id);
        this.setState({
            friendsSelected,
        });
        }
    }

    render() {
        return (
            <anim.View entering={FadeInDown} exiting={FadeOut} style={{width: '100%', backgroundColor: '#252525', borderRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10}}>
                {/* Title */}
                <View style={{width: '100%', marginBottom: 3}}>
                    <Text style={{color: '#505050', fontSize: 20, width: '100%', textAlign: 'center'}}>SELECT FRIENDS</Text>
                </View>

                {/* Friends list */}
                <View style={{height: Dimensions.get('screen').height*0.4 , width: '100%'}}>
                    <ScrollView style={{height: '100%', width: '100%'}}>
                        {this.state.user.friends.map(friend => {
                            const selected = this.state.friendsSelected.includes(friend._id);
                            const inConvo = this.state.members.includes(friend._id);
                            return (
                                <APressable key={friend._id} onPress={inConvo ? null : () => this.selectUser(friend._id)} style={{width: '100%', height: 70, backgroundColor: selected ? '#5A5A5A' : 'transparent', marginBottom: 3, borderRadius: 10}}>
                                    <View style={{height: '100%', width: '100%', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
                                        {/* Select status */}
                                        {inConvo ? (
                                            <View style={{width: 25, height: 25, borderRadius: 999, borderWidth: 0, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center'}}>
                                                <FontAwesomeIcon size={15} color={'white'} icon={faUserCheck} />
                                            </View>
                                        ) : selected ? (
                                            <View style={{width: 20, height: 20, borderRadius: 999, borderWidth: 0, backgroundColor: '#3A66FF'}}></View>
                                        ) : (
                                            <View style={{width: 20, height: 20, borderRadius: 999, borderColor: '#C7C7C7', borderWidth: 5}}></View>
                                        )}
                                        
                                        {/* Profile img */}
                                        <Image source={{uri: friend.profilePicture}} style={{height: 40, width: 40, resizeMode: 'contain', borderRadius: 99999, marginRight: 10, marginLeft: 10}} />
                                        {/* Username */}
                                        <FormatUsername size={15} user={friend} />
                                    </View>
                                </APressable>
                            )
                        })}
                    </ScrollView>
                </View>

                {/* Submit */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10}}>
                    <APressable onPress={this.done} style={{backgroundColor: '#3A66FF', padding: 10, height: 50, borderRadius: 10}}>
                        <Text style={{color: 'white', fontSize: 16}}>{this.state.friendsSelected.length == 0 ? 'Cancel' : this.state.friendsSelected.length == 1 ? 'Add 1 user' : 'Add ' + this.state.friendsSelected.length + ' users'}</Text>
                    </APressable>
                </View>
            </anim.View>
        );
    }
}

export default SelectFriends;