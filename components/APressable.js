import React from 'react';
import { View, Text, Animated, Easing, Pressable } from 'react-native';

class APressable extends React.Component {
    constructor(props) {
        super(props);

        this.dur = 300;
        this.toValue = props.value || 0.90;

        this.state = {
            value: new Animated.Value(1),
        }

        this.start = this.start.bind(this);
        this.end = this.end.bind(this);

    }

    start() {
        Animated.timing(this.state.value, {
            toValue: this.toValue,
            duration: this.dur/2,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start();
    }

    end() {
        Animated.timing(this.state.value, {
            toValue: 1,
            duration: this.dur,
            easing: Easing.bezier(.62,1.65,.39,1.08),
            useNativeDriver: true,
        }).start();
    }

    render() {
        return (
            
                <Animated.View {...this.props} style={[this.props.style, {transform: [{scale: this.state.value}]}]} >
                    <Pressable onPress={this.props.onPress}  onPressIn={this.start} onPressOut={this.end} style={{height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center'}}>
                
                    {this.props.children}

                    </Pressable>
                </Animated.View>
            
        )
    }
} 

export default APressable;
