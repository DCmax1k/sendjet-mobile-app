import {Animated, Easing} from 'react-native';

class colorFade {
    constructor(color1, color2) {
        this.value = new Animated.Value(0);
        this.color1 = color1;
        this.color2 = color2;
        this.duration = 100;

        this.transition1 = this.transition1.bind(this);
        this.transition2 = this.transition2.bind(this);
        this.getValue = this.getValue.bind(this);
    }

    transition1() {
        Animated.timing(this.value, {
            toValue: 1,
            duration: this.duration,
            easing: Easing.bezier(0.13, .87, .5, .99),
            useNativeDriver: false,
        }).start();
    }

    transition2() {
        Animated.timing(this.value, {
            toValue: 0,
            duration: this.duration,
            easing: Easing.bezier(0.13, .87, .5, .99),
            useNativeDriver: false,
        }).start();
    }

    getValue() {
        return this.value.interpolate({
            inputRange: [0, 1],
            outputRange: [this.color1, this.color2],
        });
    }
}

export default colorFade;