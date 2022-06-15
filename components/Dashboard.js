import { faHome, faPerson, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { StyleSheet, Text, View, Animated, Image, SafeAreaView } from 'react-native';

import DashHome from './DashHome';
import DashProfile from './DashProfile';
import DashSearch from './DashSearch';
import DashDock from './DashDock';
import PopupProfile from './PopupProfile';
import fadeIn from './animations/fadeIn';
import fadeOut from './animations/fadeOut';

class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dashPage: 'home',
            user: props.user,
            conversations: props.conversations,
            dashDock: React.createRef(),
            popupProfile: React.createRef(),
            dashHome: React.createRef(),
            dashSearch: React.createRef(),
            dashProfile: React.createRef(),
        }

        this.animation = new fadeIn(500);
        this.animation.continue = false;
        this.animation.start();

        this.dashAnimation = new fadeOut(300);
        this.dashAnimation.continue = false;

        this.setDashPage = this.setDashPage.bind(this);
        this.fadeOutCurrentPage = this.fadeOutCurrentPage.bind(this);
        this.fadeInNewPage = this.fadeInNewPage.bind(this);
        this.updateConversations = this.updateConversations.bind(this);
        this.animateSetDashPage = this.animateSetDashPage.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.popupProfile = this.popupProfile.bind(this);

    }


    setDashPage(page) {
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
    }
    updateUser(user) {
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
    }

    popupProfile(profile) {
        this.state.popupProfile.current.popupProfile(profile);
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
                    />
                </Animated.View>
                )}
                <DashDock ref={this.state.dashDock} setDashPage={this.setDashPage} dashPage={this.state.dashPage} fadeOutCurrentPage={this.fadeOutCurrentPage} dashAnimationValue={this.dashAnimation.value} />

                {/* PROFILE POP UP WIDGET */}
                <PopupProfile
                ref={this.state.popupProfile}
                user={this.state.user}
                updateUser={this.updateUser}

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