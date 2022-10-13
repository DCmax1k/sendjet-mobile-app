import {View, Text, Dimensions, Pressable, Animated} from 'react-native';
import React, {Component} from 'react';
import anim, { FadeOut, FadeInDown} from 'react-native-reanimated';

import colorFade from './animations/colorFade';

class OptionsMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            buttons: props.buttons, // [ OptionButton ]
        }
        this.width = props.width;
        this.closeMenu = props.closeMenu;

        this.submitBackgroundAnimation = new colorFade('#252525', '#3E3E3E');

    }


    render() {
        return (
                <anim.View entering={FadeInDown} exiting={FadeOut}  style={[{width: Dimensions.get('window').width*0.95, padding: 10,}]}>

                    <Pressable onPress={this.closeMenu} onPressIn={this.submitBackgroundAnimation.transition1} onPressOut={this.submitBackgroundAnimation.transition2} style={{ width: '100%', height: 50, borderRadius: 10, marginBottom: 15, shadowColor: 'black', shadowOpacity: 1, shadowRadius: 3, shadowOffset: {width: 0, height: 0} }}>
                        <Animated.View style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', backgroundColor: this.submitBackgroundAnimation.getValue(), borderRadius: 10 }} >
                            <Text style={{color: '#ECECEC', fontSize: 18, fontWeight: '900'}} >Done</Text>
                        </Animated.View>
                        
                    </Pressable>

                    <View style={{ backgroundColor: '#252525', width: '100%', backgroundColor: '#252525', borderRadius: 10, shadowColor: 'black', shadowOpacity: 1, shadowRadius: 3, shadowOffset: {width: 0, height: 0} }}>
                        {this.state.buttons.map((btn, i) => {
                            const buttonAnimation = new colorFade('#252525', '#3E3E3E');
                            return(
                                <Pressable key={i} onPress={() => {btn.cb(); this.closeMenu()}} onPressIn={buttonAnimation.transition1} onPressOut={buttonAnimation.transition2} style={{ height: 55, borderTopColor: '#616161', borderTopWidth: i==0?0:1}}>
                                    <Animated.View style={{justifyContent: 'center', alignItems: 'flex-start', height: '100%', width: '100%', backgroundColor: buttonAnimation.getValue(), borderRadius: 10 }} >
                                        <Text style={{color: btn.color, fontSize: 18, fontWeight: '300', paddingLeft: 15}}>{btn.title}</Text>
                                    </Animated.View>
                                    
                                </Pressable>
                            )
                        })}
                    </View>
                    
                </anim.View>
        )
    }
}

export default OptionsMenu;