import {Animated, Easing} from 'react-native';

class loginSlide {
    constructor(duration, length) {
        this.duration = duration;
        this.length = length;
        this.value = new Animated.Value(0);

        this.slideLeft = this.slideLeft.bind(this);
        this.slideRight = this.slideRight.bind(this);
        this.getValue = this.getValue.bind(this);
    }

    slideLeft() {
        Animated.timing(this.value, {
            toValue: this.length,
            duration: this.duration,
            easing: Easing.bezier(0.13, .87, .5, .99),
            useNativeDriver: true,
        }).start();
    }

    slideRight() {
        Animated.timing(this.value, {
            toValue: 0,
            duration: this.duration,
            easing: Easing.bezier(0.13, .87, .5, .99),
            useNativeDriver: true,
        }).start();
    }

    getValue() {
        return this.value;
    }
}

export default loginSlide;