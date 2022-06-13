import { faHome, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { Component } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Pressable, Dimensions, Animated } from 'react-native';

import DockSlider from './animations/dockSlider';

class DashDock extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            dashPage: props.dashPage,
        };

        this.slidePos1 = 0;
        this.slidePos3 = ((Dimensions.get('window').width*0.93)/3)*2;
        this.slideAnimation = new DockSlider(this.slidePos1, this.slidePos3);

        this.setDashPage = this.setDashPage.bind(this);
        this.setSlideBarLocation = this.setSlideBarLocation.bind(this);
    }

    setDashPage(page) {
        this.setSlideBarLocation(page);
        this.props.setDashPage(page);
        setTimeout(() => {
            this.setState({
                dashPage: page,
            });
        },300);
    }

    setSlideBarLocation(page) {
        if (page === 'search') {
            this.slideAnimation.setLocation(0);
        } else if (page === 'home') {
            this.slideAnimation.setLocation(1);
        }
        else if (page === 'profile') {
            this.slideAnimation.setLocation(2);
        }
    }

    render() {
        return (
            <View style={styles.dock}>
                    <View style={styles.dockCont}>
                        <SafeAreaView style={styles.dockItems}>
                            <Animated.View style={[styles.sliderCont, {transform: [{translateX: this.slideAnimation.getValue()}]}]}>
                                <View style={styles.sliderBar}></View>
                            </Animated.View>
                            <Pressable onPress={() => {this.setDashPage('search')}} style={styles.dockItem}>
                                <FontAwesomeIcon icon={faSearch} size={30} color={this.state.dashPage==='search'?'#fff':'#a4a4a4'} />
                            </Pressable>
                            <Pressable onPress={() => {this.setDashPage('home')}} style={styles.dockItem}>
                                <FontAwesomeIcon icon={faHome} size={30} color={this.state.dashPage==='home'?'#fff':'#a4a4a4'} />
                            </Pressable>
                            <Pressable onPress={() => {this.setDashPage('profile')}} style={styles.dockItem}>
                                <Image style={styles.profileImage} source={require('../assets/roundIcon.png')} />
                            </Pressable>
                        </SafeAreaView>
                        
                    </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    dock: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    dockCont: {
        width: '93%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.22)',
    },
    dockItems: {
        height: 100,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dockItem: {
        width: '33.33%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',

    },
    profileImage: {
        height: '60%',
        width: '60%',
        resizeMode: 'contain',
    },
    sliderCont: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 8,
        width: '33.33%',
        justifyContent: 'center',
        alignItems: 'center',
        // transform: [{translateX: }], // animated
    },
    sliderBar: {
        height: '100%',
        width: '30%',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
});

export default DashDock;